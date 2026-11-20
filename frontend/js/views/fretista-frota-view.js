import { listarFrota } from '../services/frota-viagens-service.js';
import { criarElemento, limparElemento } from '../utils/dom-seguro.js';
import { formatarVelocidadeC } from '../utils/formatadores.js';
import { renderizarBarraNavegacao, renderizarEstado } from './navegacao-comum.js';

function inicializarFrotaSomenteLeitura() {
  renderizarBarraNavegacao('navbar-principal', { prefixo: '../' });

  const listaEl = document.getElementById('lista-onibus');
  const frota = listarFrota();

  if (frota.length === 0) {
    renderizarEstado(listaEl, {
      tipo: 'empty',
      titulo: 'Nenhuma nave registrada',
      mensagem: 'Solicite ao perfil Astrônomo o cadastro de naves e propulsões.',
    });
    return;
  }

  limparElemento(listaEl);
  for (const nave of frota) {
    const versoes = nave.versoesPropulsao && nave.versoesPropulsao.length > 0
      ? nave.versoesPropulsao
      : [{ propulsaoNome: nave.propulsaoNome, velocidadeC: nave.velocidadeC }];
    const resumoVersoes = versoes
      .map((vr) => `${vr.propulsaoNome} (${formatarVelocidadeC(vr.velocidadeC)})`)
      .join(' · ');

    const card = criarElemento('article', { className: 'card viagem-card__topo' });
    const info = criarElemento('div');
    info.appendChild(criarElemento('h2', { className: 'card__titulo', text: nave.identificacao }));
    info.appendChild(
      criarElemento('p', {
        className: 'card__subtitulo',
        text: `Versões de propulsão: ${resumoVersoes} · ${nave.totalAssentos} poltronas`,
      })
    );
    card.appendChild(info);
    card.appendChild(criarElemento('span', { className: 'badge', text: 'Registrada pelo Astrônomo' }));
    listaEl.appendChild(card);
  }
}

document.addEventListener('DOMContentLoaded', inicializarFrotaSomenteLeitura);
