import assert from 'node:assert/strict';
import test from 'node:test';
import { lerEstado } from '../js/services/api-client.js';
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
