import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT_FRONTEND = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function listarArquivos(dir, extensoes) {
  const saida = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const completo = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      saida.push(...listarArquivos(completo, extensoes));
    } else if (extensoes.some((ext) => entry.name.endsWith(ext))) {
      saida.push(completo);
    }
  }
  return saida;
}

test('deveGarantirAusenciaDeInnerHTMLOuInlineHandlers_emTodoFrontEnd', () => {
  const jsFiles = listarArquivos(path.join(ROOT_FRONTEND, 'js'), ['.js']);
  const htmlFiles = listarArquivos(ROOT_FRONTEND, ['.html']);

  for (const arq of jsFiles) {
    const conteudo = fs.readFileSync(arq, 'utf8');
    assert.equal(/\.(innerHTML|outerHTML)\s*=|document\.write\s*\(/.test(conteudo), false, `Uso proibido em ${arq}`);
    assert.equal(/\bvar\s+/.test(conteudo), false, `Uso proibido de var em ${arq}`);
  }

  for (const arq of htmlFiles) {
    const conteudo = fs.readFileSync(arq, 'utf8');
    assert.equal(/\s(style|onclick|onchange|onsubmit)\s*=/.test(conteudo), false, `Atributo inline proibido em ${arq}`);
    assert.equal(/<h1\b/.test(conteudo), true, `Deve conter <h1> semântico em ${arq}`);
  }
});
