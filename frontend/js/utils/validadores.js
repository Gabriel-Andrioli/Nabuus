/**
 * Validadores puros de entrada de formulários e limites físicos de domínio.
 */

export const CREDENCIAIS_ASTRONOMO_HOMOLOGADAS = [
  'IAU-2100-BR',
  'IAU-2100-001',
  'IAU-2100-002',
  'IAU-2100-003',
  'IAU-2100-004',
  'IAU-2100-005',
  'IAU-2100-006',
  'IAU-2100-007',
  'IAU-2100-008',
  'IAU-2100-009',
];

export const CNPJS_FRETISTA_HOMOLOGADOS = [
  '12.345.678/0001-99',
  '10.100.001/0001-01',
  '10.100.002/0001-02',
  '10.100.003/0001-03',
  '10.100.004/0001-04',
  '10.100.005/0001-05',
  '10.100.006/0001-06',
  '10.100.007/0001-07',
  '10.100.008/0001-08',
  '10.100.009/0001-09',
];

export function validarEmail(email) {
  if (typeof email !== 'string') {
    return false;
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validarSenha(senha) {
  if (typeof senha !== 'string') {
    return false;
  }
  return senha.trim().length >= 6 && senha.length <= 20;
}

export function validarCpf(cpf) {
  if (typeof cpf !== 'string') {
    return false;
  }
  const limpo = cpf.trim();
  if (!/^(\d{11}|\d{3}\.\d{3}\.\d{3}-\d{2})$/.test(limpo)) {
    return false;
  }
  return limpo.replace(/\D/g, '').length === 11;
}

export function formatarDataNascimentoDigitada(valor) {
  const digitos = String(valor || '').replace(/\D/g, '').slice(0, 8);
  if (digitos.length <= 2) {
    return digitos;
  }
  if (digitos.length <= 4) {
    return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
  }
  return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
}

export function normalizarDataNascimentoParaIso(valor) {
  if (typeof valor !== 'string') {
    return null;
  }
  const limpa = valor.trim();
  let ano;
  let mes;
  let dia;

  const matchIso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(limpa);
  const matchBr = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(limpa);

  if (matchIso) {
    ano = Number(matchIso[1]);
    mes = Number(matchIso[2]);
    dia = Number(matchIso[3]);
  } else if (matchBr) {
    dia = Number(matchBr[1]);
    mes = Number(matchBr[2]);
    ano = Number(matchBr[3]);
  } else {
    return null;
  }

  if (ano < 1 || mes < 1 || mes > 12 || dia < 1 || dia > 31) {
    return null;
  }

  const data = new Date(ano, mes - 1, dia);
  data.setFullYear(ano);
  if (data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia) {
    return null;
  }

  return `${String(ano).padStart(4, '0')}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

export function formatarIsoParaDataBr(dataIso) {
  const iso = normalizarDataNascimentoParaIso(dataIso);
  if (!iso) {
    return '';
  }
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

export function validarDataNascimento(dataInformada, hoje = new Date()) {
  const iso = normalizarDataNascimentoParaIso(dataInformada);
  if (!iso) {
    return false;
  }
  const [ano, mes, dia] = iso.split('-').map(Number);
  const data = new Date(ano, mes - 1, dia);
  data.setFullYear(ano);
  const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  return data < inicioHoje;
}

export function validarCampoObrigatorio(valor) {
  return typeof valor === 'string' && valor.trim().length > 0;
}

export function validarCredencialAstronomo(credencial) {
  if (typeof credencial !== 'string') {
    return false;
  }
  return CREDENCIAIS_ASTRONOMO_HOMOLOGADAS.includes(credencial.trim().toUpperCase());
}

export function validarCnpjFretista(cnpj) {
  if (typeof cnpj !== 'string') {
    return false;
  }
  return CNPJS_FRETISTA_HOMOLOGADOS.includes(cnpj.trim());
}

export function validarNumeroPositivo(valor) {
  const num = Number(valor);
  return Number.isFinite(num) && num > 0;
}

export function validarVelocidadeNave(velocidadeC) {
  const num = Number(velocidadeC);
  return Number.isFinite(num) && num > 0 && num <= 0.4;
}

export function validarCoordenadasAstronomicas(ra, dec) {
  const numRa = Number(ra);
  const numDec = Number(dec);
  return Number.isFinite(numRa)
    && Number.isFinite(numDec)
    && numRa >= 0
    && numRa <= 360
    && numDec >= -90
    && numDec <= 90;
}

export function validarTotalAssentos(total) {
  const num = Number(total);
  return Number.isInteger(num) && num >= 1 && num <= 200;
}

export function validarFormularioLogin({ email, senha }) {
  const erros = {};
  if (!validarEmail(email)) {
    erros.email = 'Informe um e-mail válido.';
  }
  if (!validarSenha(senha)) {
    erros.senha = 'A senha deve ter entre 6 e 20 caracteres.';
  }
  return { valido: Object.keys(erros).length === 0, erros };
}

export function validarFormularioRegistro({ nome, email, senha, perfil, doc1, doc2 }) {
  const erros = {};
  if (!validarCampoObrigatorio(nome)) {
    erros.nome = 'Informe seu nome.';
  }
  if (!validarEmail(email)) {
    erros.email = 'Informe um e-mail válido.';
  }
  if (!validarSenha(senha)) {
    erros.senha = 'A senha deve ter entre 6 e 20 caracteres.';
  }

  if (perfil === 'ASTRONOMO') {
    if (!validarCampoObrigatorio(doc1)) {
      erros.doc1 = 'Informe a credencial científica.';
    } else if (!validarCredencialAstronomo(doc1)) {
      erros.doc1 = 'Credencial científica inválida ou não homologada.';
    }
  } else if (perfil === 'FRETISTA') {
    if (!validarCampoObrigatorio(doc1)) {
      erros.doc1 = 'Informe o CNPJ intergaláctico.';
    } else if (!validarCnpjFretista(doc1)) {
      erros.doc1 = 'CNPJ intergaláctico inválido ou não homologado.';
    }
    if (!validarCampoObrigatorio(doc2)) {
      erros.doc2 = 'Informe a razão social.';
    }
  } else {
    if (!validarCampoObrigatorio(doc1)) {
      erros.doc1 = 'Informe o CPF.';
    } else if (!validarCpf(doc1)) {
      erros.doc1 = 'Informe um CPF válido com 11 dígitos.';
    }
    if (!validarCampoObrigatorio(doc2)) {
      erros.doc2 = 'Informe a data de nascimento.';
    } else if (!normalizarDataNascimentoParaIso(doc2)) {
      erros.doc2 = 'Informe uma data válida no formato dd/mm/aaaa.';
    } else if (!validarDataNascimento(doc2)) {
      erros.doc2 = 'A data de nascimento deve estar no passado.';
    }
  }

  return { valido: Object.keys(erros).length === 0, erros };
}
