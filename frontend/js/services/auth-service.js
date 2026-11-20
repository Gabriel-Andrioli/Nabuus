import { lerSessao, salvarSessao } from './api-client.js';

export function obterUsuarioLogado() {
  return lerSessao();
}

export function realizarLogin({ nome, email, perfil }) {
  const sessao = {
    nome: nome || email.split('@')[0],
    email,
    perfil: perfil || 'VIAJANTE',
    token: `demo-jwt-${Date.now()}`,
  };
  salvarSessao(sessao);
  return sessao;
}

export function encerrarSessao() {
  salvarSessao(null);
}

export function exigirAutenticacao(perfilEsperado = null) {
  const sessao = lerSessao();
  if (!sessao) {
    return { autorizado: false, motivo: 'Login necessário.' };
  }
  if (perfilEsperado && sessao.perfil !== perfilEsperado) {
    return { autorizado: false, motivo: `Acesso restrito ao perfil ${perfilEsperado}.` };
  }
  return { autorizado: true, sessao };
}
