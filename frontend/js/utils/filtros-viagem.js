/**
 * Funções puras de filtragem e ordenação de viagens na tela de resultados.
 */

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

export function ordenarViagens(viagens, criterio = 'relevancia') {
  const copia = [...viagens];
  if (criterio === 'menor-distancia') {
    return copia.sort((a, b) => a.distanciaAl - b.distanciaAl);
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
  return copia;
}
