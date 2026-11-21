import { exigirAutenticacao } from '../services/auth-service.js';
import {
  atualizarSelecaoAtual,
  construirFileirasCabine,
  obterCenarioAtivoDaViagem,
  obterClassePorPoltrona,
  obterPerfilPoltronaOcupada,
  obterSelecaoAtual,
  obterTotalAssentosViagem,
  obterViagemSelecionada,
} from '../services/passagens-service.js';
import { criarElemento, limparElemento } from '../utils/dom-seguro.js';
import { formatarCreditos } from '../utils/formatadores.js';
import { renderizarBarraNavegacao } from './navegacao-comum.js';

function inicializarSelecaoPoltrona() {
  renderizarBarraNavegacao('navbar-principal', { prefixo: '../' });

  const viagem = obterViagemSelecionada();
  let sel = obterSelecaoAtual();
  const resumo = obterCenarioAtivoDaViagem(viagem, sel);
  const classesDisponiveis = viagem.classes || ['Executiva', 'Primeira classe', 'Luxo'];
  const totalAssentos = obterTotalAssentosViagem(viagem);
  const fileiras = construirFileirasCabine(totalAssentos);

  document.getElementById('cabine-capacidade-texto').textContent = `${totalAssentos} poltronas · 1 viajante`;
  document.getElementById('poltrona-destino').textContent = viagem.destinoNome;
  document.getElementById('poltrona-partida').textContent =
    `${viagem.origemNome} · ${viagem.partidaTexto} · ${resumo.opcao.propulsaoNome}`;
  document.getElementById('poltrona-custo').textContent = formatarCreditos(resumo.precoFinal);

  const plantaEl = document.getElementById('planta-cabine');
  const modalPerfil = document.getElementById('modal-perfil-procedural');
  const btnConfirmar = document.getElementById('btn-confirmar-poltrona');

  function renderizarPlanta() {
    sel = obterSelecaoAtual();
    limparElemento(plantaEl);

    plantaEl.appendChild(criarElemento('p', { className: 'cabine__proa', text: 'FRENTE DA NAVE ↑' }));
    const cab = criarElemento('div', { className: 'cabine__colunas' });
    for (const t of ['A', 'B', '·', 'C', 'D']) {
      cab.appendChild(criarElemento('span', { text: t }));
    }
    plantaEl.appendChild(cab);

    for (const f of fileiras) {
      if (f.zona) {
        plantaEl.appendChild(criarElemento('p', { className: 'cabine__zona-titulo', text: f.zona }));
      }
      const classeHabilitada = classesDisponiveis.includes(f.classeNome);
      const linha = criarElemento('div', { className: 'cabine__fileira' });

      const addColuna = (letra) => {
        const codigo = `${f.num}${letra}`;
        const ocupada = viagem.assentosOcupados.includes(codigo);
        const selecionada = sel.poltrona === codigo;
        let texto = codigo;
        let mod = '';
        if (ocupada) {
          texto = `${codigo} ×`;
          mod = ' poltrona--ocupada';
        } else if (selecionada) {
          texto = `${codigo} ✓`;
          mod = ' poltrona--selecionada';
        }

        const btn = criarElemento('button', {
          type: 'button',
          className: `poltrona ${f.classeCss}${mod}`,
          text: texto,
          dataset: { poltrona: codigo, ocupada: String(ocupada), classe: f.classeNome },
          attrs: {
            'aria-label': `Poltrona ${codigo} ${ocupada ? 'ocupada' : 'disponível'}`,
            disabled: !ocupada && !classeHabilitada ? 'disabled' : null,
          },
        });
        linha.appendChild(btn);
      };

      addColuna('A');
      addColuna('B');
      linha.appendChild(criarElemento('span', { className: 'cabine__numero-fileira', text: f.num }));
      addColuna('C');
      addColuna('D');
      plantaEl.appendChild(linha);
    }

    plantaEl.appendChild(criarElemento('p', { className: 'cabine__acesso', text: 'ACESSO À CABINE' }));

    const atualEl = document.getElementById('poltrona-atual');
    const classeEl = document.getElementById('poltrona-classe');
    if (sel.poltrona) {
      const classePoltrona = obterClassePorPoltrona(sel.poltrona, totalAssentos);
      atualEl.textContent = sel.poltrona;
      classeEl.textContent = `${classePoltrona}${classePoltrona === 'Luxo' ? ' (Criogenia 90%)' : ''} · Convés 01`;
      btnConfirmar.disabled = false;
    } else {
      atualEl.textContent = 'Escolha uma poltrona no mapa';
      classeEl.textContent = `Convés 01 · Classe ${resumo.classe}`;
      btnConfirmar.disabled = true;
    }
  }

  plantaEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-poltrona]');
    if (!btn || btn.disabled) {
      return;
    }
    const codigo = btn.dataset.poltrona;
    if (btn.dataset.ocupada === 'true') {
      const perfil = obterPerfilPoltronaOcupada(codigo);
      document.getElementById('perfil-titulo').textContent = `Poltrona ${codigo} · Ocupada`;
      document.getElementById('perfil-nome').textContent = perfil.nome;
      document.getElementById('perfil-ocupacao').textContent = perfil.ocupacao;
      modalPerfil.classList.remove('oculto');
      return;
    }
    atualizarSelecaoAtual({ poltrona: codigo, classe: btn.dataset.classe });
    renderizarPlanta();
  });

  document.getElementById('btn-fechar-perfil').addEventListener('click', () => {
    modalPerfil.classList.add('oculto');
  });

  document.getElementById('btn-limpar-poltrona').addEventListener('click', () => {
    atualizarSelecaoAtual({ poltrona: null });
    renderizarPlanta();
  });

  btnConfirmar.addEventListener('click', () => {
    const auth = exigirAutenticacao();
    if (!auth.autorizado) {
      window.location.href = `login.html?retorno=${encodeURIComponent('confirmacao-viagem.html')}`;
      return;
    }
    window.location.href = 'confirmacao-viagem.html';
  });

  renderizarPlanta();
}

document.addEventListener('DOMContentLoaded', inicializarSelecaoPoltrona);
