/**
 * Helpers seguros de criação e atualização de nós DOM.
 * Prevenção estrita contra XSS: proibido usar innerHTML, outerHTML ou document.write.
 */

export function limparElemento(elemento) {
  while (elemento.firstChild) {
    elemento.removeChild(elemento.firstChild);
  }
}

export function criarElemento(tag, opcoes = {}, ...filhos) {
  const el = document.createElement(tag);
  if (opcoes.className) {
    el.className = opcoes.className;
  }
  if (opcoes.id) {
    el.id = opcoes.id;
  }
  if (opcoes.type) {
    el.type = opcoes.type;
  }
  if (opcoes.href) {
    el.href = opcoes.href;
  }
  if (opcoes.for) {
    el.htmlFor = opcoes.for;
  }
  if (opcoes.text !== undefined && opcoes.text !== null) {
    el.textContent = String(opcoes.text);
  }
  if (opcoes.attrs) {
    for (const [chave, valor] of Object.entries(opcoes.attrs)) {
      if (valor !== undefined && valor !== null) {
        el.setAttribute(chave, String(valor));
      }
    }
  }
  if (opcoes.dataset) {
    for (const [chave, valor] of Object.entries(opcoes.dataset)) {
      if (valor !== undefined && valor !== null) {
        el.dataset[chave] = String(valor);
      }
    }
  }
  for (const filho of filhos.flat()) {
    if (filho === null || filho === undefined || filho === false) {
      continue;
    }
    if (typeof filho === 'string' || typeof filho === 'number') {
      el.appendChild(document.createTextNode(String(filho)));
    } else {
      el.appendChild(filho);
    }
  }
  return el;
}

export function criarSvg(tag, attrs = {}, ...filhos) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [chave, valor] of Object.entries(attrs)) {
    if (valor !== undefined && valor !== null) {
      el.setAttribute(chave, String(valor));
    }
  }
  for (const filho of filhos.flat()) {
    if (filho) {
      el.appendChild(filho);
    }
  }
  return el;
}
