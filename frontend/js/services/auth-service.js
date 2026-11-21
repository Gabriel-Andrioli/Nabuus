import {
  API_JAVA_BASE_URL,
  lerEstado,
  lerSessao,
  requisicaoHttp,
  salvarEstado,
  salvarSessao,
} from './api-client.js';
import {
  normalizarDataNascimentoParaIso,
  validarCnpjFretista,
  validarCpf,
  validarCredencialAstronomo,
  validarDataNascimento,
  validarSenha,
} from '../utils/validadores.js';

function paraRoleBackend(perfil) {
  if (perfil === 'ASTRONOMO' || perfil === 'FRETISTA') {
    return perfil;
  }
  return 'PASSAGEIRO';
}

function paraPerfilFrontend(role) {
  if (role === 'PASSAGEIRO') {
    return 'VIAJANTE';
  }
  return role || 'VIAJANTE';
}

export function obterUsuarioLogado() {
  return lerSessao();
}

function realizarLogin({ id = null, nome, email, perfil, token = null }) {
  const sessao = {
    id,
    nome: nome || email.split('@')[0],
    email,
    perfil: perfil || 'VIAJANTE',
    token: token || `demo-jwt-${Date.now()}`,
  };
  salvarSessao(sessao);
  return sessao;
}

export async function autenticarUsuario({ email, senha, perfil }) {
  const emailNormalizado = String(email || '').trim().toLowerCase();
  try {
    const resp = await requisicaoHttp(`${API_JAVA_BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: emailNormalizado, senha }),
    });
    const perfilConta = paraPerfilFrontend(resp.role);
    if (perfil && perfilConta !== perfil) {
      throw new Error(`Esta conta pertence ao perfil ${perfilConta}. Selecione o perfil correto para entrar.`);
    }
    return realizarLogin({
      id: resp.id ?? resp.usuarioId ?? null,
      nome: resp.nome,
      email: resp.email,
      perfil: perfilConta,
      token: resp.token,
    });
  } catch (erro) {
    if (!erro?.ehErroRede) {
      throw erro;
    }
    const estado = lerEstado();
    const usuario = (estado.usuariosRegistrados || []).find(
      (u) => u.email.toLowerCase() === emailNormalizado
    );
    if (!usuario || usuario.senhaHashDemo !== senha) {
      throw new Error('E-mail ou senha inválidos.');
    }
    if (perfil && usuario.perfil !== perfil) {
      throw new Error(`Esta conta pertence ao perfil ${usuario.perfil}. Selecione o perfil correto para entrar.`);
    }
    return realizarLogin({
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
    });
  }
}

export async function registrarUsuario({ nome, email, senha, perfil, doc1, doc2 }) {
  const emailNormalizado = String(email || '').trim().toLowerCase();
  const doc1Limpo = String(doc1 || '').trim();
  const doc2Limpo = String(doc2 || '').trim();

  if (!validarSenha(senha)) {
    throw new Error('A senha deve ter entre 6 e 20 caracteres.');
  }
  if (perfil === 'ASTRONOMO' && !validarCredencialAstronomo(doc1Limpo)) {
    throw new Error('Credencial científica inválida ou não homologada.');
  }
  if (perfil === 'FRETISTA' && !validarCnpjFretista(doc1Limpo)) {
    throw new Error('CNPJ intergaláctico inválido ou não homologado.');
  }
  let dataNascimentoIso = null;
  if (perfil === 'VIAJANTE') {
    if (!validarCpf(doc1Limpo)) {
      throw new Error('Informe um CPF válido com 11 dígitos.');
    }
    dataNascimentoIso = normalizarDataNascimentoParaIso(doc2Limpo);
    if (!dataNascimentoIso || !validarDataNascimento(dataNascimentoIso)) {
      throw new Error('Informe uma data de nascimento válida.');
    }
  }

  const estado = lerEstado();
  const usuarios = estado.usuariosRegistrados || [];
  if (usuarios.some((u) => u.email.toLowerCase() === emailNormalizado)) {
    throw new Error('Já existe uma conta cadastrada com este e-mail.');
  }
  if (perfil === 'ASTRONOMO' && usuarios.some((u) => u.perfil === 'ASTRONOMO' && u.doc1.toUpperCase() === doc1Limpo.toUpperCase())) {
    throw new Error('Esta credencial científica já está vinculada a outra conta.');
  }
  if (perfil === 'FRETISTA' && usuarios.some((u) => u.perfil === 'FRETISTA' && u.doc1 === doc1Limpo)) {
    throw new Error('Este CNPJ intergaláctico já está vinculado a outra conta.');
  }
  if (perfil === 'VIAJANTE' && usuarios.some((u) => u.perfil === 'VIAJANTE' && u.doc1 === doc1Limpo)) {
    throw new Error('Este CPF já está vinculado a outra conta.');
  }

  const payload = {
    nome: nome.trim(),
    email: emailNormalizado,
    senha,
    role: paraRoleBackend(perfil),
    credencialCientifica: perfil === 'ASTRONOMO' ? doc1Limpo.toUpperCase() : null,
    cnpjIntergalactico: perfil === 'FRETISTA' ? doc1Limpo : null,
    razaoSocial: perfil === 'FRETISTA' ? doc2Limpo : null,
    cpf: perfil === 'VIAJANTE' ? doc1Limpo : null,
    dataNascimento: perfil === 'VIAJANTE' ? dataNascimentoIso : null,
  };

  let resp = null;
  try {
    resp = await requisicaoHttp(`${API_JAVA_BASE_URL}/auth/registro`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (erro) {
    if (!erro?.ehErroRede) {
      throw erro;
    }
  }

  const novoRegistro = {
    nome: nome.trim(),
    email: emailNormalizado,
    senhaHashDemo: senha,
    perfil,
    doc1: perfil === 'ASTRONOMO' ? doc1Limpo.toUpperCase() : doc1Limpo,
    doc2: perfil === 'VIAJANTE' ? dataNascimentoIso : doc2Limpo,
  };
  estado.usuariosRegistrados = [...usuarios, novoRegistro];
  salvarEstado(estado);

  return realizarLogin({
    id: resp?.id ?? resp?.usuarioId ?? null,
    nome: resp?.nome || nome.trim(),
    email: resp?.email || emailNormalizado,
    perfil,
    token: resp?.token || null,
  });
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
