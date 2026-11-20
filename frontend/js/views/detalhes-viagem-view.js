import { atualizarSelecaoAtual, obterRotaLumicaDaViagem, obterSelecaoAtual, obterViagemSelecionada } from '../services/passagens-service.js';
import { formatarAnos, formatarCreditos, formatarVelocidadeC } from '../utils/formatadores.js';
import { renderizarBarraNavegacao } from './navegacao-comum.js';

function inicializarDetalhes() {
  renderizarBarraNavegacao('navbar-principal', { prefixo: '../' });

  const viagem = obterViagemSelecionada();
  const rotaLumica = obterRotaLumicaDaViagem(viagem);
  const canalAtivo = !rotaLumica || rotaLumica.ativa;

  document.getElementById('det-tecnologia').textContent =
    `${viagem.propulsaoNome} · ${formatarVelocidadeC(viagem.velocidadeC)}`;
  document.getElementById('det-destino').textContent = viagem.destinoNome;
  document.getElementById('det-sistema').textContent = viagem.sistemaDestino;
  document.getElementById('det-origem').textContent = `${viagem.origemNome} · ${viagem.origemSistema}`;
  document.getElementById('det-chegada').textContent = viagem.chegadaTexto;
  document.getElementById('resumo-destino').textContent = viagem.destinoNome;
  document.getElementById('resumo-sub').textContent = `1 viajante · Só ida · ${viagem.partidaTexto}`;

  function renderizar() {
    const sel = obterSelecaoAtual();
    const usaLumica = Boolean(sel.usaRotaLumica && canalAtivo);
    const cenario = usaLumica ? viagem.comLumica : viagem.semLumica;

    document.getElementById('det-tempo-terra').textContent = formatarAnos(cenario.tempoTerraAnos);
    document.getElementById('det-tempo-bordo').textContent = formatarAnos(cenario.duracaoBordoAnos);
    document.getElementById('det-divida').textContent = formatarAnos(cenario.dividaTemporalAnos);
    document.getElementById('resumo-custo').textContent = formatarCreditos(cenario.precoFinal);
    document.getElementById('resumo-poltrona').textContent = sel.poltrona || 'Nenhuma poltrona selecionada';
    document.getElementById('resumo-desperto').textContent =
      sel.criogenia === 'Dormir 75% do percurso'
        ? 'Tempo desperto: 25% do tempo a bordo'
        : 'Tempo desperto: 100% do tempo a bordo';

    for (const btn of document.querySelectorAll('#grupo-rota [data-rota]')) {
      const ativo = (btn.dataset.rota === 'true') === usaLumica;
      btn.classList.toggle('botao--ativo', ativo);
      if (btn.dataset.rota === 'true' && !canalAtivo) {
        btn.disabled = true;
        btn.textContent = 'Rota Lúmica inativa';
      }
    }
    for (const btn of document.querySelectorAll('#grupo-crio [data-crio]')) {
      btn.classList.toggle('botao--ativo', btn.dataset.crio === sel.criogenia);
    }
    for (const btn of document.querySelectorAll('#grupo-lazer [data-lazer]')) {
      btn.classList.toggle('botao--ativo', btn.dataset.lazer === sel.lazer);
    }
    for (const btn of document.querySelectorAll('#grupo-alimentacao [data-alimentacao]')) {
      btn.classList.toggle('botao--ativo', btn.dataset.alimentacao === sel.alimentacao);
    }
  }

  document.getElementById('grupo-rota').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-rota]');
    if (btn && !btn.disabled) {
      atualizarSelecaoAtual({ usaRotaLumica: btn.dataset.rota === 'true' });
      renderizar();
    }
  });
  document.getElementById('grupo-crio').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-crio]');
    if (btn) {
      atualizarSelecaoAtual({ criogenia: btn.dataset.crio });
      renderizar();
    }
  });
  document.getElementById('grupo-lazer').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-lazer]');
    if (btn) {
      atualizarSelecaoAtual({ lazer: btn.dataset.lazer });
      renderizar();
    }
  });
  document.getElementById('grupo-alimentacao').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-alimentacao]');
    if (btn) {
      atualizarSelecaoAtual({ alimentacao: btn.dataset.alimentacao });
      renderizar();
    }
  });

  renderizar();
}

document.addEventListener('DOMContentLoaded', inicializarDetalhes);
