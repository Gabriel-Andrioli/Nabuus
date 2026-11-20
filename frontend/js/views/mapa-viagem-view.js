import {
  atualizarSelecaoAtual,
  obterCenarioAtivoDaViagem,
  obterSelecaoAtual,
  obterViagemSelecionada,
} from '../services/passagens-service.js';
import { criarElemento, criarSvg, limparElemento } from '../utils/dom-seguro.js';
import { calcularFatorLorentz, formatarAnos, formatarCreditos, formatarDistanciaAnosLuz, formatarVelocidadeC } from '../utils/formatadores.js';
import { renderizarBarraNavegacao } from './navegacao-comum.js';

function desenharMapa2D(svg, viagem, usaLumica, paradasSemLumica) {
  limparElemento(svg);

  for (let x = 135; x < 1336; x += 134) {
    svg.appendChild(criarSvg('line', { x1: x, y1: 0, x2: x, y2: 320, stroke: '#494057', 'stroke-width': 0.5, 'stroke-opacity': 0.4 }));
  }
  for (let y = 32; y < 320; y += 32) {
    svg.appendChild(criarSvg('line', { x1: 0, y1: y, x2: 1336, y2: y, stroke: '#494057', 'stroke-width': 0.5, 'stroke-opacity': 0.4 }));
  }

  for (let i = 1; i <= 40; i += 1) {
    const sx = (i * 197 + 51) % 1280 + 28;
    const sy = (i * 89 + 31) % 270 + 25;
    svg.appendChild(criarSvg('circle', { cx: sx, cy: sy, r: (i % 2) + 1, fill: '#CFC5DA', opacity: 0.6 }));
  }

  svg.appendChild(criarSvg('ellipse', { cx: 334, cy: 223, rx: 190, ry: 45, fill: 'none', stroke: '#494057', 'stroke-dasharray': '4 4' }));
  svg.appendChild(criarSvg('ellipse', { cx: 985, cy: 88, rx: 111, ry: 27, fill: 'none', stroke: '#494057', 'stroke-dasharray': '4 4' }));

  const paradas = usaLumica ? 0 : paradasSemLumica;
  const dTrajeto = paradas > 0
    ? 'M 334 223 Q 500 180 658 155 T 985 88'
    : 'M 334 223 Q 640 130 985 88';
  svg.appendChild(
    criarSvg('path', {
      d: dTrajeto,
      fill: 'none',
      stroke: usaLumica ? '#E0C9FF' : '#C7AFE9',
      'stroke-width': usaLumica ? 3 : 2,
      'stroke-dasharray': usaLumica ? '8 4' : 'none',
    })
  );

  if (paradas > 0) {
    svg.appendChild(criarSvg('circle', { cx: 658, cy: 155, r: 6, fill: '#E0C9FF', stroke: '#110E1E', 'stroke-width': 2 }));
    svg.appendChild(criarSvg('text', { x: 658, y: 178, fill: '#C7AFE9', 'font-size': 10, 'text-anchor': 'middle' })).textContent = 'Posto de Recarga';
  }

  svg.appendChild(criarSvg('circle', { cx: 334, cy: 223, r: 8, fill: '#F8F5FF' }));
  svg.appendChild(criarSvg('text', { x: 334, y: 256, fill: '#F8F5FF', 'font-size': 13, 'text-anchor': 'middle' })).textContent = viagem.origemNome;

  svg.appendChild(criarSvg('circle', { cx: 985, cy: 88, r: 8, fill: '#C7AFE9' }));
  svg.appendChild(criarSvg('text', { x: 985, y: 64, fill: '#F8F5FF', 'font-size': 12, 'text-anchor': 'middle' })).textContent = viagem.destinoNome;

  const infoTopo = criarSvg('text', { x: 24, y: 24, fill: '#F7F5FF', 'font-size': 11 });
  infoTopo.textContent = `Paradas de recarga: ${paradas} · Distância: ${formatarDistanciaAnosLuz(viagem.distanciaAl)}`;
  svg.appendChild(infoTopo);
}

