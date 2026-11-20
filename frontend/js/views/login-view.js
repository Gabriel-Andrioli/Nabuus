import { realizarLogin } from '../services/auth-service.js';
import { validarFormularioLogin } from '../utils/validadores.js';

function inicializarLogin() {
  let perfilSelecionado = 'VIAJANTE';
  const grupoPerfis = document.getElementById('lista-perfis-login');
  const form = document.getElementById('form-login');
  const inputEmail = document.getElementById('login-email');
  const inputSenha = document.getElementById('login-senha');
  const erroEmail = document.getElementById('erro-login-email');
  const erroSenha = document.getElementById('erro-login-senha');
  const alerta = document.getElementById('alerta-login');
  const btnSubmit = document.getElementById('btn-submit-login');

  grupoPerfis.addEventListener('click', (evento) => {
    const botao = evento.target.closest('[data-perfil]');
    if (!botao) {
      return;
    }
    perfilSelecionado = botao.dataset.perfil;
    for (const el of grupoPerfis.querySelectorAll('[data-perfil]')) {
      const ativo = el.dataset.perfil === perfilSelecionado;
      el.classList.toggle('perfil-opcao--ativo', ativo);
      el.setAttribute('aria-checked', String(ativo));
    }
  });

  form.addEventListener('submit', (evento) => {
    evento.preventDefault();
    erroEmail.textContent = '';
    erroSenha.textContent = '';
    alerta.classList.add('oculto');

    const { valido, erros } = validarFormularioLogin({
      email: inputEmail.value,
      senha: inputSenha.value,
    });

    if (!valido) {
      erroEmail.textContent = erros.email || '';
      erroSenha.textContent = erros.senha || '';
      return;
    }

    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Autenticando...';

    try {
      realizarLogin({
        email: inputEmail.value.trim(),
        perfil: perfilSelecionado,
      });

      const params = new URLSearchParams(window.location.search);
      const retorno = params.get('retorno');
      if (retorno && !retorno.startsWith('http')) {
        window.location.href = retorno;
        return;
      }
      const rotas = {
        VIAJANTE: '../index.html',
        FRETISTA: 'fretista-area.html',
        ASTRONOMO: 'astronomo-area.html',
      };
      window.location.href = rotas[perfilSelecionado] || '../index.html';
    } catch (erro) {
      alerta.textContent = erro.message;
      alerta.classList.remove('oculto');
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Entrar';
    }
  });
}

document.addEventListener('DOMContentLoaded', inicializarLogin);
