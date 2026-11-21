import assert from 'node:assert/strict';
import test from 'node:test';
import { lerEstado } from '../js/services/api-client.js';
import {
  MULTIPLICADOR_PRECO_CLASSE,
  PERCENTUAL_PRECO_ALIMENTACAO,
  atualizarSelecaoAtual,
  calcularCustoAlimentacao,
  calcularPrecoPorClasse,
  calcularPrecoTotalComAlimentacao,
  confirmarPassagem,
  construirFileirasCabine,
  obterCenarioAtivoDaViagem,
  obterMultiplicadorClasse,
  obterPercentualAlimentacao,
} from '../js/services/passagens-service.js';
import { filtrarViagens, ordenarViagens } from '../js/utils/filtros-viagem.js';

test('deveFiltrarViagensPorDestinoEPropulsao_quandoCriteriosInformados', () => {
  // Arrange
  const viagens = lerEstado().viagens;
  // Act
  const filtradas = filtrarViagens(viagens, {
    destino: 'Proxima',
    propulsoes: ['Antimatéria'],
  });
  // Assert
  assert.equal(filtradas.length, 1);
  assert.equal(filtradas[0].destinoNome, 'Proxima Centauri b');
});

test('deveIgnorarViagensSuspensas_quandoListarResultados', () => {
  const viagens = lerEstado().viagens;
  viagens[0].status = 'SUSPENSA';
  const filtradas = filtrarViagens(viagens, {});
  assert.equal(filtradas.some((v) => v.id === 1), false);
});

test('deveOrdenarPorMenorCustoEMenorDivida_quandoSolicitado', () => {
  const viagens = lerEstado().viagens;
  const porCusto = ordenarViagens(viagens, 'menor-custo');
  assert.ok(porCusto[0].semLumica.precoFinal <= porCusto[1].semLumica.precoFinal);

  const porDivida = ordenarViagens(viagens, 'menor-divida');
  assert.ok(porDivida[0].semLumica.dividaTemporalAnos <= porDivida[1].semLumica.dividaTemporalAnos);
});

test('deveGarantirMultiplasViagensPorSistemaEDistintasVelocidadesPorNave_quandoCarregarCatalogoCSV', () => {
  const estado = lerEstado();
  assert.equal(estado.sistemas.length, 36);
  assert.equal(estado.planetas.length, 50);

  for (const sistema of estado.sistemas) {
    const viagensDoSistema = estado.viagens.filter((v) => v.sistemaDestino === sistema.nome);
    assert.ok(viagensDoSistema.length >= 2, `Sistema ${sistema.nome} deve ter ao menos 2 viagens`);

    const datas = new Set(viagensDoSistema.map((v) => v.partidaTexto));
    const naves = new Set(viagensDoSistema.map((v) => v.onibusId));
    assert.ok(datas.size >= 2, `Sistema ${sistema.nome} deve ter datas de saída diferentes`);
    assert.ok(naves.size >= 2, `Sistema ${sistema.nome} deve usar naves diferentes`);
  }

  const navesAntimateria = estado.onibusFrota.filter((n) => n.propulsaoNome === 'Antimatéria');
  const velocidadesAntimateria = new Set(navesAntimateria.map((n) => n.velocidadeC));
  assert.equal(velocidadesAntimateria.size, navesAntimateria.length);
  assert.ok(estado.onibusFrota[0].versoesPropulsao.length > 1);
  for (const prop of estado.propulsoes) {
    assert.ok(prop.velocidadeMinC < prop.velocidadeMaxC);
    assert.ok(prop.velocidadeMaxC <= 0.30);
  }
});

