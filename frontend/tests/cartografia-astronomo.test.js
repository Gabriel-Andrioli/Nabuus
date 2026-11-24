import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { listarCatalogo, salvarPlaneta, salvarRotaLumica, salvarSistema } from '../js/services/cartografia-service.js';

const ROOT_FRONTEND = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function executarComStorageEmMemoria(fn) {
  const storageOriginal = globalThis.localStorage;
  const mapaMemoria = new Map();
  globalThis.localStorage = {
    getItem: (chave) => (mapaMemoria.has(chave) ? mapaMemoria.get(chave) : null),
    setItem: (chave, valor) => mapaMemoria.set(chave, String(valor)),
    removeItem: (chave) => mapaMemoria.delete(chave),
  };

  try {
    return fn();
  } finally {
    if (storageOriginal === undefined) {
      delete globalThis.localStorage;
    } else {
      globalThis.localStorage = storageOriginal;
    }
  }
}

test('devePermitirPlanetaApenasEmSistemaCadastradoENormalizarNome_quandoSalvarPlaneta', () => {
  executarComStorageEmMemoria(() => {
    const planetaExistente = salvarPlaneta({
      nome: 'Aurora b',
      sistemaId: 3,
      sistemaNome: 'Qualquer Nome Ignorado',
      tipo: 'Rochoso',
      distanciaEstrelaUA: 0.08,
      possuiPostoRecarga: true,
    });

    assert.equal(planetaExistente.sistemaId, 3);
    assert.equal(planetaExistente.sistemaNome, 'Proxima Centauri');

    const novoSistema = salvarSistema({
      nome: 'Sistema Borealis',
      configuracao: 'Estrela única',
      distanciaSolAl: 18.5,
      ra: 120.0,
      dec: 14.0,
    });

    assert.ok(listarCatalogo('sistemas').some((s) => s.id === novoSistema.id && s.nome === 'Sistema Borealis'));

    const planetaNovoSistema = salvarPlaneta({
      nome: 'Borealis c',
      sistemaId: novoSistema.id,
      tipo: 'Rochoso',
      distanciaEstrelaUA: 0.42,
      possuiPostoRecarga: false,
    });

    assert.equal(planetaNovoSistema.sistemaId, novoSistema.id);
    assert.equal(planetaNovoSistema.sistemaNome, 'Sistema Borealis');

    assert.throws(
      () =>
        salvarPlaneta({
          nome: 'Planeta Invalido',
          sistemaId: 99999,
          sistemaNome: 'Sistema Inventado',
          tipo: 'Rochoso',
          distanciaEstrelaUA: 1.0,
          possuiPostoRecarga: false,
        }),
      /sistema solar já cadastrado/i
    );
  });
});

test('devePermitirRotaLumicaApenasComDestinoCadastradoEOrigemSolFixa_quandoSalvarRotaLumica', () => {
  executarComStorageEmMemoria(() => {
    const rotaExistente = salvarRotaLumica({
      origemSistema: 'Outro Sistema Digitado',
      destinoSistemaId: 2,
      destinoSistemaNome: 'Nome Ignorado',
      velocidadeC: 0.996,
      pedagio: 50_000_000_000,
      ativa: true,
    });

    assert.equal(rotaExistente.origemSistema, 'Sol');
    assert.equal(rotaExistente.destinoSistemaId, 2);
    assert.equal(rotaExistente.destinoSistemaNome, 'TRAPPIST-1');

    const novoSistema = salvarSistema({
      nome: 'Sistema Vega II',
      configuracao: 'Estrela A0V',
      distanciaSolAl: 25.04,
      ra: 279.23,
      dec: 38.78,
    });

    const rotaNovoSistema = salvarRotaLumica({
      origemSistema: 'Vega',
      destinoSistemaId: novoSistema.id,
      velocidadeC: 0.997,
      pedagio: 75_000_000_000,
      ativa: true,
    });

    assert.equal(rotaNovoSistema.origemSistema, 'Sol');
    assert.equal(rotaNovoSistema.destinoSistemaId, novoSistema.id);
    assert.equal(rotaNovoSistema.destinoSistemaNome, 'Sistema Vega II');

    assert.throws(
      () =>
        salvarRotaLumica({
          origemSistema: 'Sol',
          destinoSistemaId: 99999,
          destinoSistemaNome: 'Destino Inventado',
          velocidadeC: 0.996,
          pedagio: 10_000_000,
          ativa: true,
        }),
      /sistema de destino já cadastrado/i
    );

    assert.throws(
      () =>
        salvarRotaLumica({
          origemSistema: 'Sol',
          destinoSistemaId: 1,
          velocidadeC: 0.996,
          pedagio: 10_000_000,
          ativa: true,
        }),
      /diferente do sistema de origem/i
    );
  });
});

test('deveUsarSelectsParaSistemasECampoFixoNaOrigem_naViewDeCatalogoDoAstronomo', () => {
  const viewPath = path.join(ROOT_FRONTEND, 'js', 'views', 'astronomo-catalogo-view.js');
  const conteudo = fs.readFileSync(viewPath, 'utf8');

  assert.match(conteudo, /adicionarCampoSelect\(\s*'ast-sistema'/);
  assert.match(conteudo, /adicionarCampoSelect\(\s*'ast-destino'/);
  assert.doesNotMatch(conteudo, /adicionarCampoTexto\(\s*'ast-sistema'/);
  assert.doesNotMatch(conteudo, /adicionarCampoTexto\(\s*'ast-destino'/);
  assert.match(conteudo, /adicionarCampoTexto\(\s*'ast-origem',\s*'SISTEMA DE ORIGEM \(FIXO\)',\s*'Sol',\s*'text',\s*\{\s*readonly:\s*true,\s*disabled:\s*true\s*\}/);
});
