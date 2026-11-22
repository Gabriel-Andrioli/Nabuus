import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CAPACIDADES_ASSENTOS_NAVE,
  converterPartidaTextoParaIso,
  formatarDataNascimentoDigitada,
  formatarIsoParaDataBr,
  formatarIsoParaPartidaTexto,
  normalizarDataNascimentoParaIso,
  validarAssentosOfertadosViagem,
  validarCnpjFretista,
  validarCoordenadasAstronomicas,
  validarCpf,
  validarCredencialAstronomo,
  validarDataNascimento,
  validarDataPartida,
  validarEmail,
  validarFormularioLogin,
  validarFormularioRegistro,
  validarFormularioViagemFretista,
  validarNumeroPositivo,
  validarSenha,
  validarTotalAssentos,
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
  assert.equal(validarVelocidadeNave(0.4), true);
  assert.equal(validarVelocidadeNave(0.8), false);
  assert.equal(validarVelocidadeNave(1.2), false);

  assert.equal(validarCoordenadasAstronomicas(217.43, -62.68), true);
  assert.equal(validarCoordenadasAstronomicas(361, 0), false);
  assert.equal(validarCoordenadasAstronomicas(100, -95), false);

  assert.equal(validarTotalAssentos(24), true);
  assert.equal(validarTotalAssentos(32), true);
  assert.equal(validarTotalAssentos(48), true);
  assert.equal(validarTotalAssentos(0), false);
  assert.equal(validarTotalAssentos(201), false);
  assert.equal(validarTotalAssentos(24.5), false);
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

test('deveValidarCpfDataNascimentoESenha_noCadastroDeViajante', () => {
  assert.equal(validarCpf('123.456.789-00'), true);
  assert.equal(validarCpf('12345678900'), true);
  assert.equal(validarCpf('1234567890'), false);
  assert.equal(validarCpf('abc.def.ghi-jk'), false);

  const hojeFixo = new Date(2026, 10, 21);
  assert.equal(formatarDataNascimentoDigitada('20032002'), '20/03/2002');
  assert.equal(formatarDataNascimentoDigitada('2003123456789'), '20/03/1234');
  assert.equal(formatarDataNascimentoDigitada('20'), '20');
  assert.equal(formatarDataNascimentoDigitada('200'), '20/0');
  assert.equal(normalizarDataNascimentoParaIso('20/03/2002'), '2002-03-20');
  assert.equal(normalizarDataNascimentoParaIso('20/03/20021'), null);
  assert.equal(normalizarDataNascimentoParaIso('20/03/20'), null);
  assert.equal(formatarIsoParaDataBr('2002-03-20'), '20/03/2002');

  assert.equal(validarDataNascimento('1998-04-12', hojeFixo), true);
  assert.equal(validarDataNascimento('12/04/1998', hojeFixo), true);
  assert.equal(validarDataNascimento('21/11/1906', hojeFixo), true);
  assert.equal(validarDataNascimento('20/11/1906', hojeFixo), false);
  assert.equal(validarDataNascimento('18/03/1000', hojeFixo), false);
  assert.equal(validarDataNascimento('2026-11-21', hojeFixo), false);
  assert.equal(validarDataNascimento('21/11/2026', hojeFixo), false);
  assert.equal(validarDataNascimento('2075-04-12', hojeFixo), false);
  assert.equal(validarDataNascimento('12/04/2075', hojeFixo), false);
  assert.equal(validarDataNascimento('2026-02-30', hojeFixo), false);
  assert.equal(validarDataNascimento('30/02/2026', hojeFixo), false);

  const viajanteBrValido = validarFormularioRegistro({
    nome: 'Aurora',
    email: 'aurora4@nabuus.space',
    senha: 'segredo123',
    perfil: 'VIAJANTE',
    doc1: '123.456.789-00',
    doc2: '20/03/2002',
  });
  assert.equal(viajanteBrValido.valido, true);

  const viajanteDataIncompleta = validarFormularioRegistro({
    nome: 'Aurora',
    email: 'aurora5@nabuus.space',
    senha: 'segredo123',
    perfil: 'VIAJANTE',
    doc1: '123.456.789-00',
    doc2: '20/03/20',
  });
  assert.equal(viajanteDataIncompleta.valido, false);
  assert.equal(viajanteDataIncompleta.erros.doc2, 'Informe uma data de nascimento válida.');

  const viajanteAnoImpossivel = validarFormularioRegistro({
    nome: 'Aurora',
    email: 'aurora6@nabuus.space',
    senha: 'segredo123',
    perfil: 'VIAJANTE',
    doc1: '123.456.789-00',
    doc2: '18/03/1000',
  });
  assert.equal(viajanteAnoImpossivel.valido, false);
  assert.equal(viajanteAnoImpossivel.erros.doc2, 'Informe uma data de nascimento válida.');

  assert.equal(validarSenha('123456'), true);
  assert.equal(validarSenha('a'.repeat(20)), true);
  assert.equal(validarSenha('a'.repeat(21)), false);

  const loginSenhaLonga = validarFormularioLogin({
    email: 'piloto@nabuus.space',
    senha: 'a'.repeat(21),
  });
  assert.equal(loginSenhaLonga.valido, false);
  assert.ok(loginSenhaLonga.erros.senha);

  const viajanteInvalido = validarFormularioRegistro({
    nome: 'Aurora',
    email: 'aurora3@nabuus.space',
    senha: 'a'.repeat(21),
    perfil: 'VIAJANTE',
    doc1: '12345',
    doc2: '2099-01-01',
  });
  assert.equal(viajanteInvalido.valido, false);
  assert.ok(viajanteInvalido.erros.senha);
  assert.ok(viajanteInvalido.erros.doc1);
  assert.ok(viajanteInvalido.erros.doc2);
});