function inicializarMapa() {
  renderizarBarraNavegacao('navbar-principal', { prefixo: '../' });

  const viagem = obterViagemSelecionada();
  let selecao = obterSelecaoAtual();

  document.getElementById('mapa-origem').textContent = `${viagem.origemNome} · ${viagem.origemSistema}`;
  document.getElementById('mapa-partida').textContent = viagem.partidaTexto;
  document.getElementById('mapa-destino').textContent = viagem.destinoNome;

  function atualizarTela() {
    selecao = obterSelecaoAtual();
    const resumo = obterCenarioAtivoDaViagem(viagem, selecao);
    const gama = calcularFatorLorentz(resumo.opcao.velocidadeC).toFixed(2).replace('.', ',');

    document.getElementById('mapa-chegada').textContent = resumo.chegadaTexto;
    document.getElementById('mapa-resumo-tecnico').textContent =
      `${formatarDistanciaAnosLuz(viagem.distanciaAl)} · ${resumo.opcao.propulsaoNome} (${formatarVelocidadeC(resumo.opcao.velocidadeC)}) · ${gama} γ · Autonomia: ${resumo.opcao.autonomiaAl.toFixed(2).replace('.', ',')} al`;
    document.getElementById('status-modalidade-mapa').textContent =
      `Modalidade selecionada: ${resumo.usaLumica ? 'Com Rota Lúmica' : 'Sem Rota Lúmica'}`;

    desenharMapa2D(document.getElementById('svg-mapa-2d'), viagem, resumo.usaLumica, resumo.opcao.semLumica.paradas);

    const container = document.getElementById('cards-metricas-mapa');
    limparElemento(container);

    const criarCard = (titulo, cenarioItem, ativo, habilitado, legendaExtra, onClick) => {
      const duracao = cenarioItem
        ? (resumo.emCriogenia ? cenarioItem.duracaoBordoAnos * 0.1 : cenarioItem.duracaoBordoAnos)
        : 0;
      const card = criarElemento('article', {
        className: `card${ativo ? ' card--destaque' : ''}`,
      });
      card.appendChild(criarElemento('h2', { className: 'card__subtitulo', text: titulo }));
      card.appendChild(
        criarElemento('p', {
          className: 'card__titulo',
          text: cenarioItem
            ? `${formatarCreditos(cenarioItem.precoFinal)} · A bordo: ${formatarAnos(duracao)} · Dívida: ${formatarAnos(cenarioItem.dividaTemporalAnos)}`
            : 'Rota Lúmica indisponível para este sistema',
        })
      );
      if (cenarioItem) {
        card.appendChild(
          criarElemento('p', {
            className: 'texto-secundario',
            text: `Na Terra: ${formatarAnos(cenarioItem.tempoTerraAnos)} · Paradas de recarga: ${cenarioItem.paradas} · ${legendaExtra}`,
          })
        );
      }

      const btn = criarElemento('button', {
        type: 'button',
        className: `botao ${ativo ? 'botao--ativo' : 'botao--primario'}`,
        text: habilitado ? (ativo ? 'Modalidade selecionada ✓' : 'Usar esta modalidade') : 'Canal lúmico indisponível',
        attrs: habilitado ? {} : { disabled: 'disabled' },
      });
      if (habilitado) {
        btn.addEventListener('click', onClick);
      }
      card.appendChild(btn);
      return card;
    };

    container.appendChild(
      criarCard('Sem Rota Lúmica', resumo.opcao.semLumica, !resumo.usaLumica, true, 'Sem Pedágio Lúmico', () => {
        atualizarSelecaoAtual({ usaRotaLumica: false });
        atualizarTela();
      })
    );
    container.appendChild(
      criarCard(
        'Com Rota Lúmica',
        resumo.opcao.comLumica,
        resumo.usaLumica,
        resumo.canalAtivo,
        resumo.opcao.comLumica ? `Pedágio Lúmico: ${formatarCreditos(resumo.opcao.comLumica.pedagio || 0)}` : '',
        () => {
          atualizarSelecaoAtual({ usaRotaLumica: true });
          atualizarTela();
        }
      )
    );
  }

  atualizarTela();
}

document.addEventListener('DOMContentLoaded', inicializarMapa);
