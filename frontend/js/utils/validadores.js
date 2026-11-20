/**
 * Validadores puros de entrada de formulários e limites físicos de domínio.
 */

export function validarEmail(email) {
  if (typeof email !== 'string') {
    return false;
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validarSenha(senha) {
  return typeof senha === 'string' && senha.trim().length >= 6;
}

export function validarCampoObrigatorio(valor) {
  return typeof valor === 'string' && valor.trim().length > 0;
}

export function validarNumeroPositivo(valor) {
  const num = Number(valor);
  return Number.isFinite(num) && num > 0;
}

export function validarVelocidadeNave(velocidadeC) {
  const num = Number(velocidadeC);
  return Number.isFinite(num) && num > 0 && num <= 0.8;
}

export function validarFormularioLogin({ email, senha }) {
  const erros = {};
  if (!validarEmail(email)) {
    erros.email = 'Informe um e-mail válido.';
  }
  if (!validarSenha(senha)) {
    erros.senha = 'A senha deve ter no mínimo 6 caracteres.';
  }
  return { valido: Object.keys(erros).length === 0, erros };
}
