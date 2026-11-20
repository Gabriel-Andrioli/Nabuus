/**
 * Cliente HTTP centralizado (Fetch API + JWT + RFC 9457 ProblemDetail)
 * e estado inicial de demonstração alinhado ao Figma (Nabuus.fig) e ao CSV real.
 */

export const API_JAVA_BASE_URL = 'http://localhost:8080/api';
export const API_MOTOR_BASE_URL = 'http://localhost:8001/v1';

const CHAVE_STORAGE = 'nabuus_estado_v1';
const CHAVE_SESSAO = 'nabuus_sessao_v1';

const ESTADO_INICIAL = {
  sistemas: [
    { id: 1, nome: 'Sistema Solar', estrelaPrincipal: 'Sol', configuracao: 'Estrela única', ra: 0, dec: 0, distanciaSolAl: 0.0, descricao: 'Via Láctea · Sistema de origem' },
    { id: 2, nome: 'Sistema Alpha Centauri', estrelaPrincipal: 'Alpha Centauri', configuracao: 'Sistema binário', ra: 217.43, dec: -62.68, distanciaSolAl: 4.37, descricao: '4,37 anos-luz · Referência do catálogo' },
    { id: 3, nome: 'Sistema de Barnard', estrelaPrincipal: 'Estrela de Barnard', configuracao: 'Estrela única', ra: 269.45, dec: 4.69, distanciaSolAl: 5.96, descricao: '5,96 anos-luz · Anã vermelha próxima' },
    { id: 4, nome: 'TRAPPIST-1', estrelaPrincipal: 'TRAPPIST-1', configuracao: 'Estrela única', ra: 346.62, dec: -5.04, distanciaSolAl: 40.54, descricao: '40,54 anos-luz · Sistema com 7 exoplanetas' },
  ],
  planetas: [
    { id: 3, nome: 'Terra', sistemaId: 1, sistemaNome: 'Sistema Solar', tipo: 'Rochoso', distanciaEstrelaUA: 1.0, possuiPostoRecarga: true, resumo: 'Sistema Solar · Planeta de origem' },
    { id: 16, nome: 'Proxima Centauri b', sistemaId: 2, sistemaNome: 'Sistema Alpha Centauri', tipo: 'Rochoso', distanciaEstrelaUA: 0.048, possuiPostoRecarga: false, resumo: 'Sistema Alpha Centauri · Destino de referência' },
    { id: 17, nome: 'Alpha Centauri A', sistemaId: 2, sistemaNome: 'Sistema Alpha Centauri', tipo: 'Estrela/Órbita', distanciaEstrelaUA: 1.2, possuiPostoRecarga: true, resumo: 'Sistema Alpha Centauri · Estrela principal' },
    { id: 18, nome: 'Estrela de Barnard', sistemaId: 3, sistemaNome: 'Sistema de Barnard', tipo: 'Rochoso', distanciaEstrelaUA: 0.04, possuiPostoRecarga: true, resumo: 'Sistema de Barnard · Órbita próxima' },
    { id: 12, nome: 'TRAPPIST-1 e', sistemaId: 4, sistemaNome: 'TRAPPIST-1', tipo: 'Rochoso', distanciaEstrelaUA: 0.029, possuiPostoRecarga: false, resumo: 'TRAPPIST-1 · Zona habitável ideal' },
  ],
  propulsoes: [
    { id: 1, codigo: 'ANTIMATERIA', nome: 'Antimatéria', aceleracaoG: 1.0, velocidadeCruzeiroC: 0.80, autonomiaAnosLuz: 4.50, categoriaConforto: 'LUXO', precoBaseReferencia: 120_000_000, custoAnoLuzReferencia: 2_000_000_000 },
    { id: 2, codigo: 'FUSAO', nome: 'Fusão nuclear', aceleracaoG: 0.8, velocidadeCruzeiroC: 0.50, autonomiaAnosLuz: 6.00, categoriaConforto: 'EXECUTIVA', precoBaseReferencia: 80_000_000, custoAnoLuzReferencia: 1_200_000_000 },
    { id: 3, codigo: 'VELA_SOLAR', nome: 'Vela solar', aceleracaoG: 0.05, velocidadeCruzeiroC: 0.12, autonomiaAnosLuz: 2.00, categoriaConforto: 'ECONOMICA', precoBaseReferencia: 30_000_000, custoAnoLuzReferencia: 600_000_000 },
  ],
  rotasLumicas: [
    { id: 1, origemSistema: 'Sol', destinoSistemaId: 2, destinoSistemaNome: 'Sistema Alpha Centauri', velocidadeC: 20, pedagio: 1_200_000_000, ativa: true, viagemVinculada: 'NB-L01' },
    { id: 2, origemSistema: 'Sol', destinoSistemaId: 3, destinoSistemaNome: 'Sistema de Barnard', velocidadeC: 20, pedagio: 1_500_000_000, ativa: true, viagemVinculada: 'NB-L02' },
  ],
  onibusFrota: [
    { id: 1, identificacao: 'NABUUS Odyssey', tipoPropulsaoId: 1, propulsaoNome: 'Antimatéria', totalAssentos: 24, ativo: true },
    { id: 2, identificacao: 'NABUUS Horizon', tipoPropulsaoId: 2, propulsaoNome: 'Fusão nuclear', totalAssentos: 32, ativo: true },
    { id: 3, identificacao: 'NABUUS Aurora', tipoPropulsaoId: 1, propulsaoNome: 'Antimatéria', totalAssentos: 48, ativo: true },
  ],
  viagens: [
    {
      id: 1,
      codigo: 'NB-001',
      origemNome: 'Terra',
      origemSistema: 'Sistema Solar',
      destinoPlanetaId: 16,
      destinoNome: 'Proxima Centauri b',
      sistemaDestino: 'Sistema Alpha Centauri',
      onibusId: 1,
      onibusNome: 'NABUUS Odyssey',
      propulsaoNome: 'Antimatéria',
      velocidadeC: 0.80,
      autonomiaAl: 4.50,
      distanciaAl: 4.24,
      partidaTexto: 'Jan 2100',
      chegadaTexto: 'Abr 2105',
      correspondencia: 'Melhor correspondência',
      classes: ['Executiva', 'Primeira classe', 'Luxo'],
      status: 'PUBLICADA',
      rotaLumicaId: 1,
      semLumica: { duracaoBordoAnos: 3.2, tempoTerraAnos: 5.3, dividaTemporalAnos: 2.1, precoFinal: 8_600_000_000, paradas: 0 },
      comLumica: { duracaoBordoAnos: 0.12, tempoTerraAnos: 0.20, dividaTemporalAnos: 0.08, precoFinal: 9_800_000_000, paradas: 0, pedagio: 1_200_000_000 },
      assentosOcupados: ['01B', '02A', '02D', '03C', '04B', '05D', '06A'],
    },
    {
      id: 2,
      codigo: 'NB-002',
      origemNome: 'Terra',
      origemSistema: 'Sistema Solar',
      destinoPlanetaId: 17,
      destinoNome: 'Alpha Centauri A',
      sistemaDestino: 'Sistema Alpha Centauri',
      onibusId: 2,
      onibusNome: 'NABUUS Horizon',
      propulsaoNome: 'Fusão nuclear',
      velocidadeC: 0.50,
      autonomiaAl: 6.00,
      distanciaAl: 4.37,
      partidaTexto: 'Jan 2100',
      chegadaTexto: 'Out 2108',
      correspondencia: 'Menor custo financeiro',
      classes: ['Executiva', 'Primeira classe'],
      status: 'PUBLICADA',
      rotaLumicaId: 1,
      semLumica: { duracaoBordoAnos: 7.6, tempoTerraAnos: 8.7, dividaTemporalAnos: 1.1, precoFinal: 6_200_000_000, paradas: 0 },
      comLumica: { duracaoBordoAnos: 0.14, tempoTerraAnos: 0.22, dividaTemporalAnos: 0.08, precoFinal: 7_400_000_000, paradas: 0, pedagio: 1_200_000_000 },
      assentosOcupados: ['01B', '02A', '03C', '04B', '05D'],
    },
    {
      id: 3,
      codigo: 'NB-003',
      origemNome: 'Terra',
      origemSistema: 'Sistema Solar',
      destinoPlanetaId: 18,
      destinoNome: 'Estrela de Barnard',
      sistemaDestino: 'Sistema de Barnard',
      onibusId: 1,
      onibusNome: 'NABUUS Odyssey',
      propulsaoNome: 'Antimatéria',
      velocidadeC: 0.80,
      autonomiaAl: 4.50,
      distanciaAl: 5.96,
      partidaTexto: 'Jan 2100',
      chegadaTexto: 'Jul 2107',
      correspondencia: 'Outra estrela, novas possibilidades',
      classes: ['Executiva'],
      status: 'PUBLICADA',
      rotaLumicaId: 2,
      semLumica: { duracaoBordoAnos: 4.5, tempoTerraAnos: 7.5, dividaTemporalAnos: 3.0, precoFinal: 9_800_000_000, paradas: 1 },
      comLumica: { duracaoBordoAnos: 0.18, tempoTerraAnos: 0.30, dividaTemporalAnos: 0.12, precoFinal: 11_300_000_000, paradas: 0, pedagio: 1_500_000_000 },
      assentosOcupados: ['01B', '02A', '02D', '03C'],
    },
  ],
  minhasPassagens: [
    {
      id: 101,
      viagemId: 1,
      destinoNome: 'Proxima Centauri b',
      origemNome: 'Terra',
      dataPartida: 'Jan 2100',
      chegadaEstimada: 'Abr 2105',
      tecnologia: 'Antimatéria · 0,80 c',
      assento: '01A',
      classe: 'Luxo',
      usaRotaLumica: false,
      valorPago: 8_600_000_000,
    },
  ],
  selecaoAtual: {
    viagemId: 1,
    usaRotaLumica: false,
    criogenia: 'Sem criogenia',
    lazer: 'Essencial',
    alimentacao: 'Padrão',
    poltrona: null,
    ultimaConfirmadaId: null,
  },
};

