import {
  alternarStatusRotaLumica,
  excluirRegistroCartografico,
  listarCatalogo,
  salvarNave,
  salvarPlaneta,
  salvarPropulsao,
  salvarRotaLumica,
  salvarSistema,
} from '../services/cartografia-service.js';
import { criarElemento, limparElemento } from '../utils/dom-seguro.js';
import { formatarCreditos, formatarDistanciaAnosLuz, formatarVelocidadeC } from '../utils/formatadores.js';
import { CAPACIDADES_ASSENTOS_NAVE } from '../utils/validadores.js';
import { renderizarBarraNavegacao } from './navegacao-comum.js';

function inicializarCatalogoAstronomo() {
  renderizarBarraNavegacao('navbar-principal', { prefixo: '../' });

  const params = new URLSearchParams(window.location.search);
  let abaAtual = params.get('aba') || 'planetas';
  let rascunho = null;
  let acaoModalPendente = null;

  const secLista = document.getElementById('sec-astro-lista');
  const secCadastro = document.getElementById('sec-astro-cadastro');
  const secRevisao = document.getElementById('sec-astro-revisao');
  const secConcluido = document.getElementById('sec-astro-concluido');
  const camposEl = document.getElementById('campos-astro-dinamicos');
  const modal = document.getElementById('modal-astro-acao');

  function mostrarEtapa(alvo) {
    for (const s of [secLista, secCadastro, secRevisao, secConcluido]) {
      s.classList.add('oculto');
    }
    alvo.classList.remove('oculto');
  }

  function atualizarCabecalhoAba() {
    const titulos = {
      planetas: ['Catálogo de planetas', 'Novo planeta'],
      sistemas: ['Catálogo de sistemas', 'Novo sistema'],
      propulsoes: ['Catálogo de propulsões', 'Nova propulsão'],
      naves: ['Catálogo de naves', 'Nova nave'],
      rotas: ['Rotas Lúmicas', 'Nova Rota Lúmica'],
    };
    const [titulo, botao] = titulos[abaAtual] || titulos.planetas;
    document.getElementById('titulo-catalogo-astro').textContent = titulo;
    document.getElementById('btn-novo-registro').textContent = botao;
    for (const btn of document.querySelectorAll('#tabs-astro [data-aba]')) {
      btn.classList.toggle('botao--ativo', btn.dataset.aba === abaAtual);
    }
  }

  function renderizarLista() {
    atualizarCabecalhoAba();
    mostrarEtapa(secLista);
    limparElemento(secLista);

    const itens = listarCatalogo(abaAtual);
    for (const item of itens) {
      const card = criarElemento('article', { className: 'card viagem-card__topo' });
      const info = criarElemento('div');
      const acoes = criarElemento('div', { className: 'navbar__acoes' });

      if (abaAtual === 'planetas') {
        info.appendChild(criarElemento('h2', { className: 'card__titulo', text: item.nome }));
        info.appendChild(
          criarElemento('p', {
            className: 'card__subtitulo',
            text: `${item.sistemaNome} · ${item.tipo} · ${item.distanciaEstrelaUA} UA · Posto de recarga: ${item.possuiPostoRecarga ? 'Sim' : 'Não'}`,
          })
        );
      } else if (abaAtual === 'sistemas') {
        info.appendChild(criarElemento('h2', { className: 'card__titulo', text: item.nome }));
        info.appendChild(
          criarElemento('p', {
            className: 'card__subtitulo',
            text: `${item.configuracao} · ${formatarDistanciaAnosLuz(item.distanciaSolAl)} · RA ${item.ra}° / Dec ${item.dec}°`,
          })
        );
      } else if (abaAtual === 'propulsoes') {
        const minC = item.velocidadeMinC ?? item.velocidadeCruzeiroC;
        const maxC = item.velocidadeMaxC ?? item.velocidadeCruzeiroC;
        info.appendChild(criarElemento('h2', { className: 'card__titulo', text: item.nome }));
        info.appendChild(
          criarElemento('p', {
            className: 'card__subtitulo',
            text: `Intervalo: ${formatarVelocidadeC(minC)} a ${formatarVelocidadeC(maxC)} · Aceleração: ${item.aceleracaoG} g · Autonomia: ${item.autonomiaAnosLuz} anos-luz`,
          })
        );
      } else if (abaAtual === 'naves') {
        const versoes = item.versoesPropulsao && item.versoesPropulsao.length > 0
          ? item.versoesPropulsao
          : [{ propulsaoNome: item.propulsaoNome, velocidadeC: item.velocidadeC }];
        const textoVersoes = versoes
          .map((vr) => `${vr.propulsaoNome} (${formatarVelocidadeC(vr.velocidadeC)})`)
          .join(' · ');
        info.appendChild(criarElemento('h2', { className: 'card__titulo', text: item.identificacao }));
        info.appendChild(
          criarElemento('p', {
            className: 'card__subtitulo',
            text: `Versões: ${textoVersoes} · ${item.totalAssentos} poltronas`,
          })
        );
      } else if (abaAtual === 'rotas') {
        info.appendChild(criarElemento('h2', { className: 'card__titulo', text: `${item.origemSistema} → ${item.destinoSistemaNome}` }));
        info.appendChild(
          criarElemento('p', {
            className: 'card__subtitulo',
            text: `${formatarVelocidadeC(item.velocidadeC)} · Pedágio Lúmico: ${formatarCreditos(item.pedagio)}`,
          })
        );
        acoes.appendChild(
          criarElemento('button', {
            type: 'button',
            className: item.ativa ? 'botao' : 'botao botao--primario',
            text: item.ativa ? 'Ativa · Desativar' : 'Inativa · Reativar',
            dataset: { acao: 'alternar-rota', id: String(item.id), nome: item.destinoSistemaNome, ativa: String(item.ativa) },
          })
        );
      }

      acoes.appendChild(
        criarElemento('button', {
          type: 'button',
          className: 'botao botao--perigo',
          text: 'Excluir',
          dataset: { acao: 'excluir', id: String(item.id), nome: item.nome || item.identificacao || item.destinoSistemaNome },
        })
      );
      card.append(info, acoes);
      secLista.appendChild(card);
    }
  }

  function adicionarCampoTexto(id, rotulo, valorPadrao = '', tipo = 'text', opcoes = {}) {
    const { readonly = false, disabled = false } = opcoes;
    const wrap = criarElemento('div', { className: 'campo' });
    wrap.appendChild(criarElemento('label', { className: 'campo__rotulo', for: id, text: rotulo }));
    wrap.appendChild(
      criarElemento('input', {
        id,
        type: tipo,
        className: 'campo__controle',
        attrs: {
          value: valorPadrao,
          required: 'required',
          step: tipo === 'number' ? 'any' : null,
          readonly: readonly ? 'readonly' : null,
          disabled: disabled ? 'disabled' : null,
        },
      })
    );
    camposEl.appendChild(wrap);
  }

  function adicionarCampoSelect(id, rotulo, opcoes, valorPadrao = '', mensagemVazio = 'Nenhum registro disponível') {
    const wrap = criarElemento('div', { className: 'campo' });
    wrap.appendChild(criarElemento('label', { className: 'campo__rotulo', for: id, text: rotulo }));
    const selectEl = criarElemento('select', {
      id,
      className: 'campo__select',
      attrs: {
        required: 'required',
        disabled: opcoes.length === 0 ? 'disabled' : null,
      },
    });
    if (opcoes.length === 0) {
      selectEl.appendChild(
        criarElemento('option', {
          text: mensagemVazio,
          attrs: { value: '', disabled: 'disabled', selected: 'selected' },
        })
      );
    } else {
      const possuiPadrao = opcoes.some((op) => String(op.valor) === String(valorPadrao));
      const valorSelecionado = possuiPadrao ? String(valorPadrao) : String(opcoes[0].valor);
      for (const op of opcoes) {
        selectEl.appendChild(
          criarElemento('option', {
            text: op.rotulo,
            attrs: {
              value: String(op.valor),
              selected: String(op.valor) === valorSelecionado ? 'selected' : null,
            },
          })
        );
      }
    }
    wrap.appendChild(selectEl);
    wrap.appendChild(criarElemento('span', { id: `erro-${id}`, className: 'campo__erro' }));
    camposEl.appendChild(wrap);
  }

  function abrirCadastro() {
    limparElemento(camposEl);
    if (abaAtual === 'planetas') {
      adicionarCampoTexto('ast-nome', '01 · NOME DO PLANETA', 'Aurora b');
      const sistemas = listarCatalogo('sistemas');
      adicionarCampoSelect(
        'ast-sistema',
        '02 · SISTEMA DE LOCALIZAÇÃO',
        sistemas.map((s) => ({ valor: String(s.id), rotulo: s.nome })),
        '3',
        'Nenhum sistema cadastrado'
      );
      adicionarCampoTexto('ast-tipo', '03 · TIPO DO PLANETA', 'Rochoso');
      adicionarCampoTexto('ast-ua', '04 · DISTÂNCIA À ESTRELA (UA)', '0.08', 'number');
      const chkLabel = criarElemento('label', { className: 'check-item' });
      chkLabel.appendChild(criarElemento('input', { id: 'ast-posto', type: 'checkbox', attrs: { checked: 'checked' } }));
      chkLabel.appendChild(document.createTextNode('Posto de Recarga de Combustível'));
      camposEl.appendChild(chkLabel);
    } else if (abaAtual === 'sistemas') {
      adicionarCampoTexto('ast-nome', '01 · NOME DO SISTEMA', 'Sistema Aurora');
      adicionarCampoTexto('ast-config', '02 · CONFIGURAÇÃO ESTELAR', 'Estrela única');
      adicionarCampoTexto('ast-dist', '03 · DISTÂNCIA DO SOL (ANOS-LUZ)', '4.5', 'number');
      adicionarCampoTexto('ast-ra', '04 · ASCENSÃO RETA (RA GRAUS)', '180.0', 'number');
      adicionarCampoTexto('ast-dec', '05 · DECLINAÇÃO (DEC GRAUS)', '-15.0', 'number');
    } else if (abaAtual === 'propulsoes') {
      adicionarCampoTexto('ast-nome', '01 · TECNOLOGIA DE PROPULSÃO', 'Dobra de Alcúbierre (Sub-relativística)');
      adicionarCampoTexto('ast-acel', '02 · ACELERAÇÃO (G)', '0.40', 'number');
      adicionarCampoTexto('ast-vel-min', '03 · VELOCIDADE MÍNIMA (C)', '0.080', 'number');
      adicionarCampoTexto('ast-vel-max', '04 · VELOCIDADE MÁXIMA (C)', '0.220', 'number');
      adicionarCampoTexto('ast-auto', '05 · AUTONOMIA MÁXIMA (ANOS-LUZ)', '10.0', 'number');
    } else if (abaAtual === 'naves') {
      adicionarCampoTexto('ast-nome', '01 · IDENTIFICAÇÃO DA NAVE', 'NABUUS Polaris');
      const wrapAssentos = criarElemento('div', { className: 'campo' });
      wrapAssentos.appendChild(
        criarElemento('label', {
          className: 'campo__rotulo',
          for: 'ast-assentos',
          text: '02 · CAPACIDADE DE POLTRONAS',
        })
      );
      const selectAssentos = criarElemento('select', {
        id: 'ast-assentos',
        className: 'campo__select',
        attrs: { required: 'required' },
      });
      for (const qtd of CAPACIDADES_ASSENTOS_NAVE) {
        selectAssentos.appendChild(
          criarElemento('option', {
            text: `${qtd} poltronas`,
            attrs: {
              value: String(qtd),
              selected: qtd === 32 ? 'selected' : null,
            },
          })
        );
      }
      wrapAssentos.appendChild(selectAssentos);
      camposEl.appendChild(wrapAssentos);

      const grupo = criarElemento('div', { className: 'lista-pilha' });
      grupo.appendChild(criarElemento('p', { className: 'campo__rotulo', text: '03 · VERSÕES DE PROPULSÃO E VELOCIDADES DA NAVE' }));

      const propulsoes = listarCatalogo('propulsoes');
      propulsoes.forEach((prop, idx) => {
        const minC = prop.velocidadeMinC ?? prop.velocidadeCruzeiroC;
        const maxC = prop.velocidadeMaxC ?? prop.velocidadeCruzeiroC;
        const cardProp = criarElemento('div', { className: 'card card--painel lista-pilha' });
        const chkWrap = criarElemento('label', { className: 'check-item' });
        const chk = criarElemento('input', {
          id: `ast-nav-prop-${prop.id}`,
          type: 'checkbox',
          dataset: { propId: String(prop.id) },
          attrs: idx === 0 ? { checked: 'checked' } : {},
        });
        chkWrap.appendChild(chk);
        chkWrap.appendChild(
          document.createTextNode(`${prop.nome} (intervalo ${formatarVelocidadeC(minC)} a ${formatarVelocidadeC(maxC)})`)
        );
        cardProp.appendChild(chkWrap);

        const campoVel = criarElemento('div', { className: 'campo' });
        campoVel.appendChild(
          criarElemento('label', {
            className: 'campo__rotulo',
            for: `ast-nav-vel-${prop.id}`,
            text: `Velocidade da versão ${prop.nome} (c)`,
          })
        );
        campoVel.appendChild(
          criarElemento('input', {
            id: `ast-nav-vel-${prop.id}`,
            type: 'number',
            className: 'campo__controle',
            attrs: {
              min: String(minC),
              max: String(maxC),
              step: '0.001',
              value: String(prop.velocidadeCruzeiroC),
            },
          })
        );
        cardProp.appendChild(campoVel);
        grupo.appendChild(cardProp);
      });
      camposEl.appendChild(grupo);
    } else if (abaAtual === 'rotas') {
      adicionarCampoTexto('ast-origem', 'SISTEMA DE ORIGEM (FIXO)', 'Sol', 'text', { readonly: true, disabled: true });
      const sistemasDestino = listarCatalogo('sistemas').filter(
        (s) => s.id !== 1 && s.nome !== 'Sistema Solar' && s.nome !== 'Sol'
      );
      adicionarCampoSelect(
        'ast-destino',
        'SISTEMA DE DESTINO',
        sistemasDestino.map((s) => ({ valor: String(s.id), rotulo: s.nome })),
        '2',
        'Nenhum sistema de destino cadastrado'
      );
      adicionarCampoTexto('ast-vel', 'VELOCIDADE SUPORTADA (FRAÇÃO DE C)', '0.996', 'number');
      adicionarCampoTexto('ast-pedagio', 'PEDÁGIO LÚMICO (US$)', '50000000000', 'number');
    }
    mostrarEtapa(secCadastro);
  }

  document.getElementById('tabs-astro').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-aba]');
    if (btn) {
      abaAtual = btn.dataset.aba;
      renderizarLista();
    }
  });

  document.getElementById('btn-novo-registro').addEventListener('click', abrirCadastro);
  document.getElementById('btn-astro-cancelar').addEventListener('click', renderizarLista);
  document.getElementById('btn-astro-voltar-edicao').addEventListener('click', () => mostrarEtapa(secCadastro));
  document.getElementById('btn-astro-ver-catalogo').addEventListener('click', renderizarLista);

  document.getElementById('form-astro-cadastro').addEventListener('submit', (e) => {
    e.preventDefault();
    if (abaAtual === 'planetas') {
      const erroSistema = document.getElementById('erro-ast-sistema');
      if (erroSistema) {
        erroSistema.textContent = '';
      }
      const sistemaId = Number(document.getElementById('ast-sistema').value);
      const sistema = listarCatalogo('sistemas').find((s) => s.id === sistemaId);
      if (!sistema) {
        if (erroSistema) {
          erroSistema.textContent = 'Selecione um sistema já cadastrado.';
        }
        return;
      }
      rascunho = {
        nome: document.getElementById('ast-nome').value,
        sistemaNome: sistema.nome,
        sistemaId: sistema.id,
        tipo: document.getElementById('ast-tipo').value,
        distanciaEstrelaUA: Number(document.getElementById('ast-ua').value),
        possuiPostoRecarga: document.getElementById('ast-posto').checked,
      };
    } else if (abaAtual === 'sistemas') {
      rascunho = {
        nome: document.getElementById('ast-nome').value,
        configuracao: document.getElementById('ast-config').value,
        distanciaSolAl: Number(document.getElementById('ast-dist').value),
        ra: Number(document.getElementById('ast-ra').value),
        dec: Number(document.getElementById('ast-dec').value),
      };
    } else if (abaAtual === 'propulsoes') {
      const velMin = Number(document.getElementById('ast-vel-min').value);
      const velMax = Number(document.getElementById('ast-vel-max').value);
      rascunho = {
        nome: document.getElementById('ast-nome').value,
        aceleracaoG: Number(document.getElementById('ast-acel').value),
        velocidadeMinC: Math.min(velMin, velMax),
        velocidadeMaxC: Math.max(velMin, velMax),
        velocidadeCruzeiroC: Number(((velMin + velMax) / 2).toFixed(3)),
        autonomiaAnosLuz: Number(document.getElementById('ast-auto').value),
        precoBaseReferencia: 100_000_000,
        custoAnoLuzReferencia: 1_500_000_000,
      };
    } else if (abaAtual === 'naves') {
      const propulsoes = listarCatalogo('propulsoes');
      const versoesSelecionadas = [];
      for (const prop of propulsoes) {
        const chk = document.getElementById(`ast-nav-prop-${prop.id}`);
        if (chk && chk.checked) {
          const minC = prop.velocidadeMinC ?? prop.velocidadeCruzeiroC;
          const maxC = prop.velocidadeMaxC ?? prop.velocidadeCruzeiroC;
          const rawVel = Number(document.getElementById(`ast-nav-vel-${prop.id}`).value);
          const velocidadeC = Math.min(maxC, Math.max(minC, rawVel));
          versoesSelecionadas.push({
            tipoPropulsaoId: prop.id,
            propulsaoNome: prop.nome,
            velocidadeC,
            autonomiaAl: prop.autonomiaAnosLuz,
          });
        }
      }
      if (versoesSelecionadas.length === 0) {
        const padrao = propulsoes[0];
        versoesSelecionadas.push({
          tipoPropulsaoId: padrao.id,
          propulsaoNome: padrao.nome,
          velocidadeC: padrao.velocidadeCruzeiroC,
          autonomiaAl: padrao.autonomiaAnosLuz,
        });
      }
      const assentosSelecionados = Number(document.getElementById('ast-assentos').value);
      const totalAssentos = CAPACIDADES_ASSENTOS_NAVE.includes(assentosSelecionados) ? assentosSelecionados : 32;
      rascunho = {
        identificacao: document.getElementById('ast-nome').value.trim(),
        totalAssentos,
        versoesPropulsao: versoesSelecionadas,
      };
    } else if (abaAtual === 'rotas') {
      const erroDestino = document.getElementById('erro-ast-destino');
      if (erroDestino) {
        erroDestino.textContent = '';
      }
      const destinoId = Number(document.getElementById('ast-destino').value);
      const sistemaDestino = listarCatalogo('sistemas').find(
        (s) => s.id === destinoId && s.id !== 1 && s.nome !== 'Sistema Solar' && s.nome !== 'Sol'
      );
      if (!sistemaDestino) {
        if (erroDestino) {
          erroDestino.textContent = 'Selecione um sistema de destino já cadastrado.';
        }
        return;
      }
      rascunho = {
        origemSistema: 'Sol',
        destinoSistemaId: sistemaDestino.id,
        destinoSistemaNome: sistemaDestino.nome,
        velocidadeC: Number(document.getElementById('ast-vel').value),
        pedagio: Number(document.getElementById('ast-pedagio').value),
        fatorDilatacao: 18,
        ativa: true,
      };
    }

    const revEl = document.getElementById('card-astro-revisao');
    limparElemento(revEl);
    revEl.appendChild(
      criarElemento('h2', {
        className: 'card__titulo',
        text: rascunho.nome || rascunho.identificacao || rascunho.destinoSistemaNome,
      })
    );
    revEl.appendChild(criarElemento('p', { className: 'texto-secundario', text: JSON.stringify(rascunho) }));
    mostrarEtapa(secRevisao);
  });

  document.getElementById('btn-astro-confirmar').addEventListener('click', () => {
    if (!rascunho) {
      return;
    }
    if (abaAtual === 'planetas') {
      salvarPlaneta(rascunho);
    } else if (abaAtual === 'sistemas') {
      salvarSistema(rascunho);
    } else if (abaAtual === 'propulsoes') {
      salvarPropulsao(rascunho);
    } else if (abaAtual === 'naves') {
      salvarNave(rascunho);
    } else if (abaAtual === 'rotas') {
      salvarRotaLumica(rascunho);
    }
    rascunho = null;
    mostrarEtapa(secConcluido);
  });

  secLista.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-acao]');
    if (!btn) {
      return;
    }
    const id = Number(btn.dataset.id);
    if (btn.dataset.acao === 'alternar-rota') {
      const estavaAtiva = btn.dataset.ativa === 'true';
      document.getElementById('modal-astro-titulo').textContent =
        estavaAtiva ? `Desativar Rota Lúmica · ${btn.dataset.nome}` : `Reativar Rota Lúmica · ${btn.dataset.nome}`;
      document.getElementById('modal-astro-texto').textContent =
        estavaAtiva
          ? 'RF-05: Ao desativar este canal, todas as viagens vinculadas a ele serão suspensas.'
          : 'Reativar este canal libera novamente o cenário Com Rota Lúmica para viagens vinculadas.';
      acaoModalPendente = () => alternarStatusRotaLumica(id);
      modal.classList.remove('oculto');
    } else if (btn.dataset.acao === 'excluir') {
      document.getElementById('modal-astro-titulo').textContent = 'Confirmar exclusão';
      document.getElementById('modal-astro-texto').textContent = `Remover "${btn.dataset.nome}" do catálogo?`;
      acaoModalPendente = () => excluirRegistroCartografico(abaAtual, id);
      modal.classList.remove('oculto');
    }
  });

  document.getElementById('btn-astro-modal-cancelar').addEventListener('click', () => {
    acaoModalPendente = null;
    modal.classList.add('oculto');
  });
  document.getElementById('btn-astro-modal-confirmar').addEventListener('click', () => {
    if (acaoModalPendente) {
      acaoModalPendente();
      acaoModalPendente = null;
      modal.classList.add('oculto');
      renderizarLista();
    }
  });

  renderizarLista();
}

document.addEventListener('DOMContentLoaded', inicializarCatalogoAstronomo);
