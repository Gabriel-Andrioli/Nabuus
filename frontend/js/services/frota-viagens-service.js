import {
  API_MOTOR_BASE_URL,
  construirOpcoesPropulsaoViagem,
  lerEstado,
  requisicaoHttp,
  salvarEstado,
} from './api-client.js';

export function listarFrota() {
  return lerEstado().onibusFrota;
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
        categoriaConforto: prop.categoriaConforto || 'EXECUTIVA',
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
  const nave = estado.onibusFrota.find((o) => o.id === Number(dados.onibusId)) || estado.onibusFrota[0];
  const prop = estado.propulsoes.find((p) => p.id === nave?.tipoPropulsaoId || p.nome === (nave?.propulsaoNome || dados.propulsaoNome))
    || estado.propulsoes[0];
  const planetaDestino = estado.planetas.find((p) => p.nome === dados.destinoNome) || estado.planetas.find((p) => p.nome !== 'Terra');
  const sistemaDestino = estado.sistemas.find((s) => s.id === planetaDestino?.sistemaId);
  const rotaLumica = estado.rotasLumicas.find((r) => r.destinoSistemaId === planetaDestino?.sistemaId) || null;
  const distanciaAl = dados.distanciaAl || (sistemaDestino?.distanciaSolAl > 0 ? sistemaDestino.distanciaSolAl : 4.24);
  const partidaTexto = dados.partidaTexto || '15 Jan 2100';
  const propulsoesDisp = nave?.versoesPropulsao && nave.versoesPropulsao.length > 0
    ? nave.versoesPropulsao.map((vr) => vr.propulsaoNome)
    : [prop.nome];

  if (dados.id) {
    const idx = estado.viagens.findIndex((v) => v.id === dados.id);
    if (idx >= 0) {
      const atualizada = {
        ...estado.viagens[idx],
        ...dados,
        onibusId: nave?.id || estado.viagens[idx].onibusId,
        onibusNome: nave?.identificacao || estado.viagens[idx].onibusNome,
        propulsaoNome: prop.nome,
        velocidadeC: nave?.velocidadeC || prop.velocidadeCruzeiroC,
        autonomiaAl: nave?.autonomiaAl || prop.autonomiaAnosLuz,
        destinoPlanetaId: planetaDestino?.id || estado.viagens[idx].destinoPlanetaId,
        sistemaDestino: planetaDestino?.sistemaNome || estado.viagens[idx].sistemaDestino,
        distanciaAl,
        rotaLumicaId: rotaLumica ? rotaLumica.id : null,
        propulsoesDisponiveis: propulsoesDisp,
      };
      atualizada.opcoesPropulsao = construirOpcoesPropulsaoViagem(atualizada, estado);
      const opAtual = atualizada.opcoesPropulsao.find((op) => op.propulsaoNome === atualizada.propulsaoNome) || atualizada.opcoesPropulsao[0];
      atualizada.semLumica = {
        ...opAtual.semLumica,
        precoFinal: Number(dados.precoFinal || opAtual.semLumica.precoFinal),
      };
      atualizada.comLumica = opAtual.comLumica;
      atualizada.chegadaTexto = opAtual.semLumica.chegadaTexto;
      estado.viagens[idx] = atualizada;
    }
  } else {
    const proximoId = Math.max(0, ...estado.viagens.map((v) => v.id)) + 1;
    const novaViagem = {
      id: proximoId,
      codigo: `NB-${String(proximoId).padStart(3, '0')}`,
      origemNome: dados.origemNome || 'Terra',
      origemSistema: 'Sistema Solar',
      destinoPlanetaId: planetaDestino?.id || 16,
      destinoNome: planetaDestino?.nome || 'Proxima Centauri b',
      sistemaDestino: planetaDestino?.sistemaNome || 'Proxima Centauri',
      onibusId: nave?.id || 1,
      onibusNome: nave?.identificacao || 'NABUUS Odyssey',
      propulsaoNome: prop.nome,
      velocidadeC: nave?.velocidadeC || prop.velocidadeCruzeiroC,
      autonomiaAl: nave?.autonomiaAl || prop.autonomiaAnosLuz,
      distanciaAl,
      partidaTexto,
      classes: ['Executiva', 'Primeira classe', 'Luxo'],
      status: 'PUBLICADA',
      rotaLumicaId: rotaLumica ? rotaLumica.id : null,
      propulsoesDisponiveis: propulsoesDisp,
      assentosOcupados: ['01B', '02A', '03C', '05D'],
    };
    novaViagem.opcoesPropulsao = construirOpcoesPropulsaoViagem(novaViagem, estado);
    const opAtual = novaViagem.opcoesPropulsao.find((op) => op.propulsaoNome === novaViagem.propulsaoNome) || novaViagem.opcoesPropulsao[0];
    novaViagem.semLumica = {
      ...opAtual.semLumica,
      precoFinal: Number(dados.precoFinal || opAtual.semLumica.precoFinal),
    };
    novaViagem.comLumica = opAtual.comLumica;
    novaViagem.chegadaTexto = opAtual.semLumica.chegadaTexto;
    estado.viagens.push(novaViagem);
  }
  salvarEstado(estado);
}

export function excluirViagemFretista(id) {
  const estado = lerEstado();
  estado.viagens = estado.viagens.filter((v) => v.id !== id);
  salvarEstado(estado);
}
