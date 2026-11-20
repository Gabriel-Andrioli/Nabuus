/**
 * Funções puras de formatação de grandezas astronômicas, temporais e monetárias (RF-22 / RF-23).
 */

export function formatarCreditos(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero) || numero < 0) {
    return 'US$ 0';
  }
  if (numero >= 1e12) {
    return `US$ ${(numero / 1e12).toFixed(1).replace('.', ',')} tri`;
  }
  if (numero >= 1e9) {
    return `US$ ${(numero / 1e9).toFixed(1).replace('.', ',')} bi`;
  }
  if (numero >= 1e6) {
    return `US$ ${(numero / 1e6).toFixed(1).replace('.', ',')} mi`;
  }
  if (numero >= 1e3) {
    return `US$ ${(numero / 1e3).toFixed(1).replace('.', ',')} mil`;
  }
  return `US$ ${numero.toFixed(0)}`;
}

export function formatarAnos(anos) {
  const valor = Number(anos);
  if (!Number.isFinite(valor) || valor < 0) {
    return '0 anos';
  }
  if (valor >= 1e9) {
    return `${(valor / 1e9).toFixed(1).replace('.', ',')} bi de anos`;
  }
  if (valor >= 1e6) {
    return `${(valor / 1e6).toFixed(1).replace('.', ',')} mi de anos`;
  }
  if (valor >= 1e3) {
    return `${(valor / 1e3).toFixed(1).replace('.', ',')} mil anos`;
  }
  if (valor >= 1) {
    return `${valor.toFixed(2).replace(/\.00$/, '').replace('.', ',')} anos`;
  }
  const dias = valor * 365.25;
  if (dias >= 30) {
    return `${Math.round(dias / 30.4375)} meses`;
  }
  return `${Math.max(1, Math.round(dias))} dias`;
}

export function formatarDistanciaAnosLuz(distanciaAl) {
  const valor = Number(distanciaAl);
  if (!Number.isFinite(valor) || valor < 0) {
    return '0 anos-luz';
  }
  return `${valor.toFixed(2).replace('.', ',')} anos-luz`;
}

export function formatarVelocidadeC(velocidadeC) {
  const valor = Number(velocidadeC);
  if (!Number.isFinite(valor) || valor <= 0) {
    return '0,00 c';
  }
  const precisaTresCasas = valor < 0.1 || Math.abs(valor * 100 - Math.round(valor * 100)) > 1e-4;
  return `${valor.toFixed(precisaTresCasas ? 3 : 2).replace('.', ',')} c`;
}

export function calcularFatorLorentz(velocidadeC) {
  const beta = Number(velocidadeC);
  if (!Number.isFinite(beta) || beta <= 0 || beta >= 1) {
    return 1;
  }
  return 1 / Math.sqrt(1 - beta * beta);
}

export function formatarDataCurta(isoOuTexto) {
  if (!isoOuTexto) {
    return 'Jan 2100';
  }
  if (!isoOuTexto.includes('-')) {
    return isoOuTexto;
  }
  const [ano, mes] = isoOuTexto.split('-');
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const idx = Number(mes) - 1;
  const nomeMes = meses[idx] || 'Jan';
  return `${nomeMes} ${ano}`;
}