function temStorage() {
  return typeof globalThis !== 'undefined' && typeof globalThis.localStorage !== 'undefined';
}

export function lerEstado() {
  if (!temStorage()) {
    return structuredClone(ESTADO_INICIAL);
  }
  const bruto = globalThis.localStorage.getItem(CHAVE_STORAGE);
  if (!bruto) {
    const copia = structuredClone(ESTADO_INICIAL);
    globalThis.localStorage.setItem(CHAVE_STORAGE, JSON.stringify(copia));
    return copia;
  }
  try {
    return JSON.parse(bruto);
  } catch {
    const copia = structuredClone(ESTADO_INICIAL);
    globalThis.localStorage.setItem(CHAVE_STORAGE, JSON.stringify(copia));
    return copia;
  }
}

export function salvarEstado(novoEstado) {
  if (temStorage()) {
    globalThis.localStorage.setItem(CHAVE_STORAGE, JSON.stringify(novoEstado));
  }
  return novoEstado;
}

export function lerSessao() {
  if (!temStorage()) {
    return null;
  }
  try {
    const bruto = globalThis.localStorage.getItem(CHAVE_SESSAO);
    return bruto ? JSON.parse(bruto) : null;
  } catch {
    return null;
  }
}

export function salvarSessao(sessao) {
  if (!temStorage()) {
    return;
  }
  if (!sessao) {
    globalThis.localStorage.removeItem(CHAVE_SESSAO);
    return;
  }
  globalThis.localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
}

export async function requisicaoHttp(url, opcoes = {}) {
  const sessao = lerSessao();
  const headers = {
    'Content-Type': 'application/json',
    ...(sessao?.token ? { Authorization: `Bearer ${sessao.token}` } : {}),
    ...(opcoes.headers || {}),
  };

  try {
    const resposta = await fetch(url, { ...opcoes, headers });
    if (resposta.status === 401) {
      salvarSessao(null);
      throw new Error('Sessão expirada. Faça login novamente.');
    }
    if (resposta.status === 403) {
      throw new Error('Seu perfil não possui permissão para esta operação.');
    }
    if (!resposta.ok) {
      const problema = await resposta.json().catch(() => ({}));
      throw new Error(problema.detail || problema.title || 'Erro ao processar requisição.');
    }
    if (resposta.status === 204) {
      return null;
    }
    return await resposta.json();
  } catch (erro) {
    throw erro instanceof Error ? erro : new Error('Falha de comunicação com o servidor.');
  }
}
