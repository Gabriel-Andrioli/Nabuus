import { lerEstado } from '../services/api-client.js';
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
    const params = new URLSearchParams();
    if (selectDestino.value) {
      params.set('destino', selectDestino.value);
    }
    if (inputData.value) {
      params.set('partida', formatarDataCurta(inputData.value));
    }
    const query = params.toString();
    window.location.href = `pages/resultados.html${query ? `?${query}` : ''}`;
  });
}

document.addEventListener('DOMContentLoaded', inicializarHome);