test('deveDescontar90PorCentoDoTempoABordo_quandoSelecionarClasseLuxoECompararPropulsoes', () => {
  const estado = lerEstado();
  const viagem = estado.viagens.find((v) => v.destinoNome === 'Proxima Centauri b');

  const executiva = obterCenarioAtivoDaViagem(viagem, { propulsaoNome: 'Antimatéria', classe: 'Executiva', usaRotaLumica: false });
  const luxo = obterCenarioAtivoDaViagem(viagem, { propulsaoNome: 'Antimatéria', classe: 'Luxo', usaRotaLumica: false });
  const fusao = obterCenarioAtivoDaViagem(viagem, { propulsaoNome: 'Fusão nuclear', classe: 'Executiva', usaRotaLumica: false });
  const lumica = obterCenarioAtivoDaViagem(viagem, { propulsaoNome: 'Antimatéria', classe: 'Executiva', usaRotaLumica: true });

  assert.equal(executiva.emCriogenia, false);
  assert.equal(luxo.emCriogenia, true);
  assert.ok(Math.abs(luxo.duracaoBordoAnos - Number((executiva.duracaoBordoAnos * 0.1).toFixed(4))) < 1e-6);
  assert.notEqual(fusao.precoFinal, executiva.precoFinal);
  assert.notEqual(fusao.duracaoBordoAnos, executiva.duracaoBordoAnos);
  assert.notEqual(fusao.dividaTemporalAnos, executiva.dividaTemporalAnos);
  assert.ok(lumica.precoFinal >= executiva.precoFinal * 5);
  assert.ok(lumica.dividaTemporalAnos >= executiva.dividaTemporalAnos * 10);
  assert.ok(lumica.duracaoBordoAnos < executiva.duracaoBordoAnos);
});

test('deveGerarMapaDinamicoEConfirmarPassagemSemBloquearAssentoGlobal', () => {
  assert.equal(construirFileirasCabine(24).length, 6);
  assert.equal(construirFileirasCabine(32).length, 8);
  assert.equal(construirFileirasCabine(48).length, 12);

  const storageOriginal = globalThis.localStorage;
  const mapaMemoria = new Map();
  globalThis.localStorage = {
    getItem: (chave) => (mapaMemoria.has(chave) ? mapaMemoria.get(chave) : null),
    setItem: (chave, valor) => mapaMemoria.set(chave, String(valor)),
    removeItem: (chave) => mapaMemoria.delete(chave),
  };

  try {
    const ocupadosAntes = [...lerEstado().viagens.find((v) => v.id === 1).assentosOcupados];
    atualizarSelecaoAtual({
      viagemId: 1,
      poltrona: '05A',
      usaRotaLumica: false,
      classe: 'Executiva',
      propulsaoNome: 'Antimatéria',
    });

    const passagem = confirmarPassagem();
    const viagemAtualizada = lerEstado().viagens.find((v) => v.id === 1);

    assert.equal(passagem.assento, '05A');
    assert.equal(viagemAtualizada.assentosOcupados.includes('05A'), false);
    assert.deepEqual(viagemAtualizada.assentosOcupados, ocupadosAntes);
  } finally {
    if (storageOriginal === undefined) {
      delete globalThis.localStorage;
    } else {
      globalThis.localStorage = storageOriginal;
    }
  }
});

