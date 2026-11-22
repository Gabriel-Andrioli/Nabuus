import { listarCatalogo } from '../services/cartografia-service.js';
import {
  calcularPrecoSugeridoViagem,
  excluirViagemFretista,
  listarFrota,
  listarViagensFretista,
  publicarOuAtualizarViagem,
  sugerirPrecoPorPropulsao,
} from '../services/frota-viagens-service.js';
import { criarElemento, limparElemento } from '../utils/dom-seguro.js';
import { formatarCreditos, formatarVelocidadeC } from '../utils/formatadores.js';
import {
  converterPartidaTextoParaIso,
  formatarDataNascimentoDigitada,
  formatarIsoParaDataBr,
  formatarIsoParaPartidaTexto,
  normalizarDataNascimentoParaIso,
  validarFormularioViagemFretista,
} from '../utils/validadores.js';
import { renderizarBarraNavegacao, renderizarEstado } from './navegacao-comum.js';

function inicializarFretistaViagens() {
  renderizarBarraNavegacao('navbar-principal', { prefixo: '../' });

  const secLista = document.getElementById('sec-lista-viagens');
  const secConfig = document.getElementById('sec-configurar-viagem');
  const secRevisar = document.getElementById('sec-revisar-viagem');
  const listaEl = document.getElementById('lista-viagens-fretista');
  const selDestino = document.getElementById('fv-destino');
  const selOnibus = document.getElementById('fv-onibus');
  const inputPartida = document.getElementById('fv-partida');
  const pickerPartida = document.getElementById('fv-partida-picker');
  const btnCalendarioPartida = document.getElementById('btn-calendario-partida');
  const inputLugares = document.getElementById('fv-lugares');
  const inputPreco = document.getElementById('fv-preco');
  const erroPartida = document.getElementById('erro-fv-partida');
  const erroPreco = document.getElementById('erro-fv-preco');
  const sugestaoFormulaEl = document.getElementById('sugestao-formula');
  const notificacaoSugestao = document.getElementById('notificacao-preco-sugerido');
  const modal = document.getElementById('modal-excluir-viagem');

  let rascunho = null;
  let editandoId = null;
  let idParaExcluir = null;
  let timeoutNotificacao = null;
  let sequenciaSugestao = 0;

  function limparErrosFormulario() {
    erroPartida.textContent = '';
    erroPreco.textContent = '';
  }

  function ocultarNotificacaoSugestao() {
    if (timeoutNotificacao) {
      clearTimeout(timeoutNotificacao);
      timeoutNotificacao = null;
    }
    notificacaoSugestao.textContent = '';
    notificacaoSugestao.classList.add('oculto');
  }

  function mostrarNotificacaoSugestao(mensagem) {
    if (timeoutNotificacao) {
      clearTimeout(timeoutNotificacao);
    }
    notificacaoSugestao.textContent = mensagem;
    notificacaoSugestao.classList.remove('oculto');
    timeoutNotificacao = setTimeout(() => {
      notificacaoSugestao.classList.add('oculto');
      timeoutNotificacao = null;
    }, 4000);
  }

  function obterOnibusSelecionado() {
    const frota = listarFrota();
    return frota.find((o) => o.id === Number(selOnibus.value)) || frota[0];
  }

  function atualizarAssentosDaNaveSelecionada() {
    const onibus = obterOnibusSelecionado();
    const total = Number(onibus?.totalAssentos || 24);
    inputLugares.value = `${total} poltronas`;
  }

  function formatarTextoFormulaSugestao(calculo) {
    const baseFormula = `${formatarCreditos(calculo.precoBaseSugerido)} (base) + ${formatarCreditos(calculo.custoAnoLuzSugerido)}/ano-luz`;
    if (calculo.paradas > 0) {
      return `${baseFormula} + ${calculo.paradas} parada(s) (${formatarCreditos(calculo.paradas * calculo.custoPorParada)})`;
    }
    return baseFormula;
  }

  async function calcularEExibirFormulaSugestao() {
    const token = ++sequenciaSugestao;
    const onibus = obterOnibusSelecionado();
    const destinoNome = selDestino.value;
    const propId = onibus ? onibus.tipoPropulsaoId : 1;
    const sugestaoBase = await sugerirPrecoPorPropulsao(propId);
    const calculo = calcularPrecoSugeridoViagem({
      destinoNome,
      onibusId: onibus?.id,
      sugestaoBase,
    });
    if (token !== sequenciaSugestao) {
      return null;
    }
    sugestaoFormulaEl.textContent = formatarTextoFormulaSugestao(calculo);
    return calculo;
  }

  function obterDataMinimaPartida() {
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const ano = amanha.getFullYear();
    const mes = String(amanha.getMonth() + 1).padStart(2, '0');
    const dia = String(amanha.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  function calcularPosicaoCursorData(digitosAntes) {
    if (digitosAntes <= 2) {
      return digitosAntes;
    }
    if (digitosAntes <= 4) {
      return digitosAntes + 1;
    }
    return digitosAntes + 2;
  }

  function aplicarMascaraDataPartida() {
    const valorAnterior = inputPartida.value;
    const inicioSelecao = inputPartida.selectionStart ?? valorAnterior.length;
    const digitosAntes = Math.min(
      valorAnterior.slice(0, inicioSelecao).replace(/\D/g, '').length,
      8
    );
    const formatado = formatarDataNascimentoDigitada(valorAnterior);
    inputPartida.value = formatado;
    const novaPosicao = Math.min(calcularPosicaoCursorData(digitosAntes), formatado.length);
    inputPartida.setSelectionRange(novaPosicao, novaPosicao);
    erroPartida.textContent = '';
  }

  pickerPartida.min = obterDataMinimaPartida();
  pickerPartida.max = '9999-12-31';

  inputPartida.addEventListener('keydown', (evento) => {
    if (evento.key === 'Backspace') {
      const inicio = inputPartida.selectionStart ?? 0;
      const fim = inputPartida.selectionEnd ?? 0;
      if (inicio === fim && inicio > 1 && inputPartida.value[inicio - 1] === '/') {
        evento.preventDefault();
        const semDigitoAnterior = inputPartida.value.slice(0, inicio - 2) + inputPartida.value.slice(inicio);
        const digitosAntes = semDigitoAnterior.slice(0, inicio - 2).replace(/\D/g, '').length;
        const formatado = formatarDataNascimentoDigitada(semDigitoAnterior);
        inputPartida.value = formatado;
        const novaPosicao = Math.min(calcularPosicaoCursorData(digitosAntes), formatado.length);
        inputPartida.setSelectionRange(novaPosicao, novaPosicao);
      }
      return;
    }
    if (evento.ctrlKey || evento.metaKey || evento.altKey || evento.key.length !== 1) {
      return;
    }
    if (!/^\d$/.test(evento.key)) {
      evento.preventDefault();
      return;
    }
    const inicio = inputPartida.selectionStart ?? inputPartida.value.length;
    const fim = inputPartida.selectionEnd ?? inputPartida.value.length;
    const temSelecao = fim > inicio;
    const totalDigitos = inputPartida.value.replace(/\D/g, '').length;
    if (totalDigitos >= 8 && !temSelecao) {
      evento.preventDefault();
    }
  });

  inputPartida.addEventListener('input', aplicarMascaraDataPartida);

  btnCalendarioPartida.addEventListener('click', () => {
    const isoAtual = normalizarDataNascimentoParaIso(inputPartida.value);
    pickerPartida.min = obterDataMinimaPartida();
    pickerPartida.max = '9999-12-31';
    pickerPartida.value = isoAtual || '';
    if (typeof pickerPartida.showPicker === 'function') {
      pickerPartida.showPicker();
    } else {
      pickerPartida.focus();
      pickerPartida.click();
    }
  });

  pickerPartida.addEventListener('change', () => {
    if (!pickerPartida.value) {
      return;
    }
    inputPartida.value = formatarIsoParaDataBr(pickerPartida.value);
    erroPartida.textContent = '';
  });

  inputPreco.addEventListener('input', () => {
    erroPreco.textContent = '';
  });

  selDestino.addEventListener('change', () => {
    ocultarNotificacaoSugestao();
    void calcularEExibirFormulaSugestao();
  });

  selOnibus.addEventListener('change', () => {
    atualizarAssentosDaNaveSelecionada();
    ocultarNotificacaoSugestao();
    void calcularEExibirFormulaSugestao();
  });

  for (const p of listarCatalogo('planetas')) {
    if (p.nome === 'Terra') {
      continue;
    }
    selDestino.appendChild(criarElemento('option', { text: `${p.nome} (${p.sistemaNome})`, attrs: { value: p.nome } }));
  }

  for (const o of listarFrota()) {
    const versoes = o.versoesPropulsao && o.versoesPropulsao.length > 0
      ? o.versoesPropulsao.map((vr) => `${vr.propulsaoNome} ${formatarVelocidadeC(vr.velocidadeC)}`).join(', ')
      : `${o.propulsaoNome} · ${formatarVelocidadeC(o.velocidadeC)}`;
    selOnibus.appendChild(
      criarElemento('option', {
        text: `${o.identificacao} · ${o.totalAssentos || 24} poltronas (${versoes})`,
        attrs: { value: String(o.id) },
      })
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
          text: `${v.origemNome} · ${v.partidaTexto} · Nave ${v.onibusNome} (${formatarVelocidadeC(v.velocidadeC)}) · ${v.totalAssentos || 24} poltronas · ${formatarCreditos(v.semLumica.precoFinal)}`,
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
    limparErrosFormulario();
    ocultarNotificacaoSugestao();
    editandoId = viagem ? viagem.id : null;
    if (viagem) {
      selDestino.value = viagem.destinoNome;
      selOnibus.value = String(viagem.onibusId || 1);
      const isoPartida = viagem.dataPartidaIso || converterPartidaTextoParaIso(viagem.partidaTexto) || '2100-01-15';
      inputPartida.value = formatarIsoParaDataBr(isoPartida);
      inputPreco.value = String(viagem.semLumica.precoFinal);
    } else {
      inputPartida.value = '15/01/2100';
      inputPreco.value = '0';
    }
    atualizarAssentosDaNaveSelecionada();
    void calcularEExibirFormulaSugestao();
    alternarSecao(secConfig);
  }

  document.getElementById('btn-nova-viagem').addEventListener('click', () => abrirFormulario(null));
  document.getElementById('btn-cancelar-viagem').addEventListener('click', () => alternarSecao(secLista));

  document.getElementById('btn-aplicar-sugestao').addEventListener('click', async () => {
    const calculo = await calcularEExibirFormulaSugestao();
    if (!calculo) {
      return;
    }
    inputPreco.value = String(calculo.precoSugerido);
    erroPreco.textContent = '';
    mostrarNotificacaoSugestao('Preço sugerido aplicado!');
  });

  document.getElementById('form-viagem-fretista').addEventListener('submit', (e) => {
    e.preventDefault();
    limparErrosFormulario();

    const { valido, erros } = validarFormularioViagemFretista({
      partida: inputPartida.value,
      precoFinal: inputPreco.value,
    });

    if (!valido) {
      erroPartida.textContent = erros.partida || '';
      erroPreco.textContent = erros.precoFinal || '';
      return;
    }

    const onibus = obterOnibusSelecionado();
    const dataPartidaIso = normalizarDataNascimentoParaIso(inputPartida.value);
    const partidaTexto = formatarIsoParaPartidaTexto(dataPartidaIso);
    const totalAssentos = Number(onibus?.totalAssentos || 24);

    rascunho = {
      id: editandoId,
      origemNome: document.getElementById('fv-origem').value,
      destinoNome: selDestino.value,
      onibusId: onibus.id,
      onibusNome: onibus.identificacao,
      propulsaoNome: onibus.propulsaoNome,
      velocidadeC: onibus.velocidadeC,
      dataPartidaIso,
      partidaTexto,
      totalAssentos,
      precoFinal: Number(inputPreco.value),
    };

    const revEl = document.getElementById('card-revisao-viagem');
    limparElemento(revEl);
    revEl.appendChild(criarElemento('h2', { className: 'card__titulo', text: `${rascunho.origemNome} → ${rascunho.destinoNome}` }));
    revEl.appendChild(
      criarElemento('p', {
        className: 'texto-secundario',
        text: `Nave selecionada: ${rascunho.onibusNome} (${rascunho.propulsaoNome} · ${formatarVelocidadeC(rascunho.velocidadeC)})`,
      })
    );
    revEl.appendChild(
      criarElemento('p', {
        className: 'texto-secundario',
        text: `Partida: ${rascunho.partidaTexto} · Lugares ofertados: ${rascunho.totalAssentos} poltronas · Preço base calculado: ${formatarCreditos(rascunho.precoFinal)}`,
      })
    );
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
