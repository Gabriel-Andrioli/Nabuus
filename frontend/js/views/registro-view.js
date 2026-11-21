import { registrarUsuario } from '../services/auth-service.js';
import { validarFormularioRegistro } from '../utils/validadores.js';

function inicializarRegistro() {
  let perfil = 'VIAJANTE';
  const grupoPerfis = document.getElementById('lista-perfis-registro');
  const label1 = document.getElementById('label-doc-1');
  const input1 = document.getElementById('reg-doc-1');
  const grupo2 = document.getElementById('grupo-doc-2');
  const label2 = document.getElementById('label-doc-2');
  const input2 = document.getElementById('reg-doc-2');
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

  function obterDataMaximaNascimento() {
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    const ano = ontem.getFullYear();
    const mes = String(ontem.getMonth() + 1).padStart(2, '0');
    const dia = String(ontem.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  function atualizarCamposPerfil() {
    limparErros();
    if (perfil === 'VIAJANTE') {
      label1.textContent = 'CPF *';
      input1.placeholder = '000.000.000-00';
      input1.value = '';
      label2.textContent = 'Data de nascimento *';
      input2.type = 'date';
      input2.max = obterDataMaximaNascimento();
      input2.placeholder = '';
      input2.value = '';
      grupo2.classList.remove('oculto');
    } else if (perfil === 'FRETISTA') {
      label1.textContent = 'CNPJ Intergaláctico *';
      input1.placeholder = '10.100.001/0001-01';
      input1.value = '';
      label2.textContent = 'Razão Social *';
      input2.type = 'text';
      input2.removeAttribute('max');
      input2.placeholder = 'Ex.: Odyssey Linhas Estelares';
      input2.value = '';
      grupo2.classList.remove('oculto');
    } else {
      label1.textContent = 'Credencial Científica *';
      input1.placeholder = 'IAU-2100-001';
      input1.value = '';
      input2.removeAttribute('max');
      input2.value = '';
      grupo2.classList.add('oculto');
    }
  }

  input2.max = obterDataMaximaNascimento();

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
      alerta.textContent = erros.doc1 || erros.doc2 || 'Verifique os campos destacados antes de continuar.';
      alerta.classList.remove('oculto');
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