test('deveAplicarMultiplicadoresDeClasseEPreservarRotaLumica_quandoCalcularValorDaViagem', () => {
  assert.equal(MULTIPLICADOR_PRECO_CLASSE.Executiva, 1.0);
  assert.equal(MULTIPLICADOR_PRECO_CLASSE['Primeira classe'], 1.5);
  assert.equal(MULTIPLICADOR_PRECO_CLASSE.Luxo, 2.0);
  assert.equal(PERCENTUAL_PRECO_ALIMENTACAO.Padrão, 0.02);
  assert.equal(PERCENTUAL_PRECO_ALIMENTACAO.Vegetariana, 0.03);
  assert.equal(PERCENTUAL_PRECO_ALIMENTACAO.Gourmet, 0.05);

  assert.equal(obterMultiplicadorClasse('Executiva'), 1.0);
  assert.equal(obterMultiplicadorClasse('Primeira classe'), 1.5);
  assert.equal(obterMultiplicadorClasse('Luxo'), 2.0);
  assert.equal(obterPercentualAlimentacao('Padrão'), 0.02);
  assert.equal(obterPercentualAlimentacao('Vegetariana'), 0.03);
  assert.equal(obterPercentualAlimentacao('Gourmet'), 0.05);

  assert.equal(calcularPrecoPorClasse(1000, 'Primeira classe'), 1500);
  assert.equal(calcularPrecoPorClasse(1000, 'Luxo'), 2000);
  assert.equal(calcularCustoAlimentacao(1000, 'Padrão'), 20);
  assert.equal(calcularCustoAlimentacao(1000, 'Vegetariana'), 30);
  assert.equal(calcularCustoAlimentacao(1000, 'Gourmet'), 50);
  assert.equal(calcularPrecoTotalComAlimentacao(1000, 'Padrão'), 1020);
  assert.equal(calcularPrecoTotalComAlimentacao(1000, 'Vegetariana'), 1030);
  assert.equal(calcularPrecoTotalComAlimentacao(1000, 'Gourmet'), 1050);

  const estado = lerEstado();
  const viagem = estado.viagens.find((v) => v.destinoNome === 'Proxima Centauri b');

  for (const usaRotaLumica of [false, true]) {
    const exec = obterCenarioAtivoDaViagem(viagem, { propulsaoNome: 'Antimatéria', classe: 'Executiva', usaRotaLumica, alimentacao: 'Padrão' });
    const prim = obterCenarioAtivoDaViagem(viagem, { propulsaoNome: 'Antimatéria', classe: 'Primeira classe', usaRotaLumica, alimentacao: 'Padrão' });
    const luxo = obterCenarioAtivoDaViagem(viagem, { propulsaoNome: 'Antimatéria', classe: 'Luxo', usaRotaLumica, alimentacao: 'Padrão' });

    assert.equal(exec.precoComClasse, exec.cenarioBase.precoFinal);
    assert.equal(prim.precoComClasse, Math.round(exec.precoComClasse * 1.5));
    assert.equal(luxo.precoComClasse, exec.precoComClasse * 2);

    const execVeg = obterCenarioAtivoDaViagem(viagem, { propulsaoNome: 'Antimatéria', classe: 'Executiva', usaRotaLumica, alimentacao: 'Vegetariana' });
    const execGour = obterCenarioAtivoDaViagem(viagem, { propulsaoNome: 'Antimatéria', classe: 'Executiva', usaRotaLumica, alimentacao: 'Gourmet' });

    assert.equal(exec.custoAlimentacao, Math.round(exec.precoComClasse * 0.02));
    assert.equal(exec.precoFinal, exec.precoComClasse + exec.custoAlimentacao);
    assert.equal(execVeg.custoAlimentacao, Math.round(exec.precoComClasse * 0.03));
    assert.equal(execVeg.precoFinal, exec.precoComClasse + execVeg.custoAlimentacao);
    assert.equal(execGour.custoAlimentacao, Math.round(exec.precoComClasse * 0.05));
    assert.equal(execGour.precoFinal, exec.precoComClasse + execGour.custoAlimentacao);
  }

  const storageOriginal = globalThis.localStorage;
  const mapaMemoria = new Map();
  globalThis.localStorage = {
    getItem: (chave) => (mapaMemoria.has(chave) ? mapaMemoria.get(chave) : null),
    setItem: (chave, valor) => mapaMemoria.set(chave, String(valor)),
    removeItem: (chave) => mapaMemoria.delete(chave),
  };

  try {
    atualizarSelecaoAtual({
      viagemId: viagem.id,
      propulsaoNome: 'Antimatéria',
      usaRotaLumica: false,
      poltrona: '05A',
      classe: 'Executiva',
      alimentacao: 'Padrão',
    });
    const passExec = confirmarPassagem();

    atualizarSelecaoAtual({
      viagemId: viagem.id,
      propulsaoNome: 'Antimatéria',
      usaRotaLumica: false,
      poltrona: '02C',
      classe: 'Primeira classe',
      alimentacao: 'Vegetariana',
    });
    const passPrimVeg = confirmarPassagem();

    atualizarSelecaoAtual({
      viagemId: viagem.id,
      propulsaoNome: 'Antimatéria',
      usaRotaLumica: false,
      poltrona: '01A',
      classe: 'Luxo',
      alimentacao: 'Gourmet',
    });
    const passLuxoGour = confirmarPassagem();

    const baseExec = viagem.semLumica.precoFinal;
    assert.equal(passExec.classe, 'Executiva');
    assert.equal(passExec.alimentacao, 'Padrão');
    assert.equal(passExec.valorPago, calcularPrecoTotalComAlimentacao(baseExec, 'Padrão'));

    assert.equal(passPrimVeg.classe, 'Primeira classe');
    assert.equal(passPrimVeg.alimentacao, 'Vegetariana');
    assert.equal(passPrimVeg.valorPago, calcularPrecoTotalComAlimentacao(Math.round(baseExec * 1.5), 'Vegetariana'));

    assert.equal(passLuxoGour.classe, 'Luxo');
    assert.equal(passLuxoGour.alimentacao, 'Gourmet');
    assert.equal(passLuxoGour.valorPago, calcularPrecoTotalComAlimentacao(baseExec * 2, 'Gourmet'));
  } finally {
    if (storageOriginal === undefined) {
      delete globalThis.localStorage;
    } else {
      globalThis.localStorage = storageOriginal;
    }
  }
});
