import assert from 'node:assert/strict';
import test from 'node:test';
import {
  validarCnpjFretista,
  validarCredencialAstronomo,
  validarEmail,
  validarFormularioLogin,
  validarFormularioRegistro,
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

test('deveAceitarApenasCredenciaisECnpjsHomologados_quandoValidarRegistro', () => {
  assert.equal(validarCredencialAstronomo('IAU-2100-001'), true);
  assert.equal(validarCredencialAstronomo('iau-2100-br'), true);
  assert.equal(validarCredencialAstronomo('IAU-9999-999'), false);

  assert.equal(validarCnpjFretista('10.100.001/0001-01'), true);
  assert.equal(validarCnpjFretista('99.999.999/0001-99'), false);

  const astroValido = validarFormularioRegistro({
    nome: 'Vera Rubin',
    email: 'vera@nabuus.space',
    senha: 'segredo123',
    perfil: 'ASTRONOMO',
    doc1: 'IAU-2100-001',
    doc2: '',
  });
  assert.equal(astroValido.valido, true);

  const astroInvalido = validarFormularioRegistro({
    nome: 'Vera Rubin',
    email: 'vera@nabuus.space',
    senha: 'segredo123',
    perfil: 'ASTRONOMO',
    doc1: 'IAU-9999-999',
    doc2: '',
  });
  assert.equal(astroInvalido.valido, false);
  assert.ok(astroInvalido.erros.doc1);

  const fretistaValido = validarFormularioRegistro({
    nome: 'Frota Alpha',
    email: 'frota@nabuus.space',
    senha: 'segredo123',
    perfil: 'FRETISTA',
    doc1: '10.100.001/0001-01',
    doc2: 'Alpha Estelar Ltda',
  });
  assert.equal(fretistaValido.valido, true);

  const fretistaInvalido = validarFormularioRegistro({
    nome: 'Frota Alpha',
    email: 'frota@nabuus.space',
    senha: 'segredo123',
    perfil: 'FRETISTA',
    doc1: '99.999.999/0001-99',
    doc2: 'Alpha Estelar Ltda',
  });
  assert.equal(fretistaInvalido.valido, false);
  assert.ok(fretistaInvalido.erros.doc1);

  const viajanteValido = validarFormularioRegistro({
    nome: 'Aurora',
    email: 'aurora2@nabuus.space',
    senha: 'segredo123',
    perfil: 'VIAJANTE',
    doc1: '123.456.789-00',
    doc2: '1998-04-12',
  });
  assert.equal(viajanteValido.valido, true);
});
