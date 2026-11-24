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
  assert.equal(formatarCreditos(8_772_000_000), 'US$ 8,77 bi');
  assert.equal(formatarCreditos(10_200_000_000_000), 'US$ 10,2 tri');
  assert.equal(formatarCreditos(10_000_000_000_000), 'US$ 10 tri');
  assert.equal(formatarCreditos(1_500_000_000_000_000), 'US$ 1,5 qua');
  assert.equal(formatarCreditos(102_000_000_010_000_000_000), 'US$ 102 qui');
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
  assert.equal(formatarVelocidadeC(0.012), '0,012 c');
  assert.equal(formatarVelocidadeC(0.005), '0,005 c');
  assert.equal(formatarVelocidadeC(0.996), '0,996 c');
  assert.equal(formatarDistanciaAnosLuz(4.24), '4,24 anos-luz');
  assert.equal(formatarDataCurta('2100-01-15'), 'Jan 2100');
});
