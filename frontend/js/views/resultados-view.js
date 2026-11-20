import { lerEstado } from '../services/api-client.js';
import { atualizarSelecaoAtual } from '../services/passagens-service.js';
import { criarElemento, limparElemento } from '../utils/dom-seguro.js';
import { filtrarViagens, ordenarViagens } from '../utils/filtros-viagem.js';
import { formatarAnos, formatarCreditos, formatarDistanciaAnosLuz, formatarVelocidadeC } from '../utils/formatadores.js';
import { renderizarBarraNavegacao, renderizarEstado } from './navegacao-comum.js';

function inicializarResultados() {
  renderizarBarraNavegacao('navbar-principal', { prefixo: '../' });

  const selectDestino = document.getElementById('busca-destino');
  const listaViagensEl = document.getElementById('lista-viagens');
  const contadorEl = document.getElementById('contador-viagens');
  const chipsEl = document.getElementById('chips-filtros');
  const filtroCusto = document.getElementById('filtro-custo');
  const textoLimiteCusto = document.getElementById('texto-limite-custo');
  const filtroDistancia = document.getElementById('filtro-distancia');
  const filtroTempo = document.getElementById('filtro-tempo');
  const selectOrdenacao = document.getElementById('select-ordenacao');
  const modalComparacao = document.getElementById('modal-comparacao');

  const estado = lerEstado();
  for (const planeta of estado.planetas) {
    if (planeta.nome === 'Terra') {
      continue;
    }
    selectDestino.appendChild(criarElemento('option', { text: planeta.nome, attrs: { value: planeta.nome } }));
  }

  const params = new URLSearchParams(window.location.search);
  if (params.get('destino')) {
    selectDestino.value = params.get('destino');
  }
  if (params.get('partida')) {
    document.getElementById('busca-partida').value = params.get('partida');
  }

  function abrirModalComparacao(viagem) {
    const sub = document.getElementById('subtitulo-modal-comparar');
    const grid = document.getElementById('conteudo-modal-comparar');
    sub.textContent = `${viagem.destinoNome} · Valores demonstrativos`;
    limparElemento(grid);

    const criarCardOpcao = (titulo, usaLumica, cenario, notaPedagio) => {
      const card = criarElemento('article', { className: 'comparacao-card' });
      card.appendChild(criarElemento('h3', { text: titulo }));
      card.appendChild(criarElemento('p', { className: 'comparacao-card__preco', text: formatarCreditos(cenario.precoFinal) }));
      card.appendChild(
        criarElemento('p', {
          className: 'comparacao-card__detalhes',
          text: `A bordo: ${formatarAnos(cenario.duracaoBordoAnos)}\nNa Terra: ${formatarAnos(cenario.tempoTerraAnos)}\nDívida temporal: ${formatarAnos(cenario.dividaTemporalAnos)}`,
        })
      );
      card.appendChild(criarElemento('p', { className: 'texto-secundario', text: notaPedagio }));

      const btn = criarElemento('button', {
        type: 'button',
        className: 'botao botao--primario botao--bloco',
        text: 'Selecionar esta rota',
      });
      btn.addEventListener('click', () => {
        atualizarSelecaoAtual({ viagemId: viagem.id, usaRotaLumica: usaLumica });
        window.location.href = 'detalhes-viagem.html';
      });
      card.appendChild(btn);
      return card;
    };

    grid.appendChild(criarCardOpcao('Sem Rota Lúmica', false, viagem.semLumica, 'Sem Pedágio Lúmico'));
    grid.appendChild(
      criarCardOpcao('Com Rota Lúmica', true, viagem.comLumica, `Pedágio Lúmico: ${formatarCreditos(viagem.comLumica.pedagio || 0)}`)
    );
    modalComparacao.classList.remove('oculto');
  }

  function renderizar() {
    const propulsoes = Array.from(document.querySelectorAll('input[name="propulsao"]:checked')).map((el) => el.value);
    const custoMaximo = Number(filtroCusto.value) * 1e9;
    const distanciaMaximaAl = Number(filtroDistancia.value);
    const tempoTerraMaximoAnos = Number(filtroTempo.value);

    const filtradas = ordenarViagens(
      filtrarViagens(lerEstado().viagens, {
        destino: selectDestino.value,
        propulsoes,
        custoMaximo,
        distanciaMaximaAl,
        tempoTerraMaximoAnos,
      }),
      selectOrdenacao.value
    );

    contadorEl.textContent = `${filtradas.length} viagens encontradas`;

    limparElemento(chipsEl);
    if (custoMaximo < 20e9) {
      chipsEl.appendChild(criarElemento('span', { className: 'chip', text: `Até US$ ${filtroCusto.value} bi` }));
    }
    if (propulsoes.length > 0) {
      chipsEl.appendChild(criarElemento('span', { className: 'chip', text: `${propulsoes.length} tecnologias` }));
    }

    if (filtradas.length === 0) {
      renderizarEstado(listaViagensEl, {
        tipo: 'empty',
        titulo: 'Nenhuma viagem encontrada',
        mensagem: 'Ajuste os filtros aplicados para visualizar outras rotas interestelares.',
        acaoTexto: 'Restaurar filtros',
        onAcao: limparFiltros,
      });
      return;
    }

    limparElemento(listaViagensEl);
    for (const v of filtradas) {
      const card = criarElemento('article', {
        className: `viagem-card${v.id === 1 ? ' viagem-card--principal' : ''}`,
      });

      const principal = criarElemento('div');
      const topo = criarElemento('div', { className: 'viagem-card__topo' });
      const infoTitulo = criarElemento('div');
      infoTitulo.appendChild(criarElemento('p', { className: 'card__eyebrow', text: v.correspondencia }));
      infoTitulo.appendChild(criarElemento('h3', { className: 'card__titulo', text: v.destinoNome }));
      infoTitulo.appendChild(
        criarElemento('p', { className: 'card__subtitulo', text: `${v.origemNome} · ${v.partidaTexto} / ${v.sistemaDestino}` })
      );

      const badgeTech = criarElemento('span', {
        className: 'badge',
        text: `${v.propulsaoNome} · ${formatarVelocidadeC(v.velocidadeC)}`,
      });
      topo.append(infoTitulo, badgeTech);
      principal.appendChild(topo);

      const metricas = criarElemento('div', { className: 'viagem-card__metricas' });
      const addMetrica = (rotulo, valor, lavanda = false) => {
        const box = criarElemento('div');
        box.appendChild(criarElemento('p', { className: 'metrica__rotulo', text: rotulo }));
        box.appendChild(
          criarElemento('p', { className: `metrica__valor${lavanda ? ' metrica__valor--lavanda' : ''}`, text: valor })
        );
        metricas.appendChild(box);
      };
      addMetrica('Distância', formatarDistanciaAnosLuz(v.distanciaAl));
      addMetrica('Tempo na Terra', formatarAnos(v.semLumica.tempoTerraAnos));
      addMetrica('Tempo a bordo', formatarAnos(v.semLumica.duracaoBordoAnos));
      addMetrica('Dívida temporal', formatarAnos(v.semLumica.dividaTemporalAnos), true);
      principal.appendChild(metricas);

      const classesRow = criarElemento('div', { className: 'navbar__acoes' });
      for (const cl of v.classes) {
        classesRow.appendChild(criarElemento('span', { className: 'badge', text: cl }));
      }
      principal.appendChild(classesRow);

      const lateral = criarElemento('div', { className: 'viagem-card__lateral' });
      const blocoPreco = criarElemento('div');
      blocoPreco.appendChild(criarElemento('p', { className: 'metrica__rotulo', text: 'CUSTO ESTIMADO / VIAJANTE' }));
      blocoPreco.appendChild(criarElemento('p', { className: 'viagem-card__preco', text: formatarCreditos(v.semLumica.precoFinal) }));
      blocoPreco.appendChild(criarElemento('p', { className: 'texto-mutado', text: `Chegada estimada · ${v.chegadaTexto}` }));
      lateral.appendChild(blocoPreco);

      const btnComparar = criarElemento('button', {
        type: 'button',
        className: 'viagem-card__link-lumica',
        text: 'Com ou sem Rota Lúmica →',
      });
      btnComparar.addEventListener('click', () => abrirModalComparacao(v));
      lateral.appendChild(btnComparar);

      const btnVer = criarElemento('button', {
        type: 'button',
        className: 'botao botao--primario botao--bloco',
        text: 'Ver viagem →',
      });
      btnVer.addEventListener('click', () => {
        atualizarSelecaoAtual({ viagemId: v.id });
        window.location.href = 'detalhes-viagem.html';
      });
      lateral.appendChild(btnVer);

      card.append(principal, lateral);
      listaViagensEl.appendChild(card);
    }
  }

  function limparFiltros() {
    for (const chk of document.querySelectorAll('input[name="propulsao"]')) {
      chk.checked = false;
    }
    filtroCusto.value = '20';
    textoLimiteCusto.textContent = 'Até US$ 20 bi';
    filtroDistancia.value = 'Infinity';
    filtroTempo.value = 'Infinity';
    selectDestino.value = '';
    renderizar();
  }

  filtroCusto.addEventListener('input', () => {
    textoLimiteCusto.textContent = `Até US$ ${filtroCusto.value} bi`;
  });
  document.getElementById('btn-aplicar-filtros').addEventListener('click', renderizar);
  document.getElementById('btn-limpar-filtros').addEventListener('click', limparFiltros);
  selectOrdenacao.addEventListener('change', renderizar);
  document.getElementById('form-busca-topo').addEventListener('submit', (e) => {
    e.preventDefault();
    renderizar();
  });

  const fecharModal = () => modalComparacao.classList.add('oculto');
  document.getElementById('btn-fechar-modal-comparar').addEventListener('click', fecharModal);
  document.getElementById('btn-voltar-comparar').addEventListener('click', fecharModal);

  renderizar();
}

document.addEventListener('DOMContentLoaded', inicializarResultados);
