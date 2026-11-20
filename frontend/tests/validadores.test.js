import assert from 'node:assert/strict';
import test from 'node:test';
import {
  validarEmail,
  validarFormularioLogin,
  validarNumeroPositivo,
  validarVelocidadeNave,
} from '../js/utils/validadores.js';

test('deveValidarEmailESenha_quandoCredenciaisForemValidas', () => {
  // Arrange
  const payload = { email: 'piloto@nabuus.space', senha: 'segredo123' };
  // Act
  const res = validarFormularioLogin(payload);
  // Assert
  assert.equal(res.valido, true);
  assert.deepEqual(res.erros, {});
});

test('deveRetornarErros_quandoCredenciaisForemInvalidas', () => {
  const res = validarFormularioLogin({ email: 'invalido', senha: '123' });
  assert.equal(res.valido, false);
  assert.ok(res.erros.email);
  assert.ok(res.erros.senha);
});

test('deveRespeitarLimitesFisicos_quandoValidarVelocidadeENumeros', () => {
  assert.equal(validarEmail('astro@ufjf.br'), true);
  assert.equal(validarNumeroPositivo(4.5), true);
  assert.equal(validarNumeroPositivo(-1), false);
  assert.equal(validarVelocidadeNave(0.8), true);
  assert.equal(validarVelocidadeNave(1.2), false);
});
