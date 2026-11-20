import { realizarLogin } from '../services/auth-service.js';
import { validarCampoObrigatorio, validarEmail, validarSenha } from '../utils/validadores.js';

function inicializarRegistro() {
  let perfil = 'VIAJANTE';
  const grupoPerfis = document.getElementById('lista-perfis-registro');
  const label1 = document.getElementById('label-doc-1');
  const input1 = document.getElementById('reg-doc-1');
  const grupo2 = document.getElementById('grupo-doc-2');
  const label2 = document.getElementById('label-doc-2');
  const input2 = document.getElementById('reg-doc-2');
  const form = document.getElementById('form-registro');

  function atualizarCamposPerfil() {
    if (perfil === 'VIAJANTE') {
      label1.textContent = 'CPF *';
      input1.placeholder = '000.000.000-00';
      label2.textContent = 'Data de nascimento *';
      input2.type = 'date';
      input2.value = '2075-04-12';
      grupo2.classList.remove('oculto');
    } else if (perfil === 'FRETISTA') {
      label1.textContent = 'CNPJ Intergaláctico *';
      input1.placeholder = '00.000.000/0001-00';
      label2.textContent = 'Razão Social *';
      input2.type = 'text';
      input2.value = 'Odyssey Linhas Estelares';
      grupo2.classList.remove('oculto');
    } else {
      label1.textContent = 'Credencial Científica *';
      input1.placeholder = 'IAU-2100-BR';
      grupo2.classList.add('oculto');
    }
  }

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

  form.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const nome = document.getElementById('reg-nome').value;
    const email = document.getElementById('reg-email').value;
    const senha = document.getElementById('reg-senha').value;

    const erroNome = document.getElementById('erro-reg-nome');
    const erroEmail = document.getElementById('erro-reg-email');
    const erroSenha = document.getElementById('erro-reg-senha');
    erroNome.textContent = validarCampoObrigatorio(nome) ? '' : 'Informe seu nome.';
    erroEmail.textContent = validarEmail(email) ? '' : 'Informe um e-mail válido.';
    erroSenha.textContent = validarSenha(senha) ? '' : 'Mínimo 6 caracteres.';

    if (erroNome.textContent || erroEmail.textContent || erroSenha.textContent) {
      return;
    }

    realizarLogin({ nome: nome.trim(), email: email.trim(), perfil });
    const rotas = {
      VIAJANTE: '../index.html',
      FRETISTA: 'fretista-area.html',
      ASTRONOMO: 'astronomo-area.html',
    };
    window.location.href = rotas[perfil] || '../index.html';
  });
}

document.addEventListener('DOMContentLoaded', inicializarRegistro);
