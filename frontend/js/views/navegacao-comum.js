import { encerrarSessao, obterUsuarioLogado } from '../services/auth-service.js';
import { criarElemento, limparElemento } from '../utils/dom-seguro.js';

export function renderizarBarraNavegacao(containerId, { prefixo = '', subtitulo = 'Há um universo inteiro esperando por você.', acaoExtra = null } = {}) {
  const container = document.getElementById(containerId);
  if (!container) {
    return;
  }
  limparElemento(container);
  const sessao = obterUsuarioLogado();

  const marca = criarElemento('a', {
    className: 'navbar__marca',
    href: `${prefixo}index.html`,
    text: 'NABUUS',
  });

  const centro = criarElemento('p', {
    className: 'navbar__subtitulo',
    text: subtitulo,
  });

  const acoes = criarElemento('div', { className: 'navbar__acoes' });

  if (acaoExtra) {
    acoes.appendChild(acaoExtra);
  }

  if (!sessao) {
    acoes.appendChild(
      criarElemento('a', { className: 'navbar__link', href: `${prefixo}pages/login.html`, text: 'Entrar' })
    );
    acoes.appendChild(
      criarElemento('a', { className: 'botao botao--primario', href: `${prefixo}pages/registro.html`, text: 'Registrar' })
    );
  } else {
    const mapaPainel = {
      VIAJANTE: { href: `${prefixo}pages/minhas-viagens.html`, label: 'Minhas Viagens' },
      FRETISTA: { href: `${prefixo}pages/fretista-area.html`, label: 'Área do fretista' },
      ASTRONOMO: { href: `${prefixo}pages/astronomo-area.html`, label: 'Área do astrônomo' },
    };
    const destinoPainel = mapaPainel[sessao.perfil] || mapaPainel.VIAJANTE;
    acoes.appendChild(
      criarElemento('span', { className: 'badge', text: `${sessao.nome} · ${sessao.perfil}` })
    );
    acoes.appendChild(
      criarElemento('a', { className: 'botao', href: destinoPainel.href, text: destinoPainel.label })
    );
    const btnSair = criarElemento('button', {
      type: 'button',
      className: 'botao',
      text: 'Sair da conta',
      dataset: { action: 'sair-conta' },
    });
    btnSair.addEventListener('click', () => {
      encerrarSessao();
      window.location.href = `${prefixo}index.html`;
    });
    acoes.appendChild(btnSair);
  }

  const inner = criarElemento('div', { className: 'navbar__inner container-viajante' }, marca, centro, acoes);
  container.appendChild(inner);
}

export function renderizarEstado(container, { tipo, titulo, mensagem, acaoTexto, onAcao }) {
  limparElemento(container);
  const classeExtra = tipo === 'erro' ? ' estado-painel--erro' : '';
  const painel = criarElemento('div', {
    className: `estado-painel${classeExtra}`,
    attrs: { role: tipo === 'erro' ? 'alert' : 'status', 'aria-live': 'polite' },
  });
  painel.appendChild(criarElemento('h2', { className: 'estado-painel__titulo', text: titulo }));
  painel.appendChild(criarElemento('p', { className: 'estado-painel__texto', text: mensagem }));

  if (acaoTexto && typeof onAcao === 'function') {
    const btn = criarElemento('button', {
      type: 'button',
      className: 'botao botao--primario',
      text: acaoTexto,
    });
    btn.addEventListener('click', onAcao);
    painel.appendChild(btn);
  }
  container.appendChild(painel);
}
