import assert from 'node:assert/strict';
import test from 'node:test';
import { lerEstado } from '../js/services/api-client.js';
import { salvarNave } from '../js/services/cartografia-service.js';
import { calcularPrecoSugeridoViagem, publicarOuAtualizarViagem } from '../js/services/frota-viagens-service.js';
import {
  MULTIPLICADOR_PRECO_CLASSE,
  PERCENTUAL_PRECO_ALIMENTACAO,
  atualizarSelecaoAtual,
  calcularCustoAlimentacao,
  calcularPrecoPorClasse,
  calcularPrecoTotalComAlimentacao,
  confirmarPassagem,
  construirFileirasCabine,
  listarCodigosPoltronasCabine,
  obterCenarioAtivoDaViagem,
  obterMultiplicadorClasse,
  obterPercentualAlimentacao,
  validarPoltronaParaClasse,
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

test('deveOrdenarPorDataMaisProximaELocalidadeMaisProxima_quandoSolicitado', () => {
  const amostra = [
    { id: 1, distanciaAl: 40.54, dataPartidaIso: '2100-01-15', partidaTexto: '15 Jan 2100' },
    { id: 2, distanciaAl: 4.24, dataPartidaIso: '2101-10-12', partidaTexto: '12 Out 2101' },
    { id: 3, distanciaAl: 12.5, dataPartidaIso: '2101-06-09', partidaTexto: '09 Jun 2101' },
  ];

  const porDataComRef = ordenarViagens(amostra, 'data-mais-proxima', { dataReferencia: '10/06/2101' });
  assert.deepEqual(porDataComRef.map((v) => v.id), [3, 2, 1]);

  const porDataCronologica = ordenarViagens(amostra, 'data-mais-proxima');
  assert.deepEqual(porDataCronologica.map((v) => v.id), [1, 3, 2]);

  const porLocalidade = ordenarViagens(amostra, 'localidade-mais-proxima');
  assert.deepEqual(porLocalidade.map((v) => v.id), [2, 3, 1]);
});

test('deveGarantirMultiplasViagensPorSistemaEDistintasVelocidadesPorNave_quandoCarregarCatalogoCSV', () => {
  const estado = lerEstado();
  assert.equal(estado.sistemas.length, 36);
  assert.equal(estado.planetas.length, 50);
  assert.equal(estado.viagens.length, 196);

  for (const sistema of estado.sistemas) {
    const viagensDoSistema = estado.viagens.filter((v) => v.sistemaDestino === sistema.nome);
    assert.ok(viagensDoSistema.length >= 4, `Sistema ${sistema.nome} deve ter ao menos 4 viagens`);

    const datas = new Set(viagensDoSistema.map((v) => v.partidaTexto));
    const naves = new Set(viagensDoSistema.map((v) => v.onibusId));
    assert.ok(datas.size >= 4, `Sistema ${sistema.nome} deve ter datas de saída diferentes`);
    assert.ok(naves.size >= 4, `Sistema ${sistema.nome} deve usar naves diferentes`);
  }

  for (const planeta of estado.planetas.filter((p) => p.nome !== 'Terra')) {
    const viagensPlaneta = estado.viagens.filter((v) => v.destinoPlanetaId === planeta.id);
    assert.equal(viagensPlaneta.length, 4, `Planeta ${planeta.nome} deve ter 4 viagens`);
    assert.equal(new Set(viagensPlaneta.map((v) => v.partidaTexto)).size, 4);
    assert.equal(new Set(viagensPlaneta.map((v) => v.onibusId)).size, 4);
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

test('deveRestringirCapacidadeDaNavePara24Ou32Ou48EVincularAssentosDaViagemANave', () => {
  assert.equal(listarCodigosPoltronasCabine(24).length, 24);
  assert.equal(listarCodigosPoltronasCabine(32).length, 32);
  assert.equal(listarCodigosPoltronasCabine(48).length, 48);

  const fileiras32 = construirFileirasCabine(32);
  assert.equal(fileiras32.length, 8);
  assert.equal(fileiras32[0].classeNome, 'Luxo');
  assert.equal(fileiras32[2].classeNome, 'Primeira classe');
  assert.equal(fileiras32[7].classeNome, 'Executiva');

  const storageOriginal = globalThis.localStorage;
  const mapaMemoria = new Map();
  globalThis.localStorage = {
    getItem: (chave) => (mapaMemoria.has(chave) ? mapaMemoria.get(chave) : null),
    setItem: (chave, valor) => mapaMemoria.set(chave, String(valor)),
    removeItem: (chave) => mapaMemoria.delete(chave),
  };

  try {
    assert.throws(
      () => salvarNave({ identificacao: 'Teste 10', tipoPropulsaoId: 1, totalAssentos: 10 }),
      /24, 32 ou 48/
    );
    assert.throws(
      () => salvarNave({ identificacao: 'Teste 25', tipoPropulsaoId: 1, totalAssentos: 25 }),
      /24, 32 ou 48/
    );

    const naveCriada = salvarNave({
      identificacao: 'NABUUS Polaris',
      tipoPropulsaoId: 1,
      totalAssentos: 32,
    });
    assert.equal(naveCriada.totalAssentos, 32);

    // Fretista publica informando nave 2 (48 poltronas): qualquer override de totalAssentos e ignorado
    publicarOuAtualizarViagem({
      destinoNome: 'Proxima Centauri b',
      onibusId: 2,
      partidaTexto: '20/03/2105',
      totalAssentos: 10,
      precoFinal: 9_000_000_000,
    });

    const criada48 = lerEstado().viagens[lerEstado().viagens.length - 1];
    assert.equal(criada48.totalAssentos, 48);
    assert.equal(criada48.dataPartidaIso, '2105-03-20');
    assert.equal(criada48.partidaTexto, '20 Mar 2105');

    publicarOuAtualizarViagem({
      destinoNome: 'Proxima Centauri b',
      onibusId: 3,
      partidaTexto: '22/03/2105',
      precoFinal: 9_100_000_000,
    });
    const criada32 = lerEstado().viagens[lerEstado().viagens.length - 1];
    assert.equal(criada32.totalAssentos, 32);

    publicarOuAtualizarViagem({
      destinoNome: 'Proxima Centauri b',
      onibusId: 1,
      partidaTexto: '25/03/2105',
      precoFinal: 8_600_000_000,
    });
    const criada24 = lerEstado().viagens[lerEstado().viagens.length - 1];
    assert.equal(criada24.totalAssentos, 24);

    const codigosValidos = listarCodigosPoltronasCabine(48);
    assert.ok(criada48.assentosOcupados.every((c) => codigosValidos.includes(c)));
    assert.ok(criada48.assentosOcupados.length < codigosValidos.length);

    assert.deepEqual(validarPoltronaParaClasse('01A', 'Luxo', 24), {
      valida: true,
      classePoltrona: 'Luxo',
      classeEscolhida: 'Luxo',
    });
    assert.deepEqual(validarPoltronaParaClasse('01A', 'Executiva', 24), {
      valida: false,
      classePoltrona: 'Luxo',
      classeEscolhida: 'Executiva',
    });
    assert.deepEqual(validarPoltronaParaClasse('02C', 'Primeira classe', 24), {
      valida: true,
      classePoltrona: 'Primeira classe',
      classeEscolhida: 'Primeira classe',
    });
  } finally {
    if (storageOriginal === undefined) {
      delete globalThis.localStorage;
    } else {
      globalThis.localStorage = storageOriginal;
    }
  }
});

test('deveRecalcularPrecoSugeridoAoTrocarDestinoOuNave_quandoCalcularSugestao', () => {
  const prox = calcularPrecoSugeridoViagem({ destinoNome: 'Proxima Centauri b', onibusId: 1 });
  assert.equal(prox.paradas, 0);
  assert.equal(prox.precoSugerido, 8_600_000_000);

  const trappist = calcularPrecoSugeridoViagem({ destinoNome: 'TRAPPIST-1 e', onibusId: 1 });
  assert.equal(trappist.paradas, 2);
  assert.equal(trappist.precoSugerido, 81_300_000_000);
  assert.notEqual(trappist.precoSugerido, prox.precoSugerido);

  const marte = calcularPrecoSugeridoViagem({ destinoNome: 'Marte', onibusId: 1 });
  assert.equal(marte.paradas, 0);
  assert.ok(marte.distanciaAl < 0.001);
  assert.ok(marte.precoSugerido < prox.precoSugerido);
});
