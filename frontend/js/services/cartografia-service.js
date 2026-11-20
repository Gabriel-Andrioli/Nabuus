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
  if (aba === 'naves') {
    return estado.onibusFrota;
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
  const velMin = Number(propulsao.velocidadeMinC || propulsao.velocidadeCruzeiroC || 0.01);
  const velMax = Number(propulsao.velocidadeMaxC || Math.max(velMin, Number(propulsao.velocidadeCruzeiroC || velMin)));
  const registro = {
    ...propulsao,
    id: propulsao.id || proximoId,
    velocidadeMinC: Math.min(velMin, velMax),
    velocidadeMaxC: Math.max(velMin, velMax),
    velocidadeCruzeiroC: Number(((velMin + velMax) / 2).toFixed(3)),
  };
  estado.propulsoes.push(registro);
  salvarEstado(estado);
  return registro;
}

export function salvarRotaLumica(rota) {
  const estado = lerEstado();
  const proximoId = Math.max(0, ...estado.rotasLumicas.map((r) => r.id)) + 1;
  const registro = { ...rota, id: rota.id || proximoId, origemSistema: 'Sol', fatorDilatacao: rota.fatorDilatacao || 18 };
  estado.rotasLumicas.push(registro);
  salvarEstado(estado);
  return registro;
}

export function salvarNave(nave) {
  const estado = lerEstado();
  const proximoId = Math.max(0, ...estado.onibusFrota.map((n) => n.id)) + 1;

  const versoesEntrada = nave.versoesPropulsao && nave.versoesPropulsao.length > 0
    ? nave.versoesPropulsao
    : [{
      tipoPropulsaoId: Number(nave.tipoPropulsaoId || estado.propulsoes[0].id),
      velocidadeC: Number(nave.velocidadeC || estado.propulsoes[0].velocidadeCruzeiroC),
      autonomiaAl: Number(nave.autonomiaAl || estado.propulsoes[0].autonomiaAnosLuz),
    }];

  const versoesNormalizadas = versoesEntrada.map((vr) => {
    const prop = estado.propulsoes.find((p) => p.id === Number(vr.tipoPropulsaoId) || p.nome === vr.propulsaoNome) || estado.propulsoes[0];
    return {
      tipoPropulsaoId: prop.id,
      propulsaoNome: prop.nome,
      velocidadeC: Number(vr.velocidadeC || prop.velocidadeCruzeiroC),
      autonomiaAl: Number(vr.autonomiaAl || prop.autonomiaAnosLuz),
    };
  });

  const principal = versoesNormalizadas[0];
  const propPrincipal = estado.propulsoes.find((p) => p.id === principal.tipoPropulsaoId) || estado.propulsoes[0];

  const registro = {
    id: nave.id || proximoId,
    identificacao: nave.identificacao,
    tipoPropulsaoId: principal.tipoPropulsaoId,
    propulsaoNome: principal.propulsaoNome,
    velocidadeC: principal.velocidadeC,
    autonomiaAl: principal.autonomiaAl,
    aceleracaoG: Number(propPrincipal?.aceleracaoG || 0.2),
    totalAssentos: Number(nave.totalAssentos || 24),
    versoesPropulsao: versoesNormalizadas,
    ativo: true,
  };
  const idx = estado.onibusFrota.findIndex((n) => n.id === registro.id);
  if (idx >= 0) {
    estado.onibusFrota[idx] = { ...estado.onibusFrota[idx], ...registro };
  } else {
    estado.onibusFrota.push(registro);
  }
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
    naves: 'onibusFrota',
  };
  const chave = mapaChaves[aba];
  if (!chave) {
    return;
  }
  estado[chave] = estado[chave].filter((item) => item.id !== id);
  salvarEstado(estado);
}
