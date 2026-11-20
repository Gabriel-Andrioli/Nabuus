import { lerUltimaBusca } from '../services/api-client.js';
import {
  atualizarSelecaoAtual,
  obterCenarioAtivoDaViagem,
  obterSelecaoAtual,
  obterViagemSelecionada,
} from '../services/passagens-service.js';
import { criarElemento, limparElemento } from '../utils/dom-seguro.js';
import { formatarAnos, formatarCreditos, formatarVelocidadeC } from '../utils/formatadores.js';
import { renderizarBarraNavegacao } from './navegacao-comum.js';

function inicializarDetalhes() {
  renderizarBarraNavegacao('navbar-principal', { prefixo: '../' });

  const linkVoltar = document.getElementById('link-voltar-resultados');
  const buscaSalva = lerUltimaBusca();
  const backParams = new URLSearchParams();
  if (buscaSalva.destino) {
    backParams.set('destino', buscaSalva.destino);
  }
  if (buscaSalva.partida) {
    backParams.set('partida', buscaSalva.partida);
  }
  for (const p of buscaSalva.propulsoes || []) {
    backParams.append('propulsao', p);
  }
  if (buscaSalva.distanciaMaximaAl && buscaSalva.distanciaMaximaAl !== 'Infinity') {
    backParams.set('distancia', buscaSalva.distanciaMaximaAl);
  }
  if (buscaSalva.ordenacao && buscaSalva.ordenacao !== 'relevancia') {
    backParams.set('ordenacao', buscaSalva.ordenacao);
  }
  const backQuery = backParams.toString();
  linkVoltar.setAttribute('href', backQuery ? `resultados.html?${backQuery}` : 'resultados.html');

  const viagem = obterViagemSelecionada();
  const grupoPropulsaoEl = document.getElementById('grupo-propulsao');
  const grupoClasseEl = document.getElementById('grupo-classe');

  document.getElementById('det-destino').textContent = viagem.destinoNome;
  document.getElementById('det-sistema').textContent = `${viagem.sistemaDestino} · Nave ${viagem.onibusNome}`;
  document.getElementById('det-origem').textContent = `${viagem.origemNome} · ${viagem.origemSistema} (${viagem.partidaTexto})`;
  document.getElementById('resumo-destino').textContent = viagem.destinoNome;

  function renderizar() {
    const sel = obterSelecaoAtual();
    const resumo = obterCenarioAtivoDaViagem(viagem, sel);

    document.getElementById('det-tecnologia').textContent =
      `${resumo.opcao.propulsaoNome} · ${formatarVelocidadeC(resumo.opcao.velocidadeC)}`;
    document.getElementById('det-chegada').textContent = resumo.chegadaTexto;
    document.getElementById('det-tempo-terra').textContent = formatarAnos(resumo.tempoTerraAnos);
    document.getElementById('det-tempo-bordo').textContent = formatarAnos(resumo.duracaoBordoAnos);
    document.getElementById('det-divida').textContent = formatarAnos(resumo.dividaTemporalAnos);
    document.getElementById('resumo-custo').textContent = formatarCreditos(resumo.precoFinal);
    document.getElementById('resumo-poltrona').textContent = sel.poltrona || 'Nenhuma poltrona selecionada';
    document.getElementById('resumo-sub').textContent =
      `1 viajante · ${viagem.partidaTexto} · Classe ${resumo.classe}`;

    const crioTexto = resumo.emCriogenia
      ? 'Criogenia incluída na classe Luxo: 90% descontado direto do tempo a bordo.'
      : 'Sem criogenia (incluída apenas ao selecionar Luxo).';
    document.getElementById('status-criogenia').textContent = crioTexto;
    document.getElementById('resumo-desperto').textContent = resumo.emCriogenia
      ? 'Criogenia Luxo ativa (-90% do tempo a bordo)'
      : 'Tempo desperto: 100% do tempo a bordo';

    limparElemento(grupoPropulsaoEl);
    for (const op of resumo.opcoes) {
      const ativo = op.propulsaoNome === resumo.opcao.propulsaoNome;
      grupoPropulsaoEl.appendChild(
        criarElemento('button', {
          type: 'button',
          className: `botao${ativo ? ' botao--ativo' : ''}`,
          text: `${op.propulsaoNome} (${formatarVelocidadeC(op.velocidadeC)})`,
          dataset: { propulsao: op.propulsaoNome },
        })
      );
    }

    limparElemento(grupoClasseEl);
    for (const cl of viagem.classes || ['Executiva', 'Primeira classe', 'Luxo']) {
      const ativo = cl === resumo.classe;
      grupoClasseEl.appendChild(
        criarElemento('button', {
          type: 'button',
          className: `botao${ativo ? ' botao--ativo' : ''}`,
          text: cl,
          dataset: { classe: cl },
        })
      );
    }

    for (const btn of document.querySelectorAll('#grupo-rota [data-rota]')) {
      const ehComLumica = btn.dataset.rota === 'true';
      const ativo = ehComLumica === resumo.usaLumica;
      btn.classList.toggle('botao--ativo', ativo);
      if (ehComLumica) {
        btn.disabled = !resumo.canalAtivo;
        btn.textContent = resumo.canalAtivo ? 'Com Rota Lúmica' : 'Sem Rota Lúmica disponível';
      }
    }
    for (const btn of document.querySelectorAll('#grupo-lazer [data-lazer]')) {
      btn.classList.toggle('botao--ativo', btn.dataset.lazer === sel.lazer);
    }
    for (const btn of document.querySelectorAll('#grupo-alimentacao [data-alimentacao]')) {
      btn.classList.toggle('botao--ativo', btn.dataset.alimentacao === sel.alimentacao);
    }
  }

  grupoPropulsaoEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-propulsao]');
    if (btn) {
      atualizarSelecaoAtual({ propulsaoNome: btn.dataset.propulsao });
      renderizar();
    }
  });

  grupoClasseEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-classe]');
    if (btn) {
      atualizarSelecaoAtual({ classe: btn.dataset.classe, poltrona: null });
      renderizar();
    }
  });

  document.getElementById('grupo-rota').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-rota]');
    if (btn && !btn.disabled) {
      atualizarSelecaoAtual({ usaRotaLumica: btn.dataset.rota === 'true' });
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
