import { lerEstado, salvarEstado } from './api-client.js';

export function listarCatalogo(aba) {
  const estado = lerEstado();
  if (aba === 'planetas') {
    return estado.planetas;
  }
  if (aba === 'sistemas') {
    return estado.sistemas;
  }
  if (aba === 'propulsoes') {
    return estado.propulsoes;
  }
  if (aba === 'rotas') {
    return estado.rotasLumicas;
  }
  return [];
}

export function salvarPlaneta(planeta) {
  const estado = lerEstado();
  const proximoId = Math.max(0, ...estado.planetas.map((p) => p.id)) + 1;
  const registro = { ...planeta, id: planeta.id || proximoId };
  const idx = estado.planetas.findIndex((p) => p.id === registro.id);
  if (idx >= 0) {
    estado.planetas[idx] = registro;
  } else {
    estado.planetas.push(registro);
  }
  salvarEstado(estado);
  return registro;
}

export function salvarSistema(sistema) {
  const estado = lerEstado();
  const proximoId = Math.max(0, ...estado.sistemas.map((s) => s.id)) + 1;
  const registro = { ...sistema, id: sistema.id || proximoId };
  estado.sistemas.push(registro);
  salvarEstado(estado);
  return registro;
}

export function salvarPropulsao(propulsao) {
  const estado = lerEstado();
  const proximoId = Math.max(0, ...estado.propulsoes.map((p) => p.id)) + 1;
  const registro = { ...propulsao, id: propulsao.id || proximoId };
  estado.propulsoes.push(registro);
  salvarEstado(estado);
  return registro;
}

export function salvarRotaLumica(rota) {
  const estado = lerEstado();
  const proximoId = Math.max(0, ...estado.rotasLumicas.map((r) => r.id)) + 1;
  const registro = { ...rota, id: rota.id || proximoId, origemSistema: 'Sol' };
  estado.rotasLumicas.push(registro);
  salvarEstado(estado);
  return registro;
}

/** RF-05: Ao desativar uma rota lúmica, suspende automaticamente as viagens vinculadas. */
export function alternarStatusRotaLumica(rotaId) {
  const estado = lerEstado();
  const rota = estado.rotasLumicas.find((r) => r.id === rotaId);
  if (!rota) {
    return null;
  }
  rota.ativa = !rota.ativa;
  estado.viagens = estado.viagens.map((v) =>
    v.rotaLumicaId === rotaId ? { ...v, status: rota.ativa ? 'PUBLICADA' : 'SUSPENSA' } : v
  );
  salvarEstado(estado);
  return rota;
}

export function excluirRegistroCartografico(aba, id) {
  const estado = lerEstado();
  const mapaChaves = {
    planetas: 'planetas',
    sistemas: 'sistemas',
    propulsoes: 'propulsoes',
    rotas: 'rotasLumicas',
  };
  const chave = mapaChaves[aba];
  if (!chave) {
    return;
  }
  estado[chave] = estado[chave].filter((item) => item.id !== id);
  salvarEstado(estado);
}
