import { listarCatalogo } from '../services/cartografia-service.js';
import { excluirOnibus, listarFrota, salvarOnibus } from '../services/frota-viagens-service.js';
import { criarElemento, limparElemento } from '../utils/dom-seguro.js';
import { renderizarBarraNavegacao, renderizarEstado } from './navegacao-comum.js';

function inicializarFrota() {
  renderizarBarraNavegacao('navbar-principal', { prefixo: '../' });

  const secLista = document.getElementById('sec-lista-frota');
  const secForm = document.getElementById('sec-form-onibus');
  const listaEl = document.getElementById('lista-onibus');
  const selectProp = document.getElementById('onibus-propulsao');
  const modal = document.getElementById('modal-excluir-onibus');

  let editandoId = null;
  let idParaExcluir = null;

  for (const prop of listarCatalogo('propulsoes')) {
    selectProp.appendChild(
      criarElemento('option', { text: `${prop.nome} (${prop.velocidadeCruzeiroC} c)`, attrs: { value: String(prop.id) } })
    );
  }

  function mostrarForm(onibus = null) {
    editandoId = onibus ? onibus.id : null;
    document.getElementById('onibus-nome').value = onibus ? onibus.identificacao : '';
    document.getElementById('onibus-assentos').value = onibus ? String(onibus.totalAssentos) : '24';
    if (onibus) {
      selectProp.value = String(onibus.tipoPropulsaoId);
    }
    secLista.classList.add('oculto');
    secForm.classList.remove('oculto');
  }

  function renderizar() {
    const frota = listarFrota();
    if (frota.length === 0) {
      renderizarEstado(listaEl, {
        tipo: 'empty',
        titulo: 'Nenhum ônibus espacial cadastrado',
        mensagem: 'Cadastre seu primeiro veículo para publicar linhas interestelares.',
        acaoTexto: 'Cadastrar ônibus espacial',
        onAcao: () => mostrarForm(null),
      });
      return;
    }

    limparElemento(listaEl);
    for (const o of frota) {
      const card = criarElemento('article', { className: 'card viagem-card__topo' });
      const info = criarElemento('div');
      info.appendChild(criarElemento('h2', { className: 'card__titulo', text: o.identificacao }));
      info.appendChild(
        criarElemento('p', {
          className: 'card__subtitulo',
          text: `Tecnologia de propulsão: ${o.propulsaoNome} · ${o.totalAssentos} poltronas`,
        })
      );

      const acoes = criarElemento('div', { className: 'navbar__acoes' });
      const btnEditar = criarElemento('button', { type: 'button', className: 'botao botao--primario', text: 'Editar ônibus', dataset: { acao: 'editar', id: String(o.id) } });
      const btnExcluir = criarElemento('button', { type: 'button', className: 'botao botao--perigo', text: 'Excluir', dataset: { acao: 'excluir', id: String(o.id), nome: o.identificacao } });
      acoes.append(btnEditar, btnExcluir);

      card.append(info, acoes);
      listaEl.appendChild(card);
    }
  }

  listaEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-acao]');
    if (!btn) {
      return;
    }
    const id = Number(btn.dataset.id);
    if (btn.dataset.acao === 'editar') {
      const onibus = listarFrota().find((o) => o.id === id);
      mostrarForm(onibus);
    } else if (btn.dataset.acao === 'excluir') {
      idParaExcluir = id;
      document.getElementById('texto-excluir-onibus').textContent = `Remover ${btn.dataset.nome} da frota?`;
      modal.classList.remove('oculto');
    }
  });

  document.getElementById('btn-novo-onibus').addEventListener('click', () => mostrarForm(null));
  document.getElementById('btn-cancelar-onibus').addEventListener('click', () => {
    secForm.classList.add('oculto');
    secLista.classList.remove('oculto');
  });

  document.getElementById('form-onibus').addEventListener('submit', (e) => {
    e.preventDefault();
    const nome = document.getElementById('onibus-nome').value.trim();
    if (!nome) {
      return;
    }
    const propId = Number(selectProp.value);
    const prop = listarCatalogo('propulsoes').find((p) => p.id === propId);
    salvarOnibus({
      id: editandoId,
      identificacao: nome,
      tipoPropulsaoId: propId,
      propulsaoNome: prop ? prop.nome : 'Antimatéria',
      totalAssentos: Number(document.getElementById('onibus-assentos').value),
    });
    secForm.classList.add('oculto');
    secLista.classList.remove('oculto');
    renderizar();
  });

  document.getElementById('btn-cancelar-excluir-onibus').addEventListener('click', () => {
    idParaExcluir = null;
    modal.classList.add('oculto');
  });
  document.getElementById('btn-confirmar-excluir-onibus').addEventListener('click', () => {
    if (idParaExcluir !== null) {
      excluirOnibus(idParaExcluir);
      idParaExcluir = null;
      modal.classList.add('oculto');
      renderizar();
    }
  });

  renderizar();
}

document.addEventListener('DOMContentLoaded', inicializarFrota);
