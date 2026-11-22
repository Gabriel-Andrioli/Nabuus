import { lerEstado, salvarUltimaBusca } from '../services/api-client.js';
import { criarElemento, limparElemento } from '../utils/dom-seguro.js';
import {
  formatarDataNascimentoDigitada,
  formatarIsoParaDataBr,
  normalizarDataNascimentoParaIso,
  validarDataPartida,
} from '../utils/validadores.js';
import { renderizarBarraNavegacao } from './navegacao-comum.js';

function inicializarHome() {
  renderizarBarraNavegacao('navbar-principal', { prefixo: '' });

  const selectDestino = document.getElementById('select-destino');
  const inputData = document.getElementById('input-data');
  const pickerData = document.getElementById('input-data-picker');
  const btnCalendario = document.getElementById('btn-calendario-home');
  const erroData = document.getElementById('erro-input-data');
  const form = document.getElementById('form-busca-inicial');

  function limparErroData() {
    erroData.textContent = '';
    erroData.classList.add('oculto');
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

  function aplicarMascaraData() {
    const valorAnterior = inputData.value;
    const inicioSelecao = inputData.selectionStart ?? valorAnterior.length;
    const digitosAntes = Math.min(
      valorAnterior.slice(0, inicioSelecao).replace(/\D/g, '').length,
      8
    );
    const formatado = formatarDataNascimentoDigitada(valorAnterior);
    inputData.value = formatado;
    const novaPosicao = Math.min(calcularPosicaoCursorData(digitosAntes), formatado.length);
    inputData.setSelectionRange(novaPosicao, novaPosicao);
    limparErroData();
  }

  pickerData.min = obterDataMinimaPartida();
  pickerData.max = '9999-12-31';

  inputData.addEventListener('keydown', (evento) => {
    if (evento.key === 'Backspace') {
      const inicio = inputData.selectionStart ?? 0;
      const fim = inputData.selectionEnd ?? 0;
      if (inicio === fim && inicio > 1 && inputData.value[inicio - 1] === '/') {
        evento.preventDefault();
        const semDigitoAnterior = inputData.value.slice(0, inicio - 2) + inputData.value.slice(inicio);
        const digitosAntes = semDigitoAnterior.slice(0, inicio - 2).replace(/\D/g, '').length;
        const formatado = formatarDataNascimentoDigitada(semDigitoAnterior);
        inputData.value = formatado;
        const novaPosicao = Math.min(calcularPosicaoCursorData(digitosAntes), formatado.length);
        inputData.setSelectionRange(novaPosicao, novaPosicao);
        limparErroData();
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
    const inicio = inputData.selectionStart ?? inputData.value.length;
    const fim = inputData.selectionEnd ?? inputData.value.length;
    const temSelecao = fim > inicio;
    const totalDigitos = inputData.value.replace(/\D/g, '').length;
    if (totalDigitos >= 8 && !temSelecao) {
      evento.preventDefault();
    }
  });

  inputData.addEventListener('input', aplicarMascaraData);

  btnCalendario.addEventListener('click', () => {
    const isoAtual = normalizarDataNascimentoParaIso(inputData.value);
    pickerData.min = obterDataMinimaPartida();
    pickerData.max = '9999-12-31';
    pickerData.value = isoAtual || '';
    if (typeof pickerData.showPicker === 'function') {
      pickerData.showPicker();
    } else {
      pickerData.focus();
      pickerData.click();
    }
  });

  pickerData.addEventListener('change', () => {
    if (!pickerData.value) {
      return;
    }
    inputData.value = formatarIsoParaDataBr(pickerData.value);
    limparErroData();
  });

  const estado = lerEstado();
  limparElemento(selectDestino);
  selectDestino.appendChild(
    criarElemento('option', { text: 'Todos os destinos disponíveis', attrs: { value: '' } })
  );

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

  form.addEventListener('submit', (evento) => {
    evento.preventDefault();
    if (!validarDataPartida(inputData.value)) {
      erroData.textContent = 'Informe uma data de partida válida no futuro (dd/mm/aaaa).';
      erroData.classList.remove('oculto');
      return;
    }
    limparErroData();
    const destino = selectDestino.value;
    const partida = formatarIsoParaDataBr(normalizarDataNascimentoParaIso(inputData.value));

    salvarUltimaBusca({
      destino,
      partida,
      propulsoes: [],
      custoMaximoBi: '20',
      distanciaMaximaAl: 'Infinity',
      tempoTerraMaximoAnos: 'Infinity',
      ordenacao: 'data-mais-proxima',
    });

    const params = new URLSearchParams();
    params.set('novaBusca', '1');
    if (destino) {
      params.set('destino', destino);
    }
    if (partida) {
      params.set('partida', partida);
    }
    window.location.href = `pages/resultados.html?${params.toString()}`;
  });
}

document.addEventListener('DOMContentLoaded', inicializarHome);
