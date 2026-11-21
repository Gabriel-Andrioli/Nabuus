import { construirOpcoesPropulsaoViagem, lerEstado, lerSessao, salvarEstado } from './api-client.js';

const PERFIS_CO_PASSAGEIROS = {
  '01B': { nome: 'Dr. Aris Thorne', ocupacao: 'Físico Teórico' },
  '02A': { nome: 'Cmdte. Elena Rostova', ocupacao: 'Piloto de Prospecção' },
  '02D': { nome: 'Kaelen Vex', ocupacao: 'Engenheiro de Fusão' },
  '03C': { nome: 'Dra. Maya Lin', ocupacao: 'Astrobióloga' },
  '04B': { nome: 'Lucas Vance', ocupacao: 'Cartógrafo Estelar' },
  '05D': { nome: 'Soraia Al-Mansoor', ocupacao: 'Técnica de Criogenia' },
  '06A': { nome: 'Breno Solis', ocupacao: 'Especialista em Suporte de Vida' },
};

export function obterPerfilPoltronaOcupada(poltrona) {
  return PERFIS_CO_PASSAGEIROS[poltrona] || {
    nome: 'Viajante Procedural',
    ocupacao: 'Pesquisador Interestelar',
  };
}

export function obterViagemSelecionada() {
  const estado = lerEstado();
  const id = estado.selecaoAtual?.viagemId || 1;
  return estado.viagens.find((v) => v.id === id) || estado.viagens[0];
}

export function atualizarSelecaoAtual(parcial) {
  const estado = lerEstado();
  estado.selecaoAtual = { ...estado.selecaoAtual, ...parcial };
  salvarEstado(estado);
  return estado.selecaoAtual;
}

export function obterSelecaoAtual() {
  return lerEstado().selecaoAtual;
}

export function obterRotaLumicaDaViagem(viagem) {
  const estado = lerEstado();
  if (!viagem || !viagem.rotaLumicaId) {
    return null;
  }
  return estado.rotasLumicas.find((r) => r.id === viagem.rotaLumicaId) || null;
}

export function obterOpcoesPropulsao(viagem) {
  const estado = lerEstado();
  return construirOpcoesPropulsaoViagem(viagem, estado);
}

/**
 * Resolve cenário ativo considerando propulsão escolhida, Rota Lúmica e desconto de 90% da criogenia na classe Luxo.
 */
export function obterCenarioAtivoDaViagem(viagem, sel = {}) {
  const opcoes = obterOpcoesPropulsao(viagem);
  const nomePropulsao = sel.propulsaoNome || viagem.propulsaoNome;
  const opcao = opcoes.find((op) => op.propulsaoNome === nomePropulsao)
    || opcoes.find((op) => op.propulsaoNome === viagem.propulsaoNome)
    || opcoes[0];

  const rotaLumica = obterRotaLumicaDaViagem(viagem);
  const canalAtivo = Boolean(rotaLumica && rotaLumica.ativa && opcao?.comLumica);
  const usaLumica = Boolean(sel.usaRotaLumica && canalAtivo);
  const cenarioBase = usaLumica ? opcao.comLumica : opcao.semLumica;

  const classes = viagem.classes || ['Executiva', 'Primeira classe', 'Luxo'];
  const classe = sel.classe && classes.includes(sel.classe) ? sel.classe : (classes[0] || 'Executiva');
  const emCriogenia = classe === 'Luxo';
  const duracaoBordoAnos = emCriogenia
    ? Number((cenarioBase.duracaoBordoAnos * 0.1).toFixed(4))
    : cenarioBase.duracaoBordoAnos;

  return {
    opcoes,
    opcao,
    cenarioBase,
    canalAtivo,
    usaLumica,
    classe,
    emCriogenia,
    duracaoBordoAnos,
    tempoTerraAnos: cenarioBase.tempoTerraAnos,
    dividaTemporalAnos: cenarioBase.dividaTemporalAnos,
    precoFinal: cenarioBase.precoFinal,
    chegadaTexto: cenarioBase.chegadaTexto || viagem.chegadaTexto,
    paradas: cenarioBase.paradas || 0,
    pedagio: cenarioBase.pedagio || 0,
  };
}

export function confirmarPassagem() {
  const estado = lerEstado();
  const viagem = estado.viagens.find((v) => v.id === estado.selecaoAtual.viagemId) || estado.viagens[0];
  const poltrona = estado.selecaoAtual.poltrona || '01A';
  const resumoAtivo = obterCenarioAtivoDaViagem(viagem, estado.selecaoAtual);

  const classeAssento = poltrona.startsWith('01')
    ? 'Luxo'
    : poltrona.startsWith('02')
      ? 'Primeira classe'
      : 'Executiva';
  const classeFinal = (viagem.classes || []).includes(classeAssento) ? classeAssento : resumoAtivo.classe;
  const emCriogeniaFinal = classeFinal === 'Luxo';
  const duracaoBordoFinal = emCriogeniaFinal
    ? Number((resumoAtivo.cenarioBase.duracaoBordoAnos * 0.1).toFixed(4))
    : resumoAtivo.cenarioBase.duracaoBordoAnos;

  const novaPassagem = {
    id: Date.now(),
    viagemId: viagem.id,
    destinoNome: viagem.destinoNome,
    origemNome: viagem.origemNome,
    dataPartida: viagem.partidaTexto,
    chegadaEstimada: resumoAtivo.chegadaTexto,
    tecnologia: `${resumoAtivo.opcao.propulsaoNome} · ${resumoAtivo.opcao.velocidadeC.toFixed(2).replace('.', ',')} c`,
    assento: poltrona,
    classe: classeFinal,
    emCriogenia: emCriogeniaFinal,
    duracaoBordoAnos: duracaoBordoFinal,
    usaRotaLumica: resumoAtivo.usaLumica,
    valorPago: resumoAtivo.precoFinal,
    usuarioEmail: lerSessao()?.email || null,
  };

  estado.minhasPassagens.unshift(novaPassagem);
  estado.selecaoAtual.ultimaConfirmadaId = novaPassagem.id;
  salvarEstado(estado);
  return novaPassagem;
}

export function listarMinhasPassagens() {
  const email = lerSessao()?.email || null;
  return lerEstado().minhasPassagens.filter(
    (p) => !p.usuarioEmail || (email && p.usuarioEmail === email)
  );
}

export function excluirPassagem(id) {
  const estado = lerEstado();
  estado.minhasPassagens = estado.minhasPassagens.filter((p) => p.id !== id);
  salvarEstado(estado);
}
