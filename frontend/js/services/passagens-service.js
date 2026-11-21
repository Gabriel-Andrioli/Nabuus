import {
  construirOpcoesPropulsaoViagem,
  lerEstado,
  lerSessao,
  salvarEstado,
  sincronizarApiJava,
} from './api-client.js';

const PERFIS_CO_PASSAGEIROS = {
  '01B': { nome: 'Dr. Aris Thorne', ocupacao: 'Físico Teórico' },
  '02A': { nome: 'Cmdte. Elena Rostova', ocupacao: 'Piloto de Prospecção' },
  '02D': { nome: 'Kaelen Vex', ocupacao: 'Engenheiro de Fusão' },
  '03C': { nome: 'Dra. Maya Lin', ocupacao: 'Astrobióloga' },
  '04A': { nome: 'Mateus Orlov', ocupacao: 'Navegador Orbital' },
  '04B': { nome: 'Lucas Vance', ocupacao: 'Cartógrafo Estelar' },
  '05D': { nome: 'Soraia Al-Mansoor', ocupacao: 'Técnica de Criogenia' },
  '06A': { nome: 'Breno Solis', ocupacao: 'Especialista em Suporte de Vida' },
  '06C': { nome: 'Íris Takahashi', ocupacao: 'Oficial de Telemetria' },
  '07B': { nome: 'Dante Korolev', ocupacao: 'Geólogo Planetário' },
  '08B': { nome: 'Nadia Bell', ocupacao: 'Astrônoma de Rádio' },
  '10D': { nome: 'Rafaela Mercer', ocupacao: 'Engenheira de Propulsão' },
  '11A': { nome: 'Henrique Solari', ocupacao: 'Pesquisador Exoplanetário' },
};

export function obterTotalAssentosViagem(viagem) {
  if (viagem?.totalAssentos) {
    return Number(viagem.totalAssentos);
  }
  const estado = lerEstado();
  const nave = (estado.onibusFrota || []).find((n) => n.id === viagem?.onibusId);
  return Number(nave?.totalAssentos || 24);
}

export function construirFileirasCabine(totalAssentos = 24) {
  const capacidade = Number(totalAssentos) || 24;
  const qtdFileiras = Math.max(6, Math.ceil(capacidade / 4));
  const fimLuxo = qtdFileiras >= 12 ? 2 : 1;
  const fimPrimeira = qtdFileiras >= 12 ? 5 : qtdFileiras >= 8 ? 3 : 2;
  const assentosLuxo = fimLuxo * 4;
  const assentosPrimeira = (fimPrimeira - fimLuxo) * 4;
  const assentosExecutiva = (qtdFileiras - fimPrimeira) * 4;

  const fileiras = [];
  for (let i = 1; i <= qtdFileiras; i += 1) {
    const num = String(i).padStart(2, '0');
    if (i <= fimLuxo) {
      fileiras.push({
        num,
        classeNome: 'Luxo',
        zona: i === 1 ? `LUXO · ${assentosLuxo} poltronas` : null,
        classeCss: 'poltrona--luxo',
      });
    } else if (i <= fimPrimeira) {
      fileiras.push({
        num,
        classeNome: 'Primeira classe',
        zona: i === fimLuxo + 1 ? `PRIMEIRA CLASSE · ${assentosPrimeira} poltronas` : null,
        classeCss: 'poltrona--primeira',
      });
    } else {
      fileiras.push({
        num,
        classeNome: 'Executiva',
        zona: i === fimPrimeira + 1 ? `EXECUTIVA · ${assentosExecutiva} poltronas` : null,
        classeCss: '',
      });
    }
  }
  return fileiras;
}

export function obterClassePorPoltrona(codigo, totalAssentos = 24) {
  const num = Number(String(codigo || '01').slice(0, 2));
  const fileira = construirFileirasCabine(totalAssentos).find((f) => Number(f.num) === num);
  return fileira ? fileira.classeNome : 'Executiva';
}

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

  const totalAssentos = obterTotalAssentosViagem(viagem);
  const classeAssento = obterClassePorPoltrona(poltrona, totalAssentos);
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

  void sincronizarApiJava('/passagens/comprar', {
    method: 'POST',
    body: JSON.stringify({
      viagemId: viagem.id,
      assentoEscolhido: poltrona,
      usaRotaLumica: resumoAtivo.usaLumica,
    }),
  });

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
  void sincronizarApiJava(`/passagens/${id}`, { method: 'DELETE' });
}
