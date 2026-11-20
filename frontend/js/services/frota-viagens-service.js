import { API_MOTOR_BASE_URL, lerEstado, requisicaoHttp, salvarEstado } from './api-client.js';

export function listarFrota() {
  return lerEstado().onibusFrota;
}

export function salvarOnibus(onibus) {
  const estado = lerEstado();
  if (onibus.id) {
    const idx = estado.onibusFrota.findIndex((o) => o.id === onibus.id);
    if (idx >= 0) {
      estado.onibusFrota[idx] = { ...estado.onibusFrota[idx], ...onibus };
    }
  } else {
    const proximoId = Math.max(0, ...estado.onibusFrota.map((o) => o.id)) + 1;
    estado.onibusFrota.push({ ...onibus, id: proximoId, ativo: true });
  }
  salvarEstado(estado);
  return estado.onibusFrota;
}

export function excluirOnibus(id) {
  const estado = lerEstado();
  estado.onibusFrota = estado.onibusFrota.filter((o) => o.id !== id);
  salvarEstado(estado);
}

export function listarViagensFretista() {
  return lerEstado().viagens;
}

/** Aciona /v1/precos/sugerir no Motor Físico quando disponível ou aplica cálculo de fallback. */
export async function sugerirPrecoPorPropulsao(propulsaoId) {
  const estado = lerEstado();
  const prop = estado.propulsoes.find((p) => p.id === Number(propulsaoId)) || estado.propulsoes[0];
  try {
    return await requisicaoHttp(`${API_MOTOR_BASE_URL}/precos/sugerir`, {
      method: 'POST',
      body: JSON.stringify({
        precoBaseReferencia: prop.precoBaseReferencia,
        custoAnoLuzReferencia: prop.custoAnoLuzReferencia,
        categoriaConforto: prop.categoriaConforto,
      }),
    });
  } catch {
    return {
      precoBaseSugerido: prop.precoBaseReferencia,
      custoAnoLuzSugerido: prop.custoAnoLuzReferencia,
      custoPorParada: 2000.0,
    };
  }
}

export function publicarOuAtualizarViagem(dados) {
  const estado = lerEstado();
  const prop = estado.propulsoes.find((p) => p.nome === dados.propulsaoNome) || estado.propulsoes[0];
  const distanciaAl = dados.distanciaAl || 4.24;
  const precoSemLumica = Number(dados.precoFinal || (prop.precoBaseReferencia + prop.custoAnoLuzReferencia * distanciaAl));

  if (dados.id) {
    const idx = estado.viagens.findIndex((v) => v.id === dados.id);
    if (idx >= 0) {
      estado.viagens[idx] = { ...estado.viagens[idx], ...dados };
    }
  } else {
    const proximoId = Math.max(0, ...estado.viagens.map((v) => v.id)) + 1;
    estado.viagens.push({
      id: proximoId,
      codigo: `NB-00${proximoId}`,
      origemNome: dados.origemNome || 'Terra',
      origemSistema: 'Sistema Solar',
      destinoPlanetaId: dados.destinoPlanetaId || 16,
      destinoNome: dados.destinoNome || 'Proxima Centauri b',
      sistemaDestino: 'Sistema Alpha Centauri',
      onibusId: dados.onibusId || 1,
      onibusNome: dados.onibusNome || 'NABUUS Odyssey',
      propulsaoNome: prop.nome,
      velocidadeC: prop.velocidadeCruzeiroC,
      autonomiaAl: prop.autonomiaAnosLuz,
      distanciaAl,
      partidaTexto: dados.partidaTexto || 'Jan 2100',
      chegadaTexto: 'Abr 2105',
      correspondencia: 'Nova oferta publicada',
      classes: ['Executiva', 'Primeira classe', 'Luxo'],
      status: 'PUBLICADA',
      rotaLumicaId: 1,
      semLumica: { duracaoBordoAnos: 3.2, tempoTerraAnos: 5.3, dividaTemporalAnos: 2.1, precoFinal: precoSemLumica, paradas: 0 },
      comLumica: { duracaoBordoAnos: 0.12, tempoTerraAnos: 0.20, dividaTemporalAnos: 0.08, precoFinal: precoSemLumica + 1_200_000_000, paradas: 0, pedagio: 1_200_000_000 },
      assentosOcupados: ['01B', '02A', '03C', '05D'],
    });
  }
  salvarEstado(estado);
}

export function excluirViagemFretista(id) {
  const estado = lerEstado();
  estado.viagens = estado.viagens.filter((v) => v.id !== id);
  salvarEstado(estado);
}
