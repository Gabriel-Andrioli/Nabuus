import assert from 'node:assert/strict';
import test from 'node:test';
import { lerEstado } from '../js/services/api-client.js';
import { obterCenarioAtivoDaViagem } from '../js/services/passagens-service.js';
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
