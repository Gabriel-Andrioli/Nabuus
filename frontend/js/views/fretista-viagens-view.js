import { listarCatalogo } from '../services/cartografia-service.js';
import {
  excluirViagemFretista,
  listarFrota,
  listarViagensFretista,
  publicarOuAtualizarViagem,
  sugerirPrecoPorPropulsao,
} from '../services/frota-viagens-service.js';
import { criarElemento, limparElemento } from '../utils/dom-seguro.js';
import { formatarCreditos } from '../utils/formatadores.js';
import { renderizarBarraNavegacao, renderizarEstado } from './navegacao-comum.js';

function inicializarFretistaViagens() {
  renderizarBarraNavegacao('navbar-principal', { prefixo: '../' });

  const secLista = document.getElementById('sec-lista-viagens');
  const secConfig = document.getElementById('sec-configurar-viagem');
  const secRevisar = document.getElementById('sec-revisar-viagem');
  const listaEl = document.getElementById('lista-viagens-fretista');
  const selDestino = document.getElementById('fv-destino');
  const selOnibus = document.getElementById('fv-onibus');
  const modal = document.getElementById('modal-excluir-viagem');

  let rascunho = null;
  let editandoId = null;
  let idParaExcluir = null;

  for (const p of listarCatalogo('planetas')) {
    if (p.nome === 'Terra') {
      continue;
    }
    selDestino.appendChild(criarElemento('option', { text: p.nome, attrs: { value: p.nome } }));
  }

  for (const o of listarFrota()) {
    selOnibus.appendChild(
      criarElemento('option', { text: `${o.identificacao} (${o.propulsaoNome})`, attrs: { value: String(o.id) } })
    );
  }

  function alternarSecao(secao) {
    secLista.classList.add('oculto');
    secConfig.classList.add('oculto');
    secRevisar.classList.add('oculto');
    secao.classList.remove('oculto');
  }

  function renderizarLista() {
    const viagens = listarViagensFretista();
    if (viagens.length === 0) {
      renderizarEstado(listaEl, {
        tipo: 'empty',
        titulo: 'Nenhuma viagem publicada',
        mensagem: 'Publique sua primeira linha interestelar.',
        acaoTexto: 'Criar nova viagem',
        onAcao: () => abrirFormulario(),
      });
      return;
    }

    limparElemento(listaEl);
    for (const v of viagens) {
      const card = criarElemento('article', { className: 'card viagem-card__topo' });
      const info = criarElemento('div');
      info.appendChild(criarElemento('p', { className: 'card__eyebrow', text: `${v.codigo} · ${v.status}` }));
      info.appendChild(criarElemento('h2', { className: 'card__titulo', text: v.destinoNome }));
      info.appendChild(
        criarElemento('p', {
          className: 'card__subtitulo',
          text: `${v.origemNome} · ${v.partidaTexto} · ${formatarCreditos(v.semLumica.precoFinal)}`,
        })
      );

      const acoes = criarElemento('div', { className: 'navbar__acoes' });
      acoes.appendChild(criarElemento('button', { type: 'button', className: 'botao', text: 'Editar viagem', dataset: { acao: 'editar', id: String(v.id) } }));
      acoes.appendChild(criarElemento('button', { type: 'button', className: 'botao botao--perigo', text: 'Excluir', dataset: { acao: 'excluir', id: String(v.id), codigo: v.codigo } }));
      card.append(info, acoes);
      listaEl.appendChild(card);
    }
  }

  function abrirFormulario(viagem = null) {
    editandoId = viagem ? viagem.id : null;
    if (viagem) {
      selDestino.value = viagem.destinoNome;
      selOnibus.value = String(viagem.onibusId || 1);
      document.getElementById('fv-partida').value = viagem.partidaTexto;
      document.getElementById('fv-preco').value = String(viagem.semLumica.precoFinal);
    }
    alternarSecao(secConfig);
  }

  document.getElementById('btn-nova-viagem').addEventListener('click', () => abrirFormulario(null));
  document.getElementById('btn-cancelar-viagem').addEventListener('click', () => alternarSecao(secLista));

  document.getElementById('btn-aplicar-sugestao').addEventListener('click', async () => {
    const onibus = listarFrota().find((o) => o.id === Number(selOnibus.value)) || listarFrota()[0];
    const propId = onibus ? onibus.tipoPropulsaoId : 1;
    const sugestao = await sugerirPrecoPorPropulsao(propId);
    const precoSugerido = sugestao.precoBaseSugerido + sugestao.custoAnoLuzSugerido * 4.24;
    document.getElementById('fv-preco').value = String(Math.round(precoSugerido));
    document.getElementById('sugestao-formula').textContent =
      `${formatarCreditos(sugestao.precoBaseSugerido)} (base) + ${formatarCreditos(sugestao.custoAnoLuzSugerido)}/ano-luz`;
  });

  document.getElementById('form-viagem-fretista').addEventListener('submit', (e) => {
    e.preventDefault();
    const onibus = listarFrota().find((o) => o.id === Number(selOnibus.value)) || listarFrota()[0];
    rascunho = {
      id: editandoId,
      origemNome: document.getElementById('fv-origem').value,
      destinoNome: selDestino.value,
      onibusId: onibus.id,
      onibusNome: onibus.identificacao,
      propulsaoNome: onibus.propulsaoNome,
      partidaTexto: document.getElementById('fv-partida').value,
      precoFinal: Number(document.getElementById('fv-preco').value),
    };

    const revEl = document.getElementById('card-revisao-viagem');
    limparElemento(revEl);
    revEl.appendChild(criarElemento('h2', { className: 'card__titulo', text: `${rascunho.origemNome} → ${rascunho.destinoNome}` }));
    revEl.appendChild(criarElemento('p', { className: 'texto-secundario', text: `Ônibus espacial: ${rascunho.onibusNome} (${rascunho.propulsaoNome})` }));
    revEl.appendChild(criarElemento('p', { className: 'texto-secundario', text: `Partida: ${rascunho.partidaTexto} · Preço base calculado: ${formatarCreditos(rascunho.precoFinal)}` }));
    alternarSecao(secRevisar);
  });

  document.getElementById('btn-voltar-ajuste').addEventListener('click', () => alternarSecao(secConfig));
  document.getElementById('btn-publicar-viagem').addEventListener('click', () => {
    if (rascunho) {
      publicarOuAtualizarViagem(rascunho);
      rascunho = null;
      alternarSecao(secLista);
      renderizarLista();
    }
  });

  listaEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-acao]');
    if (!btn) {
      return;
    }
    const id = Number(btn.dataset.id);
    if (btn.dataset.acao === 'editar') {
      abrirFormulario(listarViagensFretista().find((v) => v.id === id));
    } else if (btn.dataset.acao === 'excluir') {
      idParaExcluir = id;
      document.getElementById('texto-excluir-viagem').textContent = `Remover a viagem ${btn.dataset.codigo}?`;
      modal.classList.remove('oculto');
    }
  });

  document.getElementById('btn-cancelar-excluir-viagem').addEventListener('click', () => {
    idParaExcluir = null;
    modal.classList.add('oculto');
  });
  document.getElementById('btn-confirmar-excluir-viagem').addEventListener('click', () => {
    if (idParaExcluir !== null) {
      excluirViagemFretista(idParaExcluir);
      idParaExcluir = null;
      modal.classList.add('oculto');
      renderizarLista();
    }
  });

  const params = new URLSearchParams(window.location.search);
  if (params.get('modo') === 'nova') {
    abrirFormulario(null);
  } else {
    renderizarLista();
  }
}

document.addEventListener('DOMContentLoaded', inicializarFretistaViagens);
