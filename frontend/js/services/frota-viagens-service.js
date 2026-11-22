import {
  API_JAVA_BASE_URL,
  API_MOTOR_BASE_URL,
  construirOpcoesPropulsaoViagem,
  lerEstado,
  lerSessao,
  requisicaoHttp,
  salvarEstado,
  sincronizarApiJava,
} from './api-client.js';
import { construirFileirasCabine, listarCodigosPoltronasCabine } from './passagens-service.js';
import {
  converterPartidaTextoParaIso,
  formatarIsoParaPartidaTexto,
  validarTotalAssentos,
} from '../utils/validadores.js';

const UA_METROS = 1.496e11;
const AL_METROS = 9.4607e15;

const MAPA_ID_PROPULSAO_BACKEND = Object.freeze({
  QUIMICA: 1,
  VELA_SOLAR: 2,
  VELA_LASER: 3,
  FISSAO_PULSADA: 4,
  FUSAO: 5,
  ANTIMATERIA: 6,
});

export function listarFrota() {
  return lerEstado().onibusFrota;
}

export function listarViagensFretista() {
  return lerEstado().viagens;
}

export function calcularDistanciaDestinoAl(planetaDestino, sistemaDestino) {
  if (sistemaDestino && Number(sistemaDestino.distanciaSolAl) > 0) {
    return Number(sistemaDestino.distanciaSolAl);
  }
  if (planetaDestino) {
    const distUa = Number(planetaDestino.distanciaEstrelaUA ?? 1.0);
    return Number(Math.max(0.00001, (Math.abs(distUa - 1.0) * UA_METROS) / AL_METROS).toFixed(6));
  }
  return 4.24;
}

/** Aciona o Back-End Java (ou Motor Físico) quando disponível, com fallback local. */
export async function sugerirPrecoPorPropulsao(propulsaoId) {
  const estado = lerEstado();
  const prop = estado.propulsoes.find((p) => p.id === Number(propulsaoId)) || estado.propulsoes[0];
  const propBackendId = MAPA_ID_PROPULSAO_BACKEND[prop.codigo] || prop.id;
  const sessao = lerSessao();
  if (sessao?.token && !String(sessao.token).startsWith('demo-jwt-')) {
    try {
      return await requisicaoHttp(`${API_JAVA_BASE_URL}/viagens/sugerir-preco?tipoPropulsaoId=${propBackendId}`, {
        method: 'POST',
      });
    } catch {
      // Fallback para o motor ou cálculo local
    }
  }
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
      custoPorParada: 50_000_000.0,
    };
  }
}

export function calcularPrecoSugeridoViagem({ destinoNome, onibusId, sugestaoBase } = {}) {
  const estado = lerEstado();
  const nave = estado.onibusFrota.find((o) => o.id === Number(onibusId)) || estado.onibusFrota[0];
  const prop = estado.propulsoes.find((p) => p.id === nave?.tipoPropulsaoId || p.nome === nave?.propulsaoNome)
    || estado.propulsoes[0];
  const planetaDestino = estado.planetas.find((p) => p.nome === destinoNome)
    || estado.planetas.find((p) => p.nome !== 'Terra');
  const sistemaDestino = estado.sistemas.find((s) => s.id === planetaDestino?.sistemaId);
  const distanciaAl = calcularDistanciaDestinoAl(planetaDestino, sistemaDestino);

  const precoBaseSugerido = Number(sugestaoBase?.precoBaseSugerido ?? prop.precoBaseReferencia);
  const custoAnoLuzSugerido = Number(sugestaoBase?.custoAnoLuzSugerido ?? prop.custoAnoLuzReferencia);
  const custoPorParada = Number(sugestaoBase?.custoPorParada ?? 50_000_000);
  const autonomiaAl = Math.max(0.1, Number(nave?.autonomiaAl || prop.autonomiaAnosLuz || 4));
  const paradas = distanciaAl > autonomiaAl ? Math.max(0, Math.ceil(distanciaAl / autonomiaAl) - 1) : 0;
  const precoSugerido = Math.round(precoBaseSugerido + custoAnoLuzSugerido * distanciaAl + paradas * custoPorParada);

  return {
    precoSugerido,
    precoBaseSugerido,
    custoAnoLuzSugerido,
    custoPorParada,
    distanciaAl,
    paradas,
    destinoNome: planetaDestino?.nome || destinoNome,
    onibusId: nave?.id,
  };
}