test('deveValidarDataPartidaECapacidadesPermitidasDeNave_quandoValidarCadastro', () => {
  const hojeFixo = new Date(2026, 10, 21);

  assert.deepEqual(CAPACIDADES_ASSENTOS_NAVE, [24, 32, 48]);
  assert.equal(validarTotalAssentos(24), true);
  assert.equal(validarTotalAssentos(32), true);
  assert.equal(validarTotalAssentos(48), true);
  assert.equal(validarAssentosOfertadosViagem(24), true);
  assert.equal(validarAssentosOfertadosViagem(32), true);
  assert.equal(validarAssentosOfertadosViagem(48), true);
  assert.equal(validarAssentosOfertadosViagem(1), false);
  assert.equal(validarAssentosOfertadosViagem(10), false);
  assert.equal(validarAssentosOfertadosViagem(25), false);
  assert.equal(validarAssentosOfertadosViagem(0), false);
  assert.equal(validarAssentosOfertadosViagem(-1), false);
  assert.equal(validarAssentosOfertadosViagem(24.5), false);
  assert.equal(validarAssentosOfertadosViagem('abc'), false);
  assert.equal(validarAssentosOfertadosViagem(''), false);
  assert.equal(validarAssentosOfertadosViagem(null), false);

  assert.equal(validarDataPartida('15/01/2100', hojeFixo), true);
  assert.equal(validarDataPartida('2100-01-15', hojeFixo), true);
  assert.equal(validarDataPartida('22/11/2026', hojeFixo), true);
  assert.equal(validarDataPartida('21/11/2026', hojeFixo), false);
  assert.equal(validarDataPartida('20/11/2026', hojeFixo), false);
  assert.equal(validarDataPartida('Jan 2100', hojeFixo), false);
  assert.equal(validarDataPartida('abc', hojeFixo), false);
  assert.equal(validarDataPartida('15/01/21', hojeFixo), false);
  assert.equal(validarDataPartida('30/02/2100', hojeFixo), false);

  assert.equal(converterPartidaTextoParaIso('15 Jan 2100'), '2100-01-15');
  assert.equal(converterPartidaTextoParaIso('Jan 2100'), '2100-01-01');
  assert.equal(converterPartidaTextoParaIso('15/01/2100'), '2100-01-15');
  assert.equal(converterPartidaTextoParaIso('texto qualquer'), null);
  assert.equal(formatarIsoParaPartidaTexto('2100-01-15'), '15 Jan 2100');

  const formValido = validarFormularioViagemFretista(
    { partida: '15/01/2100', precoFinal: 0 },
    hojeFixo
  );
  assert.equal(formValido.valido, true);
  assert.deepEqual(formValido.erros, {});

  const formInvalido = validarFormularioViagemFretista(
    { partida: 'qualquer texto', precoFinal: -10 },
    hojeFixo
  );
  assert.equal(formInvalido.valido, false);
  assert.ok(formInvalido.erros.partida);
  assert.ok(formInvalido.erros.precoFinal);
});
