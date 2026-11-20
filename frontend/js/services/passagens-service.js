import { lerEstado, salvarEstado } from './api-client.js';

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
  return estado.rotasLumicas.find((r) => r.id === viagem.rotaLumicaId) || null;
}

export function confirmarPassagem() {
  const estado = lerEstado();
  const viagem = estado.viagens.find((v) => v.id === estado.selecaoAtual.viagemId) || estado.viagens[0];
  const poltrona = estado.selecaoAtual.poltrona || '01A';
  const usaLumica = Boolean(estado.selecaoAtual.usaRotaLumica);
  const cenario = usaLumica ? viagem.comLumica : viagem.semLumica;

  const novaPassagem = {
    id: Date.now(),
    viagemId: viagem.id,
    destinoNome: viagem.destinoNome,
    origemNome: viagem.origemNome,
    dataPartida: viagem.partidaTexto,
    chegadaEstimada: viagem.chegadaTexto,
    tecnologia: `${viagem.propulsaoNome} · ${viagem.velocidadeC.toFixed(2).replace('.', ',')} c`,
    assento: poltrona,
    classe: poltrona.startsWith('01') ? 'Luxo' : poltrona.startsWith('02') ? 'Primeira classe' : 'Executiva',
    usaRotaLumica: usaLumica,
    valorPago: cenario.precoFinal,
  };

  if (!viagem.assentosOcupados.includes(poltrona)) {
    viagem.assentosOcupados.push(poltrona);
  }
  estado.minhasPassagens.unshift(novaPassagem);
  estado.selecaoAtual.ultimaConfirmadaId = novaPassagem.id;
  salvarEstado(estado);
  return novaPassagem;
}

export function listarMinhasPassagens() {
  return lerEstado().minhasPassagens;
}

export function excluirPassagem(id) {
  const estado = lerEstado();
  estado.minhasPassagens = estado.minhasPassagens.filter((p) => p.id !== id);
  salvarEstado(estado);
}
