import { confirmarPassagem, obterSelecaoAtual, obterViagemSelecionada } from '../services/passagens-service.js';
import { formatarAnos, formatarCreditos, formatarDistanciaAnosLuz, formatarVelocidadeC } from '../utils/formatadores.js';
import { renderizarBarraNavegacao } from './navegacao-comum.js';

function inicializarConfirmacao() {
  renderizarBarraNavegacao('navbar-principal', { prefixo: '../' });

  const viagem = obterViagemSelecionada();
  const sel = obterSelecaoAtual();
  const cenario = sel.usaRotaLumica ? viagem.comLumica : viagem.semLumica;
  const techTexto = `${viagem.propulsaoNome} · ${formatarVelocidadeC(viagem.velocidadeC)}`;

  document.getElementById('rev-tecnologia').textContent = techTexto;
  document.getElementById('rev-destino').textContent = viagem.destinoNome;
  document.getElementById('rev-sistema').textContent = viagem.sistemaDestino;
  document.getElementById('rev-origem').textContent = `${viagem.origemNome} · ${viagem.origemSistema}`;
  document.getElementById('rev-chegada').textContent = viagem.chegadaTexto;
  document.getElementById('rev-terra').textContent = formatarAnos(cenario.tempoTerraAnos);
  document.getElementById('rev-bordo').textContent = formatarAnos(cenario.duracaoBordoAnos);
  document.getElementById('rev-divida').textContent = formatarAnos(cenario.dividaTemporalAnos);
  document.getElementById('rev-distancia').textContent = formatarDistanciaAnosLuz(viagem.distanciaAl);
  document.getElementById('rev-resumo-destino').textContent = viagem.destinoNome;
  document.getElementById('rev-poltrona').textContent = sel.poltrona || '01A';
  document.getElementById('rev-custo').textContent = formatarCreditos(cenario.precoFinal);

  document.getElementById('btn-confirmar-viagem').addEventListener('click', () => {
    const passagem = confirmarPassagem();
    document.getElementById('comp-destino').textContent = passagem.destinoNome;
    document.getElementById('comp-tecnologia').textContent =
      `${passagem.tecnologia} · ${passagem.usaRotaLumica ? 'Com Rota Lúmica' : 'Sem Rota Lúmica'}`;
    document.getElementById('comp-poltrona').textContent = passagem.assento;
    document.getElementById('comp-custo').textContent = formatarCreditos(passagem.valorPago);

    document.getElementById('etapa-revisao').classList.add('oculto');
    document.getElementById('etapa-concluida').classList.remove('oculto');
  });
}

document.addEventListener('DOMContentLoaded', inicializarConfirmacao);
