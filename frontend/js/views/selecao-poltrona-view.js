import { exigirAutenticacao } from '../services/auth-service.js';
import { atualizarSelecaoAtual, obterPerfilPoltronaOcupada, obterSelecaoAtual, obterViagemSelecionada } from '../services/passagens-service.js';
import { criarElemento, limparElemento } from '../utils/dom-seguro.js';
import { formatarCreditos } from '../utils/formatadores.js';
import { renderizarBarraNavegacao } from './navegacao-comum.js';

const FILEIRAS = [
  { num: '01', zona: 'LUXO · 2 poltronas', classeCss: 'poltrona--luxo' },
  { num: '02', zona: 'PRIMEIRA CLASSE · 4 poltronas', classeCss: 'poltrona--primeira' },
  { num: '03', zona: 'EXECUTIVA · 16 poltronas', classeCss: '' },
  { num: '04', zona: null, classeCss: '' },
  { num: '05', zona: null, classeCss: '' },
  { num: '06', zona: null, classeCss: '' },
];

function inicializarSelecaoPoltrona() {
  renderizarBarraNavegacao('navbar-principal', { prefixo: '../' });

  const viagem = obterViagemSelecionada();
  let sel = obterSelecaoAtual();
  const cenario = sel.usaRotaLumica ? viagem.comLumica : viagem.semLumica;

  document.getElementById('poltrona-destino').textContent = viagem.destinoNome;
  document.getElementById('poltrona-partida').textContent = `${viagem.origemNome} · ${viagem.partidaTexto} · 1 viajante`;
  document.getElementById('poltrona-custo').textContent = formatarCreditos(cenario.precoFinal);

  const plantaEl = document.getElementById('planta-cabine');
  const modalPerfil = document.getElementById('modal-perfil-procedural');
  const btnConfirmar = document.getElementById('btn-confirmar-poltrona');

  function classePorPoltrona(codigo) {
    if (codigo.startsWith('01')) {
      return 'Luxo · Convés 01';
    }
    if (codigo.startsWith('02')) {
      return 'Primeira classe · Convés 01';
    }
    return 'Executiva · Convés 01';
  }

  function renderizarPlanta() {
    sel = obterSelecaoAtual();
    limparElemento(plantaEl);

    plantaEl.appendChild(criarElemento('p', { className: 'cabine__proa', text: 'FRENTE DA NAVE ↑' }));
    const cab = criarElemento('div', { className: 'cabine__colunas' });
    for (const t of ['A', 'B', '·', 'C', 'D']) {
      cab.appendChild(criarElemento('span', { text: t }));
    }
    plantaEl.appendChild(cab);

    for (const f of FILEIRAS) {
      if (f.zona) {
        plantaEl.appendChild(criarElemento('p', { className: 'cabine__zona-titulo', text: f.zona }));
      }
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
          dataset: { poltrona: codigo, ocupada: String(ocupada) },
          attrs: { 'aria-label': `Poltrona ${codigo} ${ocupada ? 'ocupada' : 'disponível'}` },
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
      atualEl.textContent = sel.poltrona;
      classeEl.textContent = classePorPoltrona(sel.poltrona);
      btnConfirmar.disabled = false;
    } else {
      atualEl.textContent = 'Escolha uma poltrona no mapa';
      classeEl.textContent = 'Convés 01 · Cabine de passageiros';
      btnConfirmar.disabled = true;
    }
  }

  plantaEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-poltrona]');
    if (!btn) {
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
    atualizarSelecaoAtual({ poltrona: codigo });
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
