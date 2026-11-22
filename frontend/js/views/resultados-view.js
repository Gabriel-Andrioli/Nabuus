import { lerEstado, lerUltimaBusca, salvarUltimaBusca } from '../services/api-client.js';
import { atualizarSelecaoAtual } from '../services/passagens-service.js';
import { criarElemento, limparElemento } from '../utils/dom-seguro.js';
import { filtrarViagens, ordenarViagens } from '../utils/filtros-viagem.js';
import { formatarDistanciaAnosLuz, formatarVelocidadeC } from '../utils/formatadores.js';
import {
  converterPartidaTextoParaIso,
  formatarDataNascimentoDigitada,
  formatarIsoParaDataBr,
  normalizarDataNascimentoParaIso,
  validarDataPartida,
} from '../utils/validadores.js';
import { renderizarBarraNavegacao, renderizarEstado } from './navegacao-comum.js';

function inicializarResultados() {
  renderizarBarraNavegacao('navbar-principal', { prefixo: '../' });

  const selectDestino = document.getElementById('busca-destino');
  const inputPartida = document.getElementById('busca-partida');
  const pickerPartida = document.getElementById('busca-partida-picker');
  const btnCalendarioPartida = document.getElementById('btn-calendario-busca-partida');
  const erroPartida = document.getElementById('erro-busca-partida');
  const listaViagensEl = document.getElementById('lista-viagens');
  const contadorEl = document.getElementById('contador-viagens');
  const chipsEl = document.getElementById('chips-filtros');
  const filtroDistancia = document.getElementById('filtro-distancia');
  const selectOrdenacao = document.getElementById('select-ordenacao');

  function limparErroPartida() {
    erroPartida.textContent = '';
    erroPartida.classList.add('oculto');
  }

  function mostrarErroPartida(mensagem) {
    erroPartida.textContent = mensagem;
    erroPartida.classList.remove('oculto');
  }

  function obterDataMinimaPartida() {
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const ano = amanha.getFullYear();
    const mes = String(amanha.getMonth() + 1).padStart(2, '0');
    const dia = String(amanha.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  function normalizarPartidaBuscaParaDataBr(valor) {
    const iso = converterPartidaTextoParaIso(valor);
    return iso ? formatarIsoParaDataBr(iso) : '15/01/2100';
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
    limparErroPartida();
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
        limparErroPartida();
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
    limparErroPartida();
  });

  const estado = lerEstado();

  for (const sistema of estado.sistemas) {
    const planetasDoSistema = estado.planetas.filter((p) => p.sistemaId === sistema.id && p.nome !== 'Terra');
    if (planetasDoSistema.length > 1) {
      selectDestino.appendChild(
        criarElemento('option', {
          text: `${sistema.nome} (Todo o sistema)`,
          attrs: { value: sistema.nome },
        })
      );
    }
  }

  for (const planeta of estado.planetas) {
    if (planeta.nome === 'Terra') {
      continue;
    }
    selectDestino.appendChild(
      criarElemento('option', {
        text: `${planeta.nome} (${planeta.sistemaNome})`,
        attrs: { value: planeta.nome },
      })
    );
  }

  function aplicarEstadoNosControles(busca) {
    selectDestino.value = busca.destino || '';
    inputPartida.value = normalizarPartidaBuscaParaDataBr(busca.partida);
    filtroDistancia.value = busca.distanciaMaximaAl || 'Infinity';
    selectOrdenacao.value = busca.ordenacao || 'relevancia';
    const propSelecionadas = busca.propulsoes || [];
    for (const chk of document.querySelectorAll('input[name="propulsao"]')) {
      chk.checked = propSelecionadas.includes(chk.value);
    }
  }

  const params = new URLSearchParams(window.location.search);
  const veioComParametros = params.has('novaBusca')
    || params.has('destino')
    || params.has('partida')
    || params.has('propulsao')
    || params.has('distancia')
    || params.has('ordenacao');

  if (veioComParametros) {
    const propParam = params.getAll('propulsao').filter(Boolean);
    const buscaInicial = {
      destino: params.get('destino') || '',
      partida: normalizarPartidaBuscaParaDataBr(params.get('partida')),
      propulsoes: propParam,
      distanciaMaximaAl: params.get('distancia') || 'Infinity',
      ordenacao: params.get('ordenacao') || 'relevancia',
    };
    aplicarEstadoNosControles(buscaInicial);
    salvarUltimaBusca(buscaInicial);
  } else {
    aplicarEstadoNosControles(lerUltimaBusca());
  }

  function sincronizarBuscaPersistida(propulsoes) {
    const buscaAtual = {
      destino: selectDestino.value,
      partida: inputPartida.value,
      propulsoes,
      distanciaMaximaAl: filtroDistancia.value,
      ordenacao: selectOrdenacao.value,
    };
    salvarUltimaBusca(buscaAtual);

    const urlParams = new URLSearchParams();
    if (buscaAtual.destino) {
      urlParams.set('destino', buscaAtual.destino);
    }
    if (buscaAtual.partida) {
      urlParams.set('partida', buscaAtual.partida);
    }
    for (const p of propulsoes) {
      urlParams.append('propulsao', p);
    }
    if (buscaAtual.distanciaMaximaAl !== 'Infinity') {
      urlParams.set('distancia', buscaAtual.distanciaMaximaAl);
    }
    if (buscaAtual.ordenacao !== 'relevancia') {
      urlParams.set('ordenacao', buscaAtual.ordenacao);
    }
    const query = urlParams.toString();
    window.history.replaceState(null, '', query ? `resultados.html?${query}` : 'resultados.html');
  }

  function renderizar() {
    const estadoAtual = lerEstado();
    const propulsoes = Array.from(document.querySelectorAll('input[name="propulsao"]:checked')).map((el) => el.value);
    const distanciaMaximaAl = Number(filtroDistancia.value);

    sincronizarBuscaPersistida(propulsoes);

    const filtradas = ordenarViagens(
      filtrarViagens(estadoAtual.viagens, {
        destino: selectDestino.value,
        propulsoes,
        distanciaMaximaAl,
      }),
      selectOrdenacao.value
    );

    contadorEl.textContent = `${filtradas.length} viagens encontradas`;

    limparElemento(chipsEl);
    if (selectDestino.value) {
      chipsEl.appendChild(criarElemento('span', { className: 'chip', text: `Destino: ${selectDestino.value}` }));
    }
    if (propulsoes.length > 0) {
      chipsEl.appendChild(criarElemento('span', { className: 'chip', text: `${propulsoes.length} tecnologias` }));
    }
    if (Number.isFinite(distanciaMaximaAl)) {
      chipsEl.appendChild(criarElemento('span', { className: 'chip', text: `Até ${distanciaMaximaAl} al` }));
    }

    if (filtradas.length === 0) {
      renderizarEstado(listaViagensEl, {
        tipo: 'empty',
        titulo: 'Nenhuma viagem encontrada',
        mensagem: 'Ajuste os filtros aplicados para visualizar outras rotas interestelares.',
        acaoTexto: 'Restaurar filtros',
        onAcao: limparFiltros,
      });
      return;
    }

    limparElemento(listaViagensEl);
    for (const v of filtradas) {
      const rota = estadoAtual.rotasLumicas.find((r) => r.id === v.rotaLumicaId && r.ativa);
      const temLumica = Boolean(rota);
      const propulsoesDisp = v.propulsoesDisponiveis || [v.propulsaoNome];

      const card = criarElemento('article', {
        className: 'viagem-card',
      });

      const principal = criarElemento('div');
      const topo = criarElemento('div', { className: 'viagem-card__topo' });
      const infoTitulo = criarElemento('div');
      infoTitulo.appendChild(criarElemento('h3', { className: 'card__titulo', text: v.destinoNome }));
      infoTitulo.appendChild(
        criarElemento('p', {
          className: 'card__subtitulo',
          text: `${v.origemNome} → ${v.sistemaDestino} · Partida: ${v.partidaTexto} · Nave: ${v.onibusNome} (${formatarVelocidadeC(v.velocidadeC)})`,
        })
      );

      const badgeLumica = criarElemento('span', {
        className: `badge${temLumica ? '' : ' badge--alerta'}`,
        text: temLumica ? 'Com Rota Lúmica' : 'Sem Rota Lúmica',
      });
      topo.append(infoTitulo, badgeLumica);
      principal.appendChild(topo);

      const resumo = criarElemento('div', { className: 'viagem-card__metricas' });
      const addInfo = (rotulo, valor, lavanda = false) => {
        const box = criarElemento('div');
        box.appendChild(criarElemento('p', { className: 'metrica__rotulo', text: rotulo }));
        box.appendChild(
          criarElemento('p', { className: `metrica__valor${lavanda ? ' metrica__valor--lavanda' : ''}`, text: valor })
        );
        resumo.appendChild(box);
      };
      addInfo('Distância', formatarDistanciaAnosLuz(v.distanciaAl));
      addInfo('Classes disponíveis', v.classes.join(' · '));
      addInfo('Propulsões disponíveis', propulsoesDisp.join(' · '));
      addInfo('Rota Lúmica', temLumica ? 'Disponível' : 'Indisponível', temLumica);
      principal.appendChild(resumo);

      const badgesRow = criarElemento('div', { className: 'navbar__acoes' });
      for (const cl of v.classes) {
        badgesRow.appendChild(criarElemento('span', { className: 'badge', text: cl }));
      }
      principal.appendChild(badgesRow);

      const lateral = criarElemento('div', { className: 'viagem-card__lateral' });
      const infoLateral = criarElemento('div');
      infoLateral.appendChild(criarElemento('p', { className: 'metrica__rotulo', text: 'NAVE OPERADORA' }));
      infoLateral.appendChild(criarElemento('p', { className: 'card__subtitulo', text: `${v.onibusNome} · ${v.propulsaoNome}` }));
      lateral.appendChild(infoLateral);

      const btnVer = criarElemento('button', {
        type: 'button',
        className: 'botao botao--primario botao--bloco',
        text: 'Ver viagem →',
      });
      btnVer.addEventListener('click', () => {
        atualizarSelecaoAtual({
          viagemId: v.id,
          propulsaoNome: v.propulsaoNome,
          classe: v.classes[0] || 'Executiva',
          usaRotaLumica: false,
          poltrona: null,
        });
        window.location.href = 'detalhes-viagem.html';
      });
      lateral.appendChild(btnVer);

      card.append(principal, lateral);
      listaViagensEl.appendChild(card);
    }
  }

  function limparFiltros() {
    for (const chk of document.querySelectorAll('input[name="propulsao"]')) {
      chk.checked = false;
    }
    filtroDistancia.value = 'Infinity';
    selectOrdenacao.value = 'relevancia';
    selectDestino.value = '';
    inputPartida.value = '15/01/2100';
    limparErroPartida();
    salvarUltimaBusca({
      destino: '',
      partida: '15/01/2100',
      propulsoes: [],
      distanciaMaximaAl: 'Infinity',
      ordenacao: 'relevancia',
    });
    renderizar();
  }

  function validarPartidaEAtualizar() {
    if (!validarDataPartida(inputPartida.value)) {
      mostrarErroPartida('Informe uma data de partida válida no futuro (dd/mm/aaaa).');
      return;
    }
    limparErroPartida();
    renderizar();
  }

  document.getElementById('btn-aplicar-filtros').addEventListener('click', validarPartidaEAtualizar);
  document.getElementById('btn-limpar-filtros').addEventListener('click', limparFiltros);
  selectOrdenacao.addEventListener('change', validarPartidaEAtualizar);
  selectDestino.addEventListener('change', validarPartidaEAtualizar);
  document.getElementById('form-busca-topo').addEventListener('submit', (e) => {
    e.preventDefault();
    validarPartidaEAtualizar();
  });

  renderizar();
}

document.addEventListener('DOMContentLoaded', inicializarResultados);
