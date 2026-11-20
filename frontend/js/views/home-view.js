import { lerEstado, salvarUltimaBusca } from '../services/api-client.js';
import { criarElemento, limparElemento } from '../utils/dom-seguro.js';
import { formatarDataCurta } from '../utils/formatadores.js';
import { renderizarBarraNavegacao } from './navegacao-comum.js';

function inicializarHome() {
  renderizarBarraNavegacao('navbar-principal', { prefixo: '' });

  const selectDestino = document.getElementById('select-destino');
  const inputData = document.getElementById('input-data');
  const form = document.getElementById('form-busca-inicial');

  const estado = lerEstado();
  limparElemento(selectDestino);
  selectDestino.appendChild(
    criarElemento('option', { text: 'Todos os destinos disponíveis', attrs: { value: '' } })
  );

  for (const sistema of estado.sistemas) {
    const planetasDoSistema = estado.planetas.filter((p) => p.sistemaId === sistema.id && p.nome !== 'Terra');
    if (planetasDoSistema.length > 1) {
      selectDestino.appendChild(
        criarElemento('option', {
          text: `${sistema.nome} (Todo o sistema)`,
          attrs: { value: sistema.nome },
        })
      );
    }
  }

  for (const planeta of estado.planetas) {
    if (planeta.nome === 'Terra') {
      continue;
    }
    selectDestino.appendChild(
      criarElemento('option', {
        text: `${planeta.nome} (${planeta.sistemaNome})`,
        attrs: { value: planeta.nome },
      })
    );
  }

  form.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const destino = selectDestino.value;
    const partida = inputData.value ? formatarDataCurta(inputData.value) : '';

    salvarUltimaBusca({
      destino,
      partida,
      propulsoes: [],
      custoMaximoBi: '20',
      distanciaMaximaAl: 'Infinity',
      tempoTerraMaximoAnos: 'Infinity',
      ordenacao: 'relevancia',
    });

    const params = new URLSearchParams();
    params.set('novaBusca', '1');
    if (destino) {
      params.set('destino', destino);
    }
    if (partida) {
      params.set('partida', partida);
    }
    window.location.href = `pages/resultados.html?${params.toString()}`;
  });
}

document.addEventListener('DOMContentLoaded', inicializarHome);
