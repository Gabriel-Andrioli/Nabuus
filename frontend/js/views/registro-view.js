import { registrarUsuario } from '../services/auth-service.js';
import {
  IDADE_MAXIMA_ANOS,
  formatarDataNascimentoDigitada,
  formatarIsoParaDataBr,
  normalizarDataNascimentoParaIso,
  validarFormularioRegistro,
} from '../utils/validadores.js';

function inicializarRegistro() {
  let perfil = 'VIAJANTE';
  const grupoPerfis = document.getElementById('lista-perfis-registro');
  const label1 = document.getElementById('label-doc-1');
  const input1 = document.getElementById('reg-doc-1');
  const grupo2 = document.getElementById('grupo-doc-2');
  const label2 = document.getElementById('label-doc-2');
  const input2 = document.getElementById('reg-doc-2');
  const pickerNascimento = document.getElementById('reg-doc-2-picker');
  const btnCalendario = document.getElementById('btn-calendario-nascimento');
  const erroNome = document.getElementById('erro-reg-nome');
  const erroEmail = document.getElementById('erro-reg-email');
  const erroSenha = document.getElementById('erro-reg-senha');
  const erroDoc1 = document.getElementById('erro-reg-doc-1');
  const erroDoc2 = document.getElementById('erro-reg-doc-2');
  const alerta = document.getElementById('alerta-registro');
  const btnSubmit = document.getElementById('btn-submit-registro');
  const form = document.getElementById('form-registro');

  function limparErros() {
    erroNome.textContent = '';
    erroEmail.textContent = '';
    erroSenha.textContent = '';
    erroDoc1.textContent = '';
    erroDoc2.textContent = '';
    alerta.textContent = '';
    alerta.classList.add('oculto');
  }

  function formatarDateParaIso(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  function obterDataMaximaNascimento() {
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    return formatarDateParaIso(ontem);
  }

  function obterDataMinimaNascimento() {
    const limite = new Date();
    limite.setFullYear(limite.getFullYear() - IDADE_MAXIMA_ANOS);
    return formatarDateParaIso(limite);
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

  function aplicarMascaraDataNascimento() {
    if (perfil !== 'VIAJANTE') {
      return;
    }
    const valorAnterior = input2.value;
    const inicioSelecao = input2.selectionStart ?? valorAnterior.length;
    const digitosAntes = Math.min(
      valorAnterior.slice(0, inicioSelecao).replace(/\D/g, '').length,
      8
    );
    const formatado = formatarDataNascimentoDigitada(valorAnterior);
    input2.value = formatado;
    const novaPosicao = Math.min(calcularPosicaoCursorData(digitosAntes), formatado.length);
    input2.setSelectionRange(novaPosicao, novaPosicao);
  }

  function atualizarCamposPerfil() {
    limparErros();
    if (perfil === 'VIAJANTE') {
      label1.textContent = 'CPF *';
      input1.placeholder = '000.000.000-00';
      input1.value = '';
      label2.textContent = 'Data de nascimento *';
      input2.type = 'text';
      input2.inputMode = 'numeric';
      input2.maxLength = 10;
      input2.placeholder = 'dd/mm/aaaa';
      input2.autocomplete = 'bday';
      input2.value = '';
      input2.classList.add('campo-data__input');
      btnCalendario.classList.remove('oculto');
      pickerNascimento.min = obterDataMinimaNascimento();
      pickerNascimento.max = obterDataMaximaNascimento();
      pickerNascimento.value = '';
      grupo2.classList.remove('oculto');
    } else if (perfil === 'FRETISTA') {
      label1.textContent = 'CNPJ Intergaláctico *';
      input1.placeholder = '10.100.001/0001-01';
      input1.value = '';
      label2.textContent = 'Razão Social *';
      input2.type = 'text';
      input2.inputMode = 'text';
      input2.removeAttribute('maxlength');
      input2.placeholder = 'Ex.: Odyssey Linhas Estelares';
      input2.autocomplete = 'organization';
      input2.value = '';
      input2.classList.remove('campo-data__input');
      btnCalendario.classList.add('oculto');
      pickerNascimento.value = '';
      grupo2.classList.remove('oculto');
    } else {
      label1.textContent = 'Credencial Científica *';
      input1.placeholder = 'IAU-2100-001';
      input1.value = '';
      input2.removeAttribute('maxlength');
      input2.value = '';
      input2.classList.remove('campo-data__input');
      btnCalendario.classList.add('oculto');
      pickerNascimento.value = '';
      grupo2.classList.add('oculto');
    }
  }

  pickerNascimento.min = obterDataMinimaNascimento();
  pickerNascimento.max = obterDataMaximaNascimento();

  input2.addEventListener('keydown', (evento) => {
    if (perfil !== 'VIAJANTE') {
      return;
    }
    if (evento.key === 'Backspace') {
      const inicio = input2.selectionStart ?? 0;
      const fim = input2.selectionEnd ?? 0;
      if (inicio === fim && inicio > 1 && input2.value[inicio - 1] === '/') {
        evento.preventDefault();
        const semDigitoAnterior = input2.value.slice(0, inicio - 2) + input2.value.slice(inicio);
        const digitosAntes = semDigitoAnterior.slice(0, inicio - 2).replace(/\D/g, '').length;
        const formatado = formatarDataNascimentoDigitada(semDigitoAnterior);
        input2.value = formatado;
        const novaPosicao = Math.min(calcularPosicaoCursorData(digitosAntes), formatado.length);
        input2.setSelectionRange(novaPosicao, novaPosicao);
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
    const inicio = input2.selectionStart ?? input2.value.length;
    const fim = input2.selectionEnd ?? input2.value.length;
    const temSelecao = fim > inicio;
    const totalDigitos = input2.value.replace(/\D/g, '').length;
    if (totalDigitos >= 8 && !temSelecao) {
      evento.preventDefault();
    }
  });

  input2.addEventListener('input', aplicarMascaraDataNascimento);

  btnCalendario.addEventListener('click', () => {
    if (perfil !== 'VIAJANTE') {
      return;
    }
    const isoAtual = normalizarDataNascimentoParaIso(input2.value);
    pickerNascimento.min = obterDataMinimaNascimento();
    pickerNascimento.max = obterDataMaximaNascimento();
    pickerNascimento.value = isoAtual || '';
    if (typeof pickerNascimento.showPicker === 'function') {
      pickerNascimento.showPicker();
    } else {
      pickerNascimento.focus();
      pickerNascimento.click();
    }
  });

  pickerNascimento.addEventListener('change', () => {
    if (perfil !== 'VIAJANTE' || !pickerNascimento.value) {
      return;
    }
    input2.value = formatarIsoParaDataBr(pickerNascimento.value);
    erroDoc2.textContent = '';
  });

  grupoPerfis.addEventListener('click', (evento) => {
    const botao = evento.target.closest('[data-perfil]');
    if (!botao) {
      return;
    }
    perfil = botao.dataset.perfil;
    for (const el of grupoPerfis.querySelectorAll('[data-perfil]')) {
      const ativo = el.dataset.perfil === perfil;
      el.classList.toggle('perfil-opcao--ativo', ativo);
      el.setAttribute('aria-checked', String(ativo));
    }
    atualizarCamposPerfil();
  });

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    limparErros();

    const nome = document.getElementById('reg-nome').value;
    const email = document.getElementById('reg-email').value;
    const senha = document.getElementById('reg-senha').value;
    const doc1 = input1.value;
    const doc2 = input2.value;

    const { valido, erros } = validarFormularioRegistro({
      nome,
      email,
      senha,
      perfil,
      doc1,
      doc2,
    });

    if (!valido) {
      erroNome.textContent = erros.nome || '';
      erroEmail.textContent = erros.email || '';
      erroSenha.textContent = erros.senha || '';
      erroDoc1.textContent = erros.doc1 || '';
      erroDoc2.textContent = erros.doc2 || '';
      return;
    }

    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Criando conta...';

    try {
      await registrarUsuario({
        nome: nome.trim(),
        email: email.trim(),
        senha,
        perfil,
        doc1: doc1.trim(),
        doc2: doc2.trim(),
      });
      const rotas = {
        VIAJANTE: '../index.html',
        FRETISTA: 'fretista-area.html',
        ASTRONOMO: 'astronomo-area.html',
      };
      window.location.href = rotas[perfil] || '../index.html';
    } catch (erro) {
      alerta.textContent = erro.message;
      alerta.classList.remove('oculto');
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Criar conta';
    }
  });
}

document.addEventListener('DOMContentLoaded', inicializarRegistro);
