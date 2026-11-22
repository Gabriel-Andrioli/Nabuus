/**
 * Funções puras de filtragem e ordenação de viagens na tela de resultados.
 */
import { converterPartidaTextoParaIso } from './validadores.js';

function converterParaTimestampUtc(valor) {
  const iso = converterPartidaTextoParaIso(valor);
  if (!iso) {
    return Infinity;
  }
  const [ano, mes, dia] = iso.split('-').map(Number);
  return Date.UTC(ano, mes - 1, dia);
}

function obterTimestampPartida(viagem) {
  return converterParaTimestampUtc(viagem?.dataPartidaIso || viagem?.partidaTexto);
}

function compararNumeros(a, b) {
  if (a === b) {
    return 0;
  }
  return a < b ? -1 : 1;
}

export function filtrarViagens(viagens, criterios = {}) {
  const {
    destino = '',
    propulsoes = [],
    custoMaximo = Infinity,
    distanciaMaximaAl = Infinity,
    tempoTerraMaximoAnos = Infinity,
  } = criterios;

  const termo = destino.trim().toLowerCase();

  return viagens.filter((v) => {
    if (v.status === 'SUSPENSA' || v.status === 'CANCELADA') {
      return false;
    }
    if (termo && !v.destinoNome.toLowerCase().includes(termo) && !v.sistemaDestino.toLowerCase().includes(termo)) {
      return false;
    }
    if (propulsoes.length > 0 && !propulsoes.includes(v.propulsaoNome)) {
      return false;
    }
    if (Number.isFinite(custoMaximo) && v.semLumica.precoFinal > custoMaximo) {
      return false;
    }
    if (Number.isFinite(distanciaMaximaAl) && v.distanciaAl > distanciaMaximaAl) {
      return false;
    }
    if (Number.isFinite(tempoTerraMaximoAnos) && v.semLumica.tempoTerraAnos > tempoTerraMaximoAnos) {
      return false;
    }
    return true;
  });
}

export function ordenarViagens(viagens, criterio = 'data-mais-proxima', opcoes = {}) {
  const copia = [...viagens];
  if (criterio === 'localidade-mais-proxima' || criterio === 'menor-distancia') {
    return copia.sort((a, b) => {
      const cmpDist = compararNumeros(Number(a.distanciaAl), Number(b.distanciaAl));
      if (cmpDist !== 0) {
        return cmpDist;
      }
      const cmpData = compararNumeros(obterTimestampPartida(a), obterTimestampPartida(b));
      if (cmpData !== 0) {
        return cmpData;
      }
      return (a.id || 0) - (b.id || 0);
    });
  }
  if (criterio === 'menor-custo') {
    return copia.sort((a, b) => a.semLumica.precoFinal - b.semLumica.precoFinal);
  }
  if (criterio === 'menor-tempo') {
    return copia.sort((a, b) => a.semLumica.duracaoBordoAnos - b.semLumica.duracaoBordoAnos);
  }
  if (criterio === 'menor-divida') {
    return copia.sort((a, b) => a.semLumica.dividaTemporalAnos - b.semLumica.dividaTemporalAnos);
  }

  const refTs = opcoes?.dataReferencia ? converterParaTimestampUtc(opcoes.dataReferencia) : Infinity;
  return copia.sort((a, b) => {
    const tsA = obterTimestampPartida(a);
    const tsB = obterTimestampPartida(b);
    if (Number.isFinite(refTs)) {
      const diffA = Number.isFinite(tsA) ? Math.abs(tsA - refTs) : Infinity;
      const diffB = Number.isFinite(tsB) ? Math.abs(tsB - refTs) : Infinity;
      const cmpDiff = compararNumeros(diffA, diffB);
      if (cmpDiff !== 0) {
        return cmpDiff;
      }
    }
    const cmpData = compararNumeros(tsA, tsB);
    if (cmpData !== 0) {
      return cmpData;
    }
    const cmpDist = compararNumeros(Number(a.distanciaAl), Number(b.distanciaAl));
    if (cmpDist !== 0) {
      return cmpDist;
    }
    return (a.id || 0) - (b.id || 0);
  });
}
