import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calcularFatorLorentz,
  formatarAnos,
  formatarCreditos,
  formatarDataCurta,
  formatarDistanciaAnosLuz,
  formatarVelocidadeC,
} from '../js/utils/formatadores.js';

test('deveFormatarValorMonetarioEmBilhoes_quandoValorForPositivo', () => {
  // Arrange
  const valor = 8_600_000_000;
  // Act
  const resultado = formatarCreditos(valor);
  // Assert
  assert.equal(resultado, 'US$ 8,6 bi');
});

test('deveFormatarAnosEMeses_quandoDuracaoVariarDeFracaoABilhoes', () => {
  assert.equal(formatarAnos(3.2), '3,20 anos');
  assert.equal(formatarAnos(0.25), '3 meses');
  assert.equal(formatarAnos(2_500_000), '2,5 mi de anos');
});

test('deveCalcularFatorLorentzCorretamente_quandoVelocidadeFor080c', () => {
  const gama = calcularFatorLorentz(0.8);
  assert.ok(Math.abs(gama - 5 / 3) < 1e-6);
  assert.equal(formatarVelocidadeC(0.8), '0,80 c');
  assert.equal(formatarDistanciaAnosLuz(4.24), '4,24 anos-luz');
  assert.equal(formatarDataCurta('2100-01-15'), 'Jan 2100');
});
