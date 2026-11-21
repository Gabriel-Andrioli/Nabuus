import {
  confirmarPassagem,
  obterCenarioAtivoDaViagem,
  obterClassePorPoltrona,
  obterSelecaoAtual,
  obterTotalAssentosViagem,
  obterViagemSelecionada,
} from '../services/passagens-service.js';
import { formatarAnos, formatarCreditos, formatarDistanciaAnosLuz, formatarVelocidadeC } from '../utils/formatadores.js';
import { renderizarBarraNavegacao } from './navegacao-comum.js';

function inicializarConfirmacao() {
  renderizarBarraNavegacao('navbar-principal', { prefixo: '../' });

  const viagem = obterViagemSelecionada();
  const sel = obterSelecaoAtual();
  const poltrona = sel.poltrona || '01A';
  const classeAssento = obterClassePorPoltrona(poltrona, obterTotalAssentosViagem(viagem));
  const classeFinal = (viagem.classes || []).includes(classeAssento) ? classeAssento : sel.classe;
  const resumo = obterCenarioAtivoDaViagem(viagem, { ...sel, classe: classeFinal });
  const techTexto = `${resumo.opcao.propulsaoNome} · ${formatarVelocidadeC(resumo.opcao.velocidadeC)}`;

  document.getElementById('rev-tecnologia').textContent = techTexto;
  document.getElementById('rev-destino').textContent = viagem.destinoNome;
  document.getElementById('rev-sistema').textContent = `${viagem.sistemaDestino} · Classe ${resumo.classe}`;
  document.getElementById('rev-origem').textContent = `${viagem.origemNome} · ${viagem.origemSistema} (${viagem.partidaTexto})`;
  document.getElementById('rev-chegada').textContent = resumo.chegadaTexto;
  document.getElementById('rev-terra').textContent = formatarAnos(resumo.tempoTerraAnos);
  document.getElementById('rev-bordo').textContent = formatarAnos(resumo.duracaoBordoAnos);
  document.getElementById('rev-divida').textContent = formatarAnos(resumo.dividaTemporalAnos);
  document.getElementById('rev-distancia').textContent = formatarDistanciaAnosLuz(viagem.distanciaAl);
  document.getElementById('rev-resumo-destino').textContent = viagem.destinoNome;
  document.getElementById('rev-poltrona').textContent = poltrona;
  document.getElementById('rev-custo').textContent = formatarCreditos(resumo.precoFinal);

  document.getElementById('btn-confirmar-viagem').addEventListener('click', () => {
    const passagem = confirmarPassagem();
    document.getElementById('comp-destino').textContent = passagem.destinoNome;
    document.getElementById('comp-tecnologia').textContent =
      `${passagem.tecnologia} · ${passagem.usaRotaLumica ? 'Com Rota Lúmica' : 'Sem Rota Lúmica'} · ${passagem.classe}`;
    document.getElementById('comp-poltrona').textContent = passagem.assento;
    document.getElementById('comp-custo').textContent = formatarCreditos(passagem.valorPago);

    document.getElementById('etapa-revisao').classList.add('oculto');
    document.getElementById('etapa-concluida').classList.remove('oculto');
  });
}

document.addEventListener('DOMContentLoaded', inicializarConfirmacao);
