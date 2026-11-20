import { excluirPassagem, listarMinhasPassagens } from '../services/passagens-service.js';
import { criarElemento, limparElemento } from '../utils/dom-seguro.js';
import { formatarCreditos } from '../utils/formatadores.js';
import { renderizarBarraNavegacao, renderizarEstado } from './navegacao-comum.js';

function inicializarMinhasViagens() {
  renderizarBarraNavegacao('navbar-principal', { prefixo: '../' });

  const listaEl = document.getElementById('lista-passagens');
  const modal = document.getElementById('modal-excluir-passagem');
  let idParaExcluir = null;

  function renderizar() {
    const passagens = listarMinhasPassagens();
    if (passagens.length === 0) {
      renderizarEstado(listaEl, {
        tipo: 'empty',
        titulo: 'Nenhuma viagem salva ainda',
        mensagem: 'Você ainda não confirmou nenhuma passagem intergaláctica.',
        acaoTexto: 'Explorar viagens disponíveis',
        onAcao: () => {
          window.location.href = 'resultados.html';
        },
      });
      return;
    }

    limparElemento(listaEl);
    for (const p of passagens) {
      const card = criarElemento('article', { className: 'viagem-card' });
      const info = criarElemento('div');
      info.appendChild(criarElemento('p', { className: 'card__eyebrow', text: `${p.tecnologia} · ${p.usaRotaLumica ? 'Com Rota Lúmica' : 'Sem Rota Lúmica'}` }));
      info.appendChild(criarElemento('h2', { className: 'card__titulo', text: p.destinoNome }));
      info.appendChild(
        criarElemento('p', {
          className: 'card__subtitulo',
          text: `${p.origemNome} · ${p.dataPartida} → ${p.chegadaEstimada} · Poltrona ${p.assento} (${p.classe})`,
        })
      );

      const lateral = criarElemento('div', { className: 'viagem-card__lateral' });
      lateral.appendChild(criarElemento('p', { className: 'viagem-card__preco', text: formatarCreditos(p.valorPago) }));
      const btnExcluir = criarElemento('button', {
        type: 'button',
        className: 'botao botao--perigo',
        text: 'Excluir passagem',
        dataset: { id: String(p.id), destino: p.destinoNome },
      });
      lateral.appendChild(btnExcluir);

      card.append(info, lateral);
      listaEl.appendChild(card);
    }
  }

  listaEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-id]');
    if (!btn) {
      return;
    }
    idParaExcluir = Number(btn.dataset.id);
    document.getElementById('texto-modal-excluir-pass').textContent =
      `Deseja remover a passagem selecionada para ${btn.dataset.destino}?`;
    modal.classList.remove('oculto');
  });

  document.getElementById('btn-cancelar-exclusao-pass').addEventListener('click', () => {
    idParaExcluir = null;
    modal.classList.add('oculto');
  });

  document.getElementById('btn-confirmar-exclusao-pass').addEventListener('click', () => {
    if (idParaExcluir !== null) {
      excluirPassagem(idParaExcluir);
      idParaExcluir = null;
      modal.classList.add('oculto');
      renderizar();
    }
  });

  renderizar();
}

document.addEventListener('DOMContentLoaded', inicializarMinhasViagens);