export function publicarOuAtualizarViagem(dados) {
  const estado = lerEstado();
  const nave = estado.onibusFrota.find((o) => o.id === Number(dados.onibusId)) || estado.onibusFrota[0];
  const prop = estado.propulsoes.find((p) => p.id === nave?.tipoPropulsaoId || p.nome === (nave?.propulsaoNome || dados.propulsaoNome))
    || estado.propulsoes[0];
  const planetaDestino = estado.planetas.find((p) => p.nome === dados.destinoNome) || estado.planetas.find((p) => p.nome !== 'Terra');
  const sistemaDestino = estado.sistemas.find((s) => s.id === planetaDestino?.sistemaId);
  const rotaLumica = estado.rotasLumicas.find((r) => r.destinoSistemaId === planetaDestino?.sistemaId) || null;
  const distanciaAl = dados.distanciaAl !== undefined
    ? Number(dados.distanciaAl)
    : calcularDistanciaDestinoAl(planetaDestino, sistemaDestino);
  const dataPartidaIso = converterPartidaTextoParaIso(dados.dataPartidaIso || dados.partidaTexto) || '2100-01-15';
  const partidaTexto = formatarIsoParaPartidaTexto(dataPartidaIso) || '15 Jan 2100';
  const totalAssentos = validarTotalAssentos(nave?.totalAssentos) ? Number(nave.totalAssentos) : 24;
  const classesPresentes = new Set(construirFileirasCabine(totalAssentos).map((f) => f.classeNome));
  const classesDisponiveis = ['Executiva', 'Primeira classe', 'Luxo'].filter((c) => classesPresentes.has(c));
  const codigosValidos = listarCodigosPoltronasCabine(totalAssentos);
  const maxOcupados = Math.max(0, codigosValidos.length - 1);
  const propulsoesDisp = nave?.versoesPropulsao && nave.versoesPropulsao.length > 0
    ? nave.versoesPropulsao.map((vr) => vr.propulsaoNome)
    : [prop.nome];

  if (dados.id) {
    const idx = estado.viagens.findIndex((v) => v.id === dados.id);
    if (idx >= 0) {
      const ocupadosBase = Array.isArray(estado.viagens[idx].assentosOcupados)
        ? estado.viagens[idx].assentosOcupados
        : ['01B', '02A', '03C', '05D'];
      const assentosOcupados = ocupadosBase.filter((c) => codigosValidos.includes(c)).slice(0, maxOcupados);
      const atualizada = {
        ...estado.viagens[idx],
        ...dados,
        onibusId: nave?.id || estado.viagens[idx].onibusId,
        onibusNome: nave?.identificacao || estado.viagens[idx].onibusNome,
        totalAssentos,
        dataPartidaIso,
        partidaTexto,
        classes: classesDisponiveis,
        assentosOcupados,
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
        precoFinal: Number(dados.precoFinal !== undefined ? dados.precoFinal : opAtual.semLumica.precoFinal),
      };
      atualizada.comLumica = opAtual.comLumica;
      atualizada.chegadaTexto = opAtual.semLumica.chegadaTexto;
      estado.viagens[idx] = atualizada;
    }
  } else {
    const proximoId = Math.max(0, ...estado.viagens.map((v) => v.id)) + 1;
    const assentosOcupados = ['01B', '02A', '03C', '05D']
      .filter((c) => codigosValidos.includes(c))
      .slice(0, maxOcupados);
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
      totalAssentos,
      propulsaoNome: prop.nome,
      velocidadeC: nave?.velocidadeC || prop.velocidadeCruzeiroC,
      autonomiaAl: nave?.autonomiaAl || prop.autonomiaAnosLuz,
      distanciaAl,
      dataPartidaIso,
      partidaTexto,
      classes: classesDisponiveis,
      status: 'PUBLICADA',
      rotaLumicaId: rotaLumica ? rotaLumica.id : null,
      propulsoesDisponiveis: propulsoesDisp,
      assentosOcupados,
    };
    novaViagem.opcoesPropulsao = construirOpcoesPropulsaoViagem(novaViagem, estado);
    const opAtual = novaViagem.opcoesPropulsao.find((op) => op.propulsaoNome === novaViagem.propulsaoNome) || novaViagem.opcoesPropulsao[0];
    novaViagem.semLumica = {
      ...opAtual.semLumica,
      precoFinal: Number(dados.precoFinal !== undefined ? dados.precoFinal : opAtual.semLumica.precoFinal),
    };
    novaViagem.comLumica = opAtual.comLumica;
    novaViagem.chegadaTexto = opAtual.semLumica.chegadaTexto;
    estado.viagens.push(novaViagem);
    void sincronizarApiJava('/viagens/publicar', {
      method: 'POST',
      body: JSON.stringify({
        onibusEspacialId: novaViagem.onibusId,
        planetaEmbarqueId: 3,
        planetaDesembarqueId: novaViagem.destinoPlanetaId,
        dataPartida: `${dataPartidaIso}T12:00:00Z`,
        precoBase: prop.precoBaseReferencia,
        custoAnoLuz: prop.custoAnoLuzReferencia,
      }),
    });
  }
  salvarEstado(estado);
}

export function excluirViagemFretista(id) {
  const estado = lerEstado();
  estado.viagens = estado.viagens.filter((v) => v.id !== id);
  salvarEstado(estado);
}
