/**
 * Cliente HTTP centralizado (Fetch API + JWT + RFC 9457 ProblemDetail)
 * e catálogo inicial alinhado ao CSV real (data/nabuus_planetas.csv).
 */

const ehProxyFrontend = typeof globalThis !== 'undefined'
  && globalThis.location
  && String(globalThis.location.port) === '3000';

export const API_JAVA_BASE_URL = ehProxyFrontend ? '/api' : 'http://localhost:8080/api';
export const API_MOTOR_BASE_URL = 'http://localhost:8001/v1';

const CHAVE_STORAGE = 'nabuus_estado_v3';
const CHAVE_SESSAO = 'nabuus_sessao_v1';

const C_MPS = 299_792_458;
const ANO_SEG = 365.25 * 86_400;
const AL_METROS = 9.4607e15;
const UA_METROS = 1.496e11;
const G_MPS2 = 9.80665;
const FATOR_DILATACAO_LUMICA = 18;

export const SISTEMAS_CSV = [
  { id: 1, nome: 'Sistema Solar', estrelaPrincipal: 'Sol', configuracao: 'Estrela G2V', ra: 0.0, dec: 0.0, distanciaSolAl: 0.0, descricao: 'Via Láctea · Sistema de origem' },
  { id: 2, nome: 'TRAPPIST-1', estrelaPrincipal: 'TRAPPIST-1', configuracao: 'Estrela M8V', ra: 346.62, dec: -5.04, distanciaSolAl: 40.54, descricao: '40.54 anos-luz · TRAPPIST-1' },
  { id: 3, nome: 'Proxima Centauri', estrelaPrincipal: 'Proxima Centauri', configuracao: 'Estrela M5.5V', ra: 217.43, dec: -62.68, distanciaSolAl: 4.24, descricao: '4.24 anos-luz · Proxima Centauri' },
  { id: 4, nome: 'Kepler-186', estrelaPrincipal: 'Kepler-186', configuracao: 'Estrela M1V', ra: 298.87, dec: 43.95, distanciaSolAl: 558.0, descricao: '558.00 anos-luz · Kepler-186' },
  { id: 5, nome: 'Kepler-442', estrelaPrincipal: 'Kepler-442', configuracao: 'Estrela K5V', ra: 290.42, dec: 39.26, distanciaSolAl: 1193.0, descricao: '1193.00 anos-luz · Kepler-442' },
  { id: 6, nome: 'LHS 1140', estrelaPrincipal: 'LHS 1140', configuracao: 'Estrela M4.5V', ra: 11.25, dec: -15.27, distanciaSolAl: 48.0, descricao: '48.00 anos-luz · LHS 1140' },
  { id: 7, nome: 'K2-18', estrelaPrincipal: 'K2-18', configuracao: 'Estrela M2.5V', ra: 172.56, dec: 7.59, distanciaSolAl: 124.0, descricao: '124.00 anos-luz · K2-18' },
  { id: 8, nome: 'TOI-700', estrelaPrincipal: 'TOI-700', configuracao: 'Estrela M2V', ra: 93.88, dec: -65.58, distanciaSolAl: 101.0, descricao: '101.00 anos-luz · TOI-700' },
  { id: 9, nome: 'Teegarden\'s Star', estrelaPrincipal: 'Teegarden\'s Star', configuracao: 'Estrela M7V', ra: 36.44, dec: 10.88, distanciaSolAl: 12.5, descricao: '12.50 anos-luz · Teegarden\'s Star' },
  { id: 10, nome: 'Kepler-1649', estrelaPrincipal: 'Kepler-1649', configuracao: 'Estrela M5V', ra: 295.86, dec: 41.08, distanciaSolAl: 301.0, descricao: '301.00 anos-luz · Kepler-1649' },
  { id: 11, nome: 'TOI-1452', estrelaPrincipal: 'TOI-1452', configuracao: 'Estrela M4V', ra: 253.4, dec: 69.7, distanciaSolAl: 100.0, descricao: '100.00 anos-luz · TOI-1452' },
  { id: 12, nome: 'KELT-9', estrelaPrincipal: 'KELT-9', configuracao: 'Estrela A0V', ra: 290.66, dec: 39.86, distanciaSolAl: 670.0, descricao: '670.00 anos-luz · KELT-9' },
  { id: 13, nome: 'WASP-17', estrelaPrincipal: 'WASP-17', configuracao: 'Estrela F6V', ra: 232.03, dec: -28.07, distanciaSolAl: 1300.0, descricao: '1300.00 anos-luz · WASP-17' },
  { id: 14, nome: 'HD 189733', estrelaPrincipal: 'HD 189733 A', configuracao: 'Estrela K1V', ra: 300.18, dec: 22.71, distanciaSolAl: 64.5, descricao: '64.50 anos-luz · HD 189733 A' },
  { id: 15, nome: '55 Cancri', estrelaPrincipal: '55 Cancri A', configuracao: 'Estrela G8V', ra: 133.14, dec: 28.33, distanciaSolAl: 41.0, descricao: '41.00 anos-luz · 55 Cancri A' },
  { id: 16, nome: 'TrES-2', estrelaPrincipal: 'GSC 03549-02811', configuracao: 'Estrela G0V', ra: 286.84, dec: 49.32, distanciaSolAl: 750.0, descricao: '750.00 anos-luz · GSC 03549-02811' },
  { id: 17, nome: 'HAT-P-67', estrelaPrincipal: 'HAT-P-67', configuracao: 'Estrela F', ra: 60.63, dec: 29.88, distanciaSolAl: 1200.0, descricao: '1200.00 anos-luz · HAT-P-67' },
  { id: 18, nome: '51 Pegasi', estrelaPrincipal: '51 Pegasi', configuracao: 'Estrela G2IV', ra: 344.37, dec: 20.77, distanciaSolAl: 50.9, descricao: '50.90 anos-luz · 51 Pegasi' },
  { id: 19, nome: 'Kepler-37', estrelaPrincipal: 'Kepler-37', configuracao: 'Estrela G8V', ra: 285.86, dec: 44.52, distanciaSolAl: 215.0, descricao: '215.00 anos-luz · Kepler-37' },
  { id: 20, nome: 'Gliese 436', estrelaPrincipal: 'Gliese 436', configuracao: 'Estrela M2.5V', ra: 175.55, dec: 26.71, distanciaSolAl: 33.0, descricao: '33.00 anos-luz · Gliese 436' },
  { id: 21, nome: 'WASP-76', estrelaPrincipal: 'WASP-76', configuracao: 'Estrela F7V', ra: 25.08, dec: 2.33, distanciaSolAl: 640.0, descricao: '640.00 anos-luz · WASP-76' },
  { id: 22, nome: 'PSR 1257+12', estrelaPrincipal: 'PSR B1257+12 (pulsar)', configuracao: 'Estrela Pulsar de milisegundo', ra: 193.72, dec: 12.68, distanciaSolAl: 2300.0, descricao: '2300.00 anos-luz · PSR B1257+12 (pulsar)' },
  { id: 23, nome: 'Kepler-452', estrelaPrincipal: 'Kepler-452', configuracao: 'Estrela G2V', ra: 294.74, dec: 44.16, distanciaSolAl: 1402.0, descricao: '1402.00 anos-luz · Kepler-452' },
  { id: 24, nome: 'Tau Ceti', estrelaPrincipal: 'Tau Ceti', configuracao: 'Estrela G8.5V', ra: 25.1, dec: -15.94, distanciaSolAl: 11.9, descricao: '11.90 anos-luz · Tau Ceti' },
  { id: 25, nome: 'Wolf 1061', estrelaPrincipal: 'Wolf 1061', configuracao: 'Estrela M3V', ra: 252.11, dec: -12.49, distanciaSolAl: 13.8, descricao: '13.80 anos-luz · Wolf 1061' },
  { id: 26, nome: 'GJ 667', estrelaPrincipal: 'GJ 667C', configuracao: 'Estrela M1.5V', ra: 259.74, dec: -34.0, distanciaSolAl: 23.6, descricao: '23.60 anos-luz · GJ 667C' },
  { id: 27, nome: 'TOI-715', estrelaPrincipal: 'TOI-715', configuracao: 'Estrela M4V', ra: 44.21, dec: -4.51, distanciaSolAl: 137.0, descricao: '137.00 anos-luz · TOI-715' },
  { id: 28, nome: 'HR 8799', estrelaPrincipal: 'HR 8799', configuracao: 'Estrela F0V', ra: 346.87, dec: 21.13, distanciaSolAl: 130.0, descricao: '130.00 anos-luz · HR 8799' },
  { id: 29, nome: 'Beta Pictoris', estrelaPrincipal: 'Beta Pictoris', configuracao: 'Estrela A6V', ra: 86.82, dec: -51.07, distanciaSolAl: 63.4, descricao: '63.40 anos-luz · Beta Pictoris' },
  { id: 30, nome: 'Kepler-62', estrelaPrincipal: 'Kepler-62', configuracao: 'Estrela K2V', ra: 285.63, dec: 45.35, distanciaSolAl: 1200.0, descricao: '1200.00 anos-luz · Kepler-62' },
  { id: 31, nome: 'HD 40307', estrelaPrincipal: 'HD 40307', configuracao: 'Estrela K2.5V', ra: 90.0, dec: -60.0, distanciaSolAl: 42.0, descricao: '42.00 anos-luz · HD 40307' },
  { id: 32, nome: 'TOI-1846', estrelaPrincipal: 'TOI-1846', configuracao: 'Estrela M3V', ra: 283.0, dec: 36.0, distanciaSolAl: 154.0, descricao: '154.00 anos-luz · TOI-1846' },
  { id: 33, nome: 'Luyten\'s Star', estrelaPrincipal: 'Luyten\'s Star (GJ 273)', configuracao: 'Estrela M3.5V', ra: 112.03, dec: 5.23, distanciaSolAl: 12.3, descricao: '12.30 anos-luz · Luyten\'s Star (GJ 273)' },
  { id: 34, nome: 'HD 209458', estrelaPrincipal: 'HD 209458', configuracao: 'Estrela G0V', ra: 330.21, dec: 18.89, distanciaSolAl: 159.0, descricao: '159.00 anos-luz · HD 209458' },
  { id: 35, nome: 'PDS 70', estrelaPrincipal: 'PDS 70', configuracao: 'Estrela K7Ve', ra: 235.46, dec: -41.39, distanciaSolAl: 370.0, descricao: '370.00 anos-luz · PDS 70' },
  { id: 36, nome: 'Kepler-16', estrelaPrincipal: 'Kepler-16 A+B (binária)', configuracao: 'Sistema binário', ra: 290.07, dec: 51.76, distanciaSolAl: 245.0, descricao: '245.00 anos-luz · Kepler-16 A+B (binária)' },
];

export const PLANETAS_CSV = [
  { id: 1, nome: 'Mercúrio', sistemaId: 1, sistemaNome: 'Sistema Solar', tipo: 'Rochoso', distanciaEstrelaUA: 0.387, possuiPostoRecarga: false, zonaHabitavel: false, resumo: 'O menor planeta do Sistema Solar. Sem atmosfera, enfrenta 430°C no dia e -180°C à noite. Para os mais aventureiros — ou masoquistas.' },
  { id: 2, nome: 'Vênus', sistemaId: 1, sistemaNome: 'Sistema Solar', tipo: 'Rochoso', distanciaEstrelaUA: 0.723, possuiPostoRecarga: false, zonaHabitavel: false, resumo: 'A estrela da manhã escondia um inferno: 465°C constantes e pressão atmosférica 90x a terrestre. Belíssima à distância, letal de perto.' },
  { id: 3, nome: 'Terra', sistemaId: 1, sistemaNome: 'Sistema Solar', tipo: 'Rochoso', distanciaEstrelaUA: 1.0, possuiPostoRecarga: true, zonaHabitavel: true, resumo: 'O lar. Único planeta com vida confirmada no universo conhecido. 70% de sua superfície coberta por oceanos — berço de toda a civilização humana.' },
  { id: 4, nome: 'Marte', sistemaId: 1, sistemaNome: 'Sistema Solar', tipo: 'Rochoso', distanciaEstrelaUA: 1.524, possuiPostoRecarga: true, zonaHabitavel: false, resumo: 'O planeta vermelho foi o primeiro passo da humanidade além da Terra. Abriga o maior vulcão conhecido do Sistema Solar e rastros de oceanos ancestrais.' },
  { id: 5, nome: 'Júpiter', sistemaId: 1, sistemaNome: 'Sistema Solar', tipo: 'Gasoso', distanciaEstrelaUA: 5.203, possuiPostoRecarga: false, zonaHabitavel: false, resumo: 'Rei dos planetas. Uma tempestade do tamanho de três Terras rage há séculos. Seus 79 satélites incluem mundos com oceanos subterrâneos.' },
  { id: 6, nome: 'Saturno', sistemaId: 1, sistemaNome: 'Sistema Solar', tipo: 'Gasoso', distanciaEstrelaUA: 9.537, possuiPostoRecarga: false, zonaHabitavel: false, resumo: 'O planeta dos anéis. Tão leve que flutuaria num oceano. Sua lua Encélado jorra gêiseres de água no espaço, e Titã possui lagos de metano líquido.' },
  { id: 7, nome: 'Urano', sistemaId: 1, sistemaNome: 'Sistema Solar', tipo: 'Gigante de gelo', distanciaEstrelaUA: 19.191, possuiPostoRecarga: false, zonaHabitavel: false, resumo: 'O planeta deitado. Sua inclinação axial de 98° faz com que role em torno do Sol como uma bola. As estações duram 21 anos terrestres.' },
  { id: 8, nome: 'Netuno', sistemaId: 1, sistemaNome: 'Sistema Solar', tipo: 'Gigante de gelo', distanciaEstrelaUA: 30.07, possuiPostoRecarga: false, zonaHabitavel: false, resumo: 'Descoberto pelos cálculos matemáticos antes mesmo de ser avistado. Seus ventos atingem 2100 km/h — os mais rápidos do Sistema Solar.' },
  { id: 9, nome: 'TRAPPIST-1 b', sistemaId: 2, sistemaNome: 'TRAPPIST-1', tipo: 'Rochoso', distanciaEstrelaUA: 0.012, possuiPostoRecarga: false, zonaHabitavel: false, resumo: 'Mais próximo da estrela anã TRAPPIST-1, orbita em apenas 1,5 dia terrestre. Provavelmente com uma face sempre voltada para a estrela — eterno dia de um lado, noite eterna do outro.' },
  { id: 10, nome: 'TRAPPIST-1 c', sistemaId: 2, sistemaNome: 'TRAPPIST-1', tipo: 'Rochoso', distanciaEstrelaUA: 0.016, possuiPostoRecarga: false, zonaHabitavel: false, resumo: 'Similar à Terra em tamanho e densidade, mas quente demais. Integra a dança orbital perfeitamente ressonante e harmoniosa do sistema TRAPPIST-1.' },
  { id: 11, nome: 'TRAPPIST-1 d', sistemaId: 2, sistemaNome: 'TRAPPIST-1', tipo: 'Rochoso', distanciaEstrelaUA: 0.022, possuiPostoRecarga: false, zonaHabitavel: false, resumo: 'Na borda interna da zona habitável. Recebe irradiação similar à Terra e poderia abrigar água líquida com a atmosfera certa. Um dos mais estudados do sistema.' },
  { id: 12, nome: 'TRAPPIST-1 e', sistemaId: 2, sistemaNome: 'TRAPPIST-1', tipo: 'Rochoso', distanciaEstrelaUA: 0.029, possuiPostoRecarga: false, zonaHabitavel: true, resumo: 'A joia do sistema TRAPPIST-1. Na zona habitável ideal, com tamanho similar à Terra e atmosfera confirmada pelo JWST em 2026. O exoplaneta habitável mais promissor já conhecido.' },
  { id: 13, nome: 'TRAPPIST-1 f', sistemaId: 2, sistemaNome: 'TRAPPIST-1', tipo: 'Rochoso', distanciaEstrelaUA: 0.038, possuiPostoRecarga: false, zonaHabitavel: true, resumo: 'Um gêmeo da Terra em tamanho e massa, dançando na zona habitável. Da sua superfície, seria possível ver os planetas vizinhos a olho nu no céu noturno.' },
  { id: 14, nome: 'TRAPPIST-1 g', sistemaId: 2, sistemaNome: 'TRAPPIST-1', tipo: 'Rochoso', distanciaEstrelaUA: 0.047, possuiPostoRecarga: false, zonaHabitavel: true, resumo: 'O maior planeta do sistema TRAPPIST-1. Na borda externa da zona habitável, pode ser um mundo gelado com oceanos escondidos sob a superfície.' },
  { id: 15, nome: 'TRAPPIST-1 h', sistemaId: 2, sistemaNome: 'TRAPPIST-1', tipo: 'Rochoso', distanciaEstrelaUA: 0.062, possuiPostoRecarga: false, zonaHabitavel: false, resumo: 'O solitário das bordas do sistema TRAPPIST-1. Pequeno e gelado, orbita a 169 K — bem abaixo do congelamento da água. Um mundo de gelo eterno e silêncio.' },
  { id: 16, nome: 'Proxima Centauri b', sistemaId: 3, sistemaNome: 'Proxima Centauri', tipo: 'Rochoso', distanciaEstrelaUA: 0.048, possuiPostoRecarga: false, zonaHabitavel: true, resumo: 'O exoplaneta mais próximo da Terra. Orbita Proxima Centauri na zona habitável em apenas 11 dias. Sofre tempestades de radiação intensas de sua estrela-mãe anã vermelha.' },
  { id: 17, nome: 'Proxima Centauri d', sistemaId: 3, sistemaNome: 'Proxima Centauri', tipo: 'Rochoso', distanciaEstrelaUA: 0.029, possuiPostoRecarga: true, zonaHabitavel: false, resumo: 'Um mundo menor que a Terra, confirmado em 2025. Sua pequenez e proximidade com a estrela o tornam hostil, mas sua descoberta revelou um sistema mais complexo no vizinho mais próximo.' },
  { id: 18, nome: 'Kepler-186 f', sistemaId: 4, sistemaNome: 'Kepler-186', tipo: 'Rochoso', distanciaEstrelaUA: 0.432, possuiPostoRecarga: true, zonaHabitavel: true, resumo: 'Marco histórico: o primeiro planeta de tamanho terrestre encontrado em zona habitável de outra estrela. A 558 anos-luz, representa um espelho possível da Terra primordial.' },
  { id: 19, nome: 'Kepler-442 b', sistemaId: 5, sistemaNome: 'Kepler-442', tipo: 'Rochoso', distanciaEstrelaUA: 0.409, possuiPostoRecarga: false, zonaHabitavel: true, resumo: 'Considerado um dos planetas mais similares à Terra conhecidos. Orbita uma estrela mais fria e estável que o Sol, com potencial de habitabilidade por bilhões de anos.' },
  { id: 20, nome: 'LHS 1140 b', sistemaId: 6, sistemaNome: 'LHS 1140', tipo: 'Rochoso', distanciaEstrelaUA: 0.0946, possuiPostoRecarga: true, zonaHabitavel: true, resumo: 'Uma super-Terra densa e rochosa a apenas 48 anos-luz. Orbita uma anã vermelha relativamente calma, o que aumenta suas chances de reter atmosfera e água líquida.' },
  { id: 21, nome: 'K2-18 b', sistemaId: 7, sistemaNome: 'K2-18', tipo: 'Hycean', distanciaEstrelaUA: 0.1429, possuiPostoRecarga: false, zonaHabitavel: true, resumo: 'Um mundo Hycean — oceano global sob uma densa atmosfera de hidrogênio. O JWST detectou metano, CO2 e possivelmente dimetil sulfeto, um potencial sinal de vida.' },
  { id: 22, nome: 'TOI-700 d', sistemaId: 8, sistemaNome: 'TOI-700', tipo: 'Rochoso', distanciaEstrelaUA: 0.163, possuiPostoRecarga: false, zonaHabitavel: true, resumo: 'Descoberto pelo satélite TESS, este mundo tamanho-Terra orbita na zona habitável de uma anã vermelha calma. Dois planetas habitáveis no mesmo sistema — uma raridade cósmica.' },
  { id: 23, nome: 'Teegarden b', sistemaId: 9, sistemaNome: 'Teegarden\'s Star', tipo: 'Rochoso', distanciaEstrelaUA: 0.0325, possuiPostoRecarga: true, zonaHabitavel: true, resumo: 'A apenas 12,5 anos-luz, Teegarden b é um dos exoplanetas habitáveis mais próximos. Recebe irradiação semelhante à Terra e pode ter temperatura amena — um destino promissor.' },
  { id: 24, nome: 'Kepler-1649 c', sistemaId: 10, sistemaNome: 'Kepler-1649', tipo: 'Rochoso', distanciaEstrelaUA: 0.0855, possuiPostoRecarga: false, zonaHabitavel: true, resumo: 'Redescoberto em dados arquivados do Kepler, este mundo tamanho-Terra é um dos análogos terrestres mais fiéis. Temperatura e tamanho notavelmente similares à Terra.' },
  { id: 25, nome: 'TOI-1452 b', sistemaId: 11, sistemaNome: 'TOI-1452', tipo: 'Rochoso', distanciaEstrelaUA: 0.062, possuiPostoRecarga: false, zonaHabitavel: false, resumo: 'Pode ser um planeta inteiramente coberto por oceano — sem continentes, sem praias. Sua massa e raio sugerem que água pode representar até 30% de sua composição total.' },
  { id: 26, nome: 'KELT-9 b', sistemaId: 12, sistemaNome: 'KELT-9', tipo: 'Gasoso', distanciaEstrelaUA: 0.035, possuiPostoRecarga: false, zonaHabitavel: false, resumo: 'O planeta mais quente já descoberto. Sua atmosfera de 4643 K é mais quente que muitas estrelas. Metais evaporam e escapam para o espaço. Um inferno sem paralelo conhecido.' },
  { id: 27, nome: 'WASP-17 b', sistemaId: 13, sistemaNome: 'WASP-17', tipo: 'Gasoso', distanciaEstrelaUA: 0.052, possuiPostoRecarga: false, zonaHabitavel: false, resumo: 'Um gigante inflado como bolha de sabão, menos denso que a cortiça. Orbita sua estrela no sentido inverso, sugerindo uma colisão gravitacional catastrófica em seu passado.' },
  { id: 28, nome: 'HD 189733 b', sistemaId: 14, sistemaNome: 'HD 189733', tipo: 'Gasoso', distanciaEstrelaUA: 0.031, possuiPostoRecarga: false, zonaHabitavel: false, resumo: 'Parece azul como a Terra, mas é um inferno: partículas de sílica fundem e viajam a 8700 km/h como granizo de vidro. Um dos exoplanetas mais estudados e mais letais.' },
  { id: 29, nome: '55 Cancri e', sistemaId: 15, sistemaNome: '55 Cancri', tipo: 'Rochoso', distanciaEstrelaUA: 0.016, possuiPostoRecarga: true, zonaHabitavel: false, resumo: 'Um ano dura 17,5 horas neste mundo infernal. A superfície pode ser um oceano de lava, e o interior possivelmente rico em carbono — talvez um diamante planetário colossal.' },
  { id: 30, nome: 'TrES-2 b', sistemaId: 16, sistemaNome: 'TrES-2', tipo: 'Gasoso', distanciaEstrelaUA: 0.036, possuiPostoRecarga: false, zonaHabitavel: false, resumo: 'O planeta mais negro já encontrado: reflete menos de 1% da luz que recebe — mais escuro que carvão. Visto do espaço, seria quase invisível contra o vazio.' },
  { id: 31, nome: 'HAT-P-67 b', sistemaId: 17, sistemaNome: 'HAT-P-67', tipo: 'Gasoso', distanciaEstrelaUA: 0.064, possuiPostoRecarga: false, zonaHabitavel: false, resumo: 'O maior planeta transitante conhecido. Com 2,14 vezes o raio de Júpiter, está tão inflado que sua atmosfera evapora continuamente em direção à estrela. Um gigante condenado.' },
  { id: 32, nome: '51 Pegasi b', sistemaId: 18, sistemaNome: '51 Pegasi', tipo: 'Gasoso', distanciaEstrelaUA: 0.052, possuiPostoRecarga: true, zonaHabitavel: false, resumo: 'O planeta que mudou tudo. Descoberto em 1995, foi o primeiro exoplaneta confirmado ao redor de uma estrela como o Sol. Sua existência surpreendeu toda a comunidade astronômica.' },
  { id: 33, nome: 'Kepler-37 b', sistemaId: 19, sistemaNome: 'Kepler-37', tipo: 'Rochoso', distanciaEstrelaUA: 0.1, possuiPostoRecarga: false, zonaHabitavel: false, resumo: 'O menor exoplaneta confirmado — apenas ligeiramente maior que a Lua terrestre. Um mundinho rochoso e tórrido que redefine o quão pequeno um planeta pode ser.' },
  { id: 34, nome: 'GJ 436 b', sistemaId: 20, sistemaNome: 'Gliese 436', tipo: 'Gigante de gelo', distanciaEstrelaUA: 0.028, possuiPostoRecarga: true, zonaHabitavel: false, resumo: 'O paradoxo do gelo ardente: temperaturas de 712 K mantêm a água em estado sólido por pressão extrema. Este \'Netuno quente\' evaporando possui cauda de hidrogênio como um cometa.' },
  { id: 35, nome: 'WASP-76 b', sistemaId: 21, sistemaNome: 'WASP-76', tipo: 'Gasoso', distanciaEstrelaUA: 0.033, possuiPostoRecarga: false, zonaHabitavel: false, resumo: 'No lado voltado para a estrela, ferro evapora a 2400°C. No lado noturno, chove ferro líquido. Um dos fenômenos mais alienígenas já observados em um exoplaneta.' },
  { id: 36, nome: 'PSR 1257+12 b', sistemaId: 22, sistemaNome: 'PSR 1257+12', tipo: 'Rochoso', distanciaEstrelaUA: 0.19, possuiPostoRecarga: false, zonaHabitavel: false, resumo: 'O primeiro exoplaneta confirmado da história (1992). Orbita um pulsar — o cadáver radioativo de uma estrela morta. Banhado por radiação fatal, pioneiro de uma nova era astronômica.' },
  { id: 37, nome: 'Kepler-452 b', sistemaId: 23, sistemaNome: 'Kepler-452', tipo: 'Rochoso', distanciaEstrelaUA: 1.046, possuiPostoRecarga: false, zonaHabitavel: true, resumo: 'Chamado de \'primo da Terra\' pela NASA. Orbita uma estrela quase idêntica ao Sol, com um ano de 385 dias. Seu sistema é 1,5 bilhão de anos mais velho que o nosso.' },
  { id: 38, nome: 'Tau Ceti e', sistemaId: 24, sistemaNome: 'Tau Ceti', tipo: 'Rochoso', distanciaEstrelaUA: 0.538, possuiPostoRecarga: true, zonaHabitavel: true, resumo: 'A apenas 11,9 anos-luz, Tau Ceti e é uma das super-Terras habitáveis mais próximas. Orbita uma estrela parecida com o Sol, mas o sistema possui disco de detritos que causa impactos frequentes.' },
  { id: 39, nome: 'Wolf 1061 c', sistemaId: 25, sistemaNome: 'Wolf 1061', tipo: 'Rochoso', distanciaEstrelaUA: 0.089, possuiPostoRecarga: true, zonaHabitavel: true, resumo: 'Uma super-Terra a apenas 13,8 anos-luz, na zona habitável de sua anã vermelha. Sistema de três planetas em que Wolf 1061 c é o único potencialmente habitável.' },
  { id: 40, nome: 'GJ 667C c', sistemaId: 26, sistemaNome: 'GJ 667', tipo: 'Rochoso', distanciaEstrelaUA: 0.125, possuiPostoRecarga: true, zonaHabitavel: true, resumo: 'Orbita uma anã vermelha dentro de um sistema de três estrelas. Do solo de GJ 667C c, dois sóis adicionais seriam visíveis no céu — um espetáculo astronômico sem igual.' },
  { id: 41, nome: 'TOI-715 b', sistemaId: 27, sistemaNome: 'TOI-715', tipo: 'Rochoso', distanciaEstrelaUA: 0.0842, possuiPostoRecarga: false, zonaHabitavel: true, resumo: 'Descoberto pelo TESS em 2024, orbita firmemente dentro da zona habitável \'conservadora\' de sua estrela. Um dos candidatos mais recentes e promissores à habitabilidade.' },
  { id: 42, nome: 'HR 8799 b', sistemaId: 28, sistemaNome: 'HR 8799', tipo: 'Gasoso', distanciaEstrelaUA: 68.0, possuiPostoRecarga: false, zonaHabitavel: false, resumo: 'Um dos primeiros exoplanetas fotografados diretamente. Faz parte de um sistema de quatro gigantes gasosos visíveis em imagem — uma raridade que abriu a era da imagiologia direta.' },
  { id: 43, nome: 'Beta Pictoris b', sistemaId: 29, sistemaNome: 'Beta Pictoris', tipo: 'Gasoso', distanciaEstrelaUA: 9.0, possuiPostoRecarga: false, zonaHabitavel: false, resumo: 'Um jovem gigante gasoso em formação, fotografado diretamente. Possui a rotação mais rápida já medida em exoplaneta. O sistema ainda está se moldando ao redor da estrela.' },
  { id: 44, nome: 'Kepler-62 f', sistemaId: 30, sistemaNome: 'Kepler-62', tipo: 'Rochoso', distanciaEstrelaUA: 0.718, possuiPostoRecarga: false, zonaHabitavel: true, resumo: 'Simulações climáticas sugerem que pode ser um mundo coberto de oceanos com densa atmosfera de CO2, mantendo temperaturas acima do congelamento. Um possível paraíso aquático.' },
  { id: 45, nome: 'HD 40307 g', sistemaId: 31, sistemaNome: 'HD 40307', tipo: 'Rochoso', distanciaEstrelaUA: 0.6, possuiPostoRecarga: true, zonaHabitavel: true, resumo: 'Uma super-Terra massiva orbitando a 42 anos-luz. Provavelmente não está travada mareal, o que poderia permitir ciclo dia-noite — condição favorável à vida.' },
  { id: 46, nome: 'TOI-1846 b', sistemaId: 32, sistemaNome: 'TOI-1846', tipo: 'Rochoso', distanciaEstrelaUA: 0.11, possuiPostoRecarga: false, zonaHabitavel: true, resumo: 'Descoberto em 2025, pode ter um oceano raso sobre uma camada espessa de gelo subsuperficial. Um candidato intrigante em que a água existiria em duas formas distintas simultaneamente.' },
  { id: 47, nome: 'Luyten b', sistemaId: 33, sistemaNome: 'Luyten\'s Star', tipo: 'Rochoso', distanciaEstrelaUA: 0.091, possuiPostoRecarga: true, zonaHabitavel: true, resumo: 'A apenas 12,3 anos-luz, a humanidade já lhe enviou uma mensagem em 2017 (projeto METI). Uma das super-Terras habitáveis mais próximas — e talvez alguém aguarde a resposta.' },
  { id: 48, nome: 'HD 209458 b', sistemaId: 34, sistemaNome: 'HD 209458', tipo: 'Gasoso', distanciaEstrelaUA: 0.047, possuiPostoRecarga: true, zonaHabitavel: false, resumo: 'Osiris, o evaporante. Primeiro exoplaneta visto transitando sua estrela. Sua atmosfera evapora tão rapidamente que forma uma cauda cometária — está literalmente se dissolvendo no espaço.' },
  { id: 49, nome: 'PDS 70 b', sistemaId: 35, sistemaNome: 'PDS 70', tipo: 'Gasoso', distanciaEstrelaUA: 22.0, possuiPostoRecarga: false, zonaHabitavel: false, resumo: 'Um planeta nascendo em tempo real. PDS 70 b é o único exoplaneta confirmado ainda em processo ativo de formação — alimentando-se do disco de gás e poeira ao seu redor.' },
  { id: 50, nome: 'Kepler-16 b', sistemaId: 36, sistemaNome: 'Kepler-16', tipo: 'Gasoso', distanciaEstrelaUA: 0.705, possuiPostoRecarga: false, zonaHabitavel: false, resumo: 'A Tatooine real. Orbita dois sóis, gerando pores do sol duplos exatamente como no universo de Star Wars. Primeiro planeta circumbinário confirmado — a ficção científica tornando-se realidade.' },
];

export const PROPULSOES_INICIAIS = [
  { id: 1, codigo: 'ANTIMATERIA', nome: 'Antimatéria', aceleracaoG: 0.60, velocidadeMinC: 0.120, velocidadeMaxC: 0.300, velocidadeCruzeiroC: 0.200, autonomiaAnosLuz: 15.0, precoBaseReferencia: 120_000_000, custoAnoLuzReferencia: 2_000_000_000 },
  { id: 2, codigo: 'FUSAO', nome: 'Fusão nuclear', aceleracaoG: 0.20, velocidadeMinC: 0.030, velocidadeMaxC: 0.100, velocidadeCruzeiroC: 0.065, autonomiaAnosLuz: 8.0, precoBaseReferencia: 80_000_000, custoAnoLuzReferencia: 1_200_000_000 },
  { id: 3, codigo: 'VELA_SOLAR', nome: 'Vela solar', aceleracaoG: 0.01, velocidadeMinC: 0.005, velocidadeMaxC: 0.020, velocidadeCruzeiroC: 0.012, autonomiaAnosLuz: 3.0, precoBaseReferencia: 30_000_000, custoAnoLuzReferencia: 600_000_000 },
];

function criarRotaLumicaSeed(id, destinoSistemaId, destinoSistemaNome, distanciaSolAl, velocidadeC) {
  const custoTradicionalRef = 120_000_000 + 2_000_000_000 * distanciaSolAl;
  return {
    id,
    origemSistema: 'Sol',
    destinoSistemaId,
    destinoSistemaNome,
    velocidadeC,
    pedagio: Math.round(custoTradicionalRef * 6),
    fatorDilatacao: FATOR_DILATACAO_LUMICA,
    ativa: true,
  };
}

export const ROTAS_LUMICAS_SEED = [
  criarRotaLumicaSeed(1, 2, 'TRAPPIST-1', 40.54, 0.996),
  criarRotaLumicaSeed(2, 3, 'Proxima Centauri', 4.24, 0.997),
  criarRotaLumicaSeed(3, 4, 'Kepler-186', 558.0, 0.996),
  criarRotaLumicaSeed(4, 5, 'Kepler-442', 1193.0, 0.998),
  criarRotaLumicaSeed(5, 6, 'LHS 1140', 48.0, 0.996),
  criarRotaLumicaSeed(6, 7, 'K2-18', 124.0, 0.997),
  criarRotaLumicaSeed(7, 8, 'TOI-700', 101.0, 0.996),
  criarRotaLumicaSeed(8, 9, 'Teegarden\'s Star', 12.5, 0.997),
  criarRotaLumicaSeed(9, 15, '55 Cancri', 41.0, 0.996),
  criarRotaLumicaSeed(10, 18, '51 Pegasi', 50.9, 0.997),
  criarRotaLumicaSeed(11, 20, 'Gliese 436', 33.0, 0.996),
  criarRotaLumicaSeed(12, 23, 'Kepler-452', 1402.0, 0.998),
  criarRotaLumicaSeed(13, 24, 'Tau Ceti', 11.9, 0.996),
  criarRotaLumicaSeed(14, 25, 'Wolf 1061', 13.8, 0.997),
  criarRotaLumicaSeed(15, 26, 'GJ 667', 23.6, 0.996),
  criarRotaLumicaSeed(16, 31, 'HD 40307', 42.0, 0.997),
  criarRotaLumicaSeed(17, 33, 'Luyten\'s Star', 12.3, 0.996),
];

export const NAVES_SEED = [
  {
    id: 1, identificacao: 'NABUUS Odyssey', tipoPropulsaoId: 1, propulsaoNome: 'Antimatéria',
    velocidadeC: 0.290, autonomiaAl: 15.0, aceleracaoG: 0.60, totalAssentos: 24, ativo: true,
    versoesPropulsao: [
      { tipoPropulsaoId: 1, propulsaoNome: 'Antimatéria', velocidadeC: 0.290, autonomiaAl: 15.0 },
      { tipoPropulsaoId: 2, propulsaoNome: 'Fusão nuclear', velocidadeC: 0.095, autonomiaAl: 8.0 },
      { tipoPropulsaoId: 3, propulsaoNome: 'Vela solar', velocidadeC: 0.019, autonomiaAl: 3.0 },
    ],
  },
  {
    id: 2, identificacao: 'NABUUS Aurora', tipoPropulsaoId: 1, propulsaoNome: 'Antimatéria',
    velocidadeC: 0.250, autonomiaAl: 14.0, aceleracaoG: 0.60, totalAssentos: 48, ativo: true,
    versoesPropulsao: [
      { tipoPropulsaoId: 1, propulsaoNome: 'Antimatéria', velocidadeC: 0.250, autonomiaAl: 14.0 },
      { tipoPropulsaoId: 2, propulsaoNome: 'Fusão nuclear', velocidadeC: 0.085, autonomiaAl: 7.5 },
      { tipoPropulsaoId: 3, propulsaoNome: 'Vela solar', velocidadeC: 0.017, autonomiaAl: 3.0 },
    ],
  },
  {
    id: 3, identificacao: 'NABUUS Valkyrie', tipoPropulsaoId: 1, propulsaoNome: 'Antimatéria',
    velocidadeC: 0.210, autonomiaAl: 12.0, aceleracaoG: 0.60, totalAssentos: 32, ativo: true,
    versoesPropulsao: [
      { tipoPropulsaoId: 1, propulsaoNome: 'Antimatéria', velocidadeC: 0.210, autonomiaAl: 12.0 },
      { tipoPropulsaoId: 2, propulsaoNome: 'Fusão nuclear', velocidadeC: 0.075, autonomiaAl: 7.0 },
    ],
  },
  {
    id: 4, identificacao: 'NABUUS Hyperion', tipoPropulsaoId: 1, propulsaoNome: 'Antimatéria',
    velocidadeC: 0.160, autonomiaAl: 10.0, aceleracaoG: 0.60, totalAssentos: 24, ativo: true,
    versoesPropulsao: [
      { tipoPropulsaoId: 1, propulsaoNome: 'Antimatéria', velocidadeC: 0.160, autonomiaAl: 10.0 },
      { tipoPropulsaoId: 3, propulsaoNome: 'Vela solar', velocidadeC: 0.015, autonomiaAl: 3.0 },
    ],
  },
  {
    id: 5, identificacao: 'NABUUS Horizon', tipoPropulsaoId: 2, propulsaoNome: 'Fusão nuclear',
    velocidadeC: 0.090, autonomiaAl: 8.0, aceleracaoG: 0.20, totalAssentos: 32, ativo: true,
    versoesPropulsao: [
      { tipoPropulsaoId: 2, propulsaoNome: 'Fusão nuclear', velocidadeC: 0.090, autonomiaAl: 8.0 },
      { tipoPropulsaoId: 1, propulsaoNome: 'Antimatéria', velocidadeC: 0.240, autonomiaAl: 13.0 },
      { tipoPropulsaoId: 3, propulsaoNome: 'Vela solar', velocidadeC: 0.016, autonomiaAl: 3.0 },
    ],
  },
  {
    id: 6, identificacao: 'NABUUS Solaris', tipoPropulsaoId: 2, propulsaoNome: 'Fusão nuclear',
    velocidadeC: 0.072, autonomiaAl: 7.5, aceleracaoG: 0.20, totalAssentos: 24, ativo: true,
    versoesPropulsao: [
      { tipoPropulsaoId: 2, propulsaoNome: 'Fusão nuclear', velocidadeC: 0.072, autonomiaAl: 7.5 },
      { tipoPropulsaoId: 3, propulsaoNome: 'Vela solar', velocidadeC: 0.014, autonomiaAl: 3.0 },
    ],
  },
  {
    id: 7, identificacao: 'NABUUS Chronos', tipoPropulsaoId: 2, propulsaoNome: 'Fusão nuclear',
    velocidadeC: 0.054, autonomiaAl: 7.0, aceleracaoG: 0.20, totalAssentos: 48, ativo: true,
    versoesPropulsao: [
      { tipoPropulsaoId: 2, propulsaoNome: 'Fusão nuclear', velocidadeC: 0.054, autonomiaAl: 7.0 },
      { tipoPropulsaoId: 1, propulsaoNome: 'Antimatéria', velocidadeC: 0.180, autonomiaAl: 11.0 },
      { tipoPropulsaoId: 3, propulsaoNome: 'Vela solar', velocidadeC: 0.013, autonomiaAl: 3.0 },
    ],
  },
  {
    id: 8, identificacao: 'NABUUS Titan', tipoPropulsaoId: 2, propulsaoNome: 'Fusão nuclear',
    velocidadeC: 0.036, autonomiaAl: 6.0, aceleracaoG: 0.20, totalAssentos: 32, ativo: true,
    versoesPropulsao: [
      { tipoPropulsaoId: 2, propulsaoNome: 'Fusão nuclear', velocidadeC: 0.036, autonomiaAl: 6.0 },
      { tipoPropulsaoId: 3, propulsaoNome: 'Vela solar', velocidadeC: 0.011, autonomiaAl: 2.5 },
    ],
  },
  {
    id: 9, identificacao: 'NABUUS Photon', tipoPropulsaoId: 3, propulsaoNome: 'Vela solar',
    velocidadeC: 0.020, autonomiaAl: 3.5, aceleracaoG: 0.01, totalAssentos: 24, ativo: true,
    versoesPropulsao: [
      { tipoPropulsaoId: 3, propulsaoNome: 'Vela solar', velocidadeC: 0.020, autonomiaAl: 3.5 },
      { tipoPropulsaoId: 2, propulsaoNome: 'Fusão nuclear', velocidadeC: 0.048, autonomiaAl: 6.5 },
    ],
  },
  {
    id: 10, identificacao: 'NABUUS Helios', tipoPropulsaoId: 3, propulsaoNome: 'Vela solar',
    velocidadeC: 0.015, autonomiaAl: 3.0, aceleracaoG: 0.01, totalAssentos: 32, ativo: true,
    versoesPropulsao: [
      { tipoPropulsaoId: 3, propulsaoNome: 'Vela solar', velocidadeC: 0.015, autonomiaAl: 3.0 },
      { tipoPropulsaoId: 2, propulsaoNome: 'Fusão nuclear', velocidadeC: 0.040, autonomiaAl: 6.0 },
    ],
  },
  {
    id: 11, identificacao: 'NABUUS Pioneer', tipoPropulsaoId: 3, propulsaoNome: 'Vela solar',
    velocidadeC: 0.010, autonomiaAl: 2.8, aceleracaoG: 0.01, totalAssentos: 24, ativo: true,
    versoesPropulsao: [
      { tipoPropulsaoId: 3, propulsaoNome: 'Vela solar', velocidadeC: 0.010, autonomiaAl: 2.8 },
    ],
  },
  {
    id: 12, identificacao: 'NABUUS Vento Estelar', tipoPropulsaoId: 3, propulsaoNome: 'Vela solar',
    velocidadeC: 0.006, autonomiaAl: 2.5, aceleracaoG: 0.01, totalAssentos: 48, ativo: true,
    versoesPropulsao: [
      { tipoPropulsaoId: 3, propulsaoNome: 'Vela solar', velocidadeC: 0.006, autonomiaAl: 2.5 },
      { tipoPropulsaoId: 2, propulsaoNome: 'Fusão nuclear', velocidadeC: 0.032, autonomiaAl: 5.5 },
    ],
  },
];

const PARTIDAS_SEED = [
  '15 Jan 2100',
  '08 Mar 2100',
  '22 Mai 2100',
  '19 Jul 2100',
  '11 Set 2100',
  '27 Nov 2100',
];

const CLASSES_CONJUNTOS = [
  ['Executiva', 'Primeira classe', 'Luxo'],
  ['Executiva', 'Primeira classe'],
  ['Executiva', 'Luxo'],
];

export function calcularSaltoPropulsado(distanciaAl, aceleracaoG, beta) {
  if (!Number.isFinite(distanciaAl) || distanciaAl <= 0) {
    return { duracaoBordoAnos: 0, tempoTerraAnos: 0 };
  }
  const distM = distanciaAl * AL_METROS;
  const accel = Math.max(1e-5, aceleracaoG || 0.1) * G_MPS2;
  const vBeta = Math.min(0.9999, Math.max(0.0001, beta || 0.01));
  const raizBeta = Math.sqrt(1 - vBeta * vBeta);
  const gama = 1 / raizBeta;
  const gamaMenosUm = (vBeta * vBeta) / (raizBeta * (1 + raizBeta));
  const dAcc = ((C_MPS * C_MPS) / accel) * gamaMenosUm;

  if (2 * dAcc <= distM) {
    const tauAcc = (C_MPS / accel) * Math.atanh(vBeta);
    const tAcc = (C_MPS / accel) * gama * vBeta;
    const tCruz = (distM - 2 * dAcc) / (vBeta * C_MPS);
    const tauCruz = tCruz / gama;
    return {
      duracaoBordoAnos: (2 * tauAcc + tauCruz) / ANO_SEG,
      tempoTerraAnos: (2 * tAcc + tCruz) / ANO_SEG,
    };
  }

  const x = (accel * distM) / (2 * C_MPS * C_MPS);
  const raiz = Math.sqrt(x * (x + 2));
  return {
    duracaoBordoAnos: (2 * (C_MPS / accel) * Math.log1p(x + raiz)) / ANO_SEG,
    tempoTerraAnos: (2 * (C_MPS / accel) * raiz) / ANO_SEG,
  };
}

export function calcularChegadaTexto(partidaTexto, tempoTerraAnos) {
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const partes = (partidaTexto || '15 Jan 2100').split(' ');
  const mesStr = partes.find((p) => meses.includes(p)) || 'Jan';
  const anoBase = Number(partes[partes.length - 1]) || 2100;
  const totalMeses = anoBase * 12 + meses.indexOf(mesStr) + Math.max(1, Math.round((tempoTerraAnos || 0) * 12));
  const anoFinal = Math.floor(totalMeses / 12);
  const mesFinal = meses[((totalMeses % 12) + 12) % 12];
  return `${mesFinal} ${anoFinal}`;
}

export function calcularCenarioPropulsao({
  distanciaAl,
  aceleracaoG,
  velocidadeC,
  autonomiaAl,
  precoBaseReferencia,
  custoAnoLuzReferencia,
  rotaLumica,
  partidaTexto,
}) {
  const { duracaoBordoAnos, tempoTerraAnos } = calcularSaltoPropulsado(distanciaAl, aceleracaoG, velocidadeC);
  const dividaTemporalAnos = Math.max(0, tempoTerraAnos - duracaoBordoAnos);
  const auto = Math.max(0.1, autonomiaAl || 4);
  const paradas = distanciaAl > auto ? Math.max(0, Math.ceil(distanciaAl / auto) - 1) : 0;
  const precoFinal = Math.round(precoBaseReferencia + custoAnoLuzReferencia * distanciaAl + paradas * 50_000_000);

  const semLumica = {
    duracaoBordoAnos: Number(duracaoBordoAnos.toFixed(4)),
    tempoTerraAnos: Number(tempoTerraAnos.toFixed(4)),
    dividaTemporalAnos: Number(dividaTemporalAnos.toFixed(4)),
    precoFinal,
    paradas,
    chegadaTexto: calcularChegadaTexto(partidaTexto, tempoTerraAnos),
  };

  let comLumica = null;
  if (rotaLumica) {
    const betaL = Math.min(0.999, Math.max(0.95, rotaLumica.velocidadeC || 0.996));
    const tBase = (distanciaAl * AL_METROS) / (betaL * C_MPS) / ANO_SEG;
    const tauLum = tBase * Math.sqrt(1 - betaL * betaL);
    const tTerraLum = tBase * (rotaLumica.fatorDilatacao || FATOR_DILATACAO_LUMICA);
    comLumica = {
      duracaoBordoAnos: Number(tauLum.toFixed(4)),
      tempoTerraAnos: Number(tTerraLum.toFixed(4)),
      dividaTemporalAnos: Number(Math.max(0, tTerraLum - tauLum).toFixed(4)),
      precoFinal: Math.round(precoFinal + (rotaLumica.pedagio || 0)),
      paradas: 0,
      pedagio: rotaLumica.pedagio || 0,
      chegadaTexto: calcularChegadaTexto(partidaTexto, tTerraLum),
    };
  }

  return { semLumica, comLumica };
}

export function construirOpcoesPropulsaoViagem(viagem, estado) {
  const propulsoes = estado?.propulsoes || PROPULSOES_INICIAIS;
  const naves = estado?.onibusFrota || NAVES_SEED;
  const rotas = estado?.rotasLumicas || ROTAS_LUMICAS_SEED;
  const nave = naves.find((n) => n.id === viagem.onibusId);
  const rotaLumica = rotas.find((r) => r.id === viagem.rotaLumicaId) || null;

  const versoesNave = nave?.versoesPropulsao && nave.versoesPropulsao.length > 0
    ? nave.versoesPropulsao
    : [{ tipoPropulsaoId: null, propulsaoNome: viagem.propulsaoNome, velocidadeC: viagem.velocidadeC, autonomiaAl: viagem.autonomiaAl }];

  return versoesNave.map((versao) => {
    const prop = propulsoes.find((p) => p.id === versao.tipoPropulsaoId || p.nome === versao.propulsaoNome) || propulsoes[0];
    const velocidadeC = versao.velocidadeC || prop.velocidadeCruzeiroC;
    const autonomiaAl = versao.autonomiaAl || prop.autonomiaAnosLuz;
    const aceleracaoG = prop.aceleracaoG || 0.2;
    const { semLumica, comLumica } = calcularCenarioPropulsao({
      distanciaAl: viagem.distanciaAl,
      aceleracaoG,
      velocidadeC,
      autonomiaAl,
      precoBaseReferencia: prop.precoBaseReferencia || 50_000_000,
      custoAnoLuzReferencia: prop.custoAnoLuzReferencia || 1_000_000_000,
      rotaLumica,
      partidaTexto: viagem.partidaTexto,
    });
    return {
      propulsaoNome: prop.nome,
      codigo: prop.codigo || prop.nome.toUpperCase(),
      velocidadeC,
      autonomiaAl,
      semLumica,
      comLumica,
    };
  });
}

function construirViagensIniciais() {
  const destinos = PLANETAS_CSV.filter((p) => p.nome !== 'Terra');
  const viagens = [];

  destinos.forEach((planeta, pIdx) => {
    const sistema = SISTEMAS_CSV.find((s) => s.id === planeta.sistemaId);
    const distanciaAl = sistema && sistema.distanciaSolAl > 0
      ? sistema.distanciaSolAl
      : Number(Math.max(0.00001, (Math.abs(planeta.distanciaEstrelaUA - 1.0) * UA_METROS) / AL_METROS).toFixed(6));
    const rota = ROTAS_LUMICAS_SEED.find((r) => r.destinoSistemaId === planeta.sistemaId) || null;

    let paresNave;
    if (planeta.nome === 'Proxima Centauri b') {
      paresNave = [NAVES_SEED[0], NAVES_SEED[4]]; // Odyssey (Antimatéria) + Horizon (Fusão nuclear)
    } else if (planeta.nome === 'Proxima Centauri d') {
      paresNave = [NAVES_SEED[5], NAVES_SEED[8]]; // Solaris (Fusão nuclear) + Photon (Vela solar)
    } else {
      const n1 = NAVES_SEED[(pIdx * 2) % NAVES_SEED.length];
      let n2 = NAVES_SEED[(pIdx * 2 + 5) % NAVES_SEED.length];
      if (n1.id === n2.id) {
        n2 = NAVES_SEED[(n1.id) % NAVES_SEED.length];
      }
      paresNave = [n1, n2];
    }

    paresNave.forEach((nave, slot) => {
      const id = viagens.length + 1;
      const partidaTexto = PARTIDAS_SEED[(pIdx + slot * 3) % PARTIDAS_SEED.length];
      const classes = planeta.nome === 'Proxima Centauri b'
        ? ['Executiva', 'Primeira classe', 'Luxo']
        : CLASSES_CONJUNTOS[(id - 1) % CLASSES_CONJUNTOS.length];

      const viagemBase = {
        id,
        codigo: `NB-${String(id).padStart(3, '0')}`,
        origemNome: 'Terra',
        origemSistema: 'Sistema Solar',
        destinoPlanetaId: planeta.id,
        destinoNome: planeta.nome,
        sistemaDestino: planeta.sistemaNome,
        onibusId: nave.id,
        onibusNome: nave.identificacao,
        totalAssentos: nave.totalAssentos,
        propulsaoNome: nave.propulsaoNome,
        velocidadeC: nave.velocidadeC,
        autonomiaAl: nave.autonomiaAl,
        distanciaAl,
        partidaTexto,
        classes,
        status: 'PUBLICADA',
        rotaLumicaId: rota ? rota.id : null,
        propulsoesDisponiveis: nave.versoesPropulsao.map((vr) => vr.propulsaoNome),
        assentosOcupados: nave.totalAssentos >= 48
          ? ['01B', '02D', '04A', '06C', '08B', '10D', '11A']
          : nave.totalAssentos >= 32
            ? ['01B', '02A', '03C', '05D', '07B']
            : ['01B', '02A', '03C', '04B'],
      };

      const opcoesPropulsao = construirOpcoesPropulsaoViagem(viagemBase, {
        propulsoes: PROPULSOES_INICIAIS,
        rotasLumicas: ROTAS_LUMICAS_SEED,
        onibusFrota: NAVES_SEED,
      });
      const opcaoNave = opcoesPropulsao.find((op) => op.propulsaoNome === nave.propulsaoNome) || opcoesPropulsao[0];
      viagemBase.opcoesPropulsao = opcoesPropulsao;
      viagemBase.semLumica = opcaoNave.semLumica;
      viagemBase.comLumica = opcaoNave.comLumica;
      viagemBase.chegadaTexto = opcaoNave.semLumica.chegadaTexto;
      viagens.push(viagemBase);
    });
  });

  return viagens;
}

const VIAGENS_INICIAIS = construirViagensIniciais();
const VIAGEM_PADRAO = VIAGENS_INICIAIS.find((v) => v.destinoNome === 'Proxima Centauri b') || VIAGENS_INICIAIS[0];

const ESTADO_INICIAL = {
  sistemas: SISTEMAS_CSV,
  planetas: PLANETAS_CSV,
  propulsoes: PROPULSOES_INICIAIS,
  rotasLumicas: ROTAS_LUMICAS_SEED,
  onibusFrota: NAVES_SEED,
  viagens: VIAGENS_INICIAIS,
  minhasPassagens: [
    {
      id: 101,
      viagemId: VIAGEM_PADRAO.id,
      destinoNome: 'Proxima Centauri b',
      origemNome: 'Terra',
      dataPartida: VIAGEM_PADRAO.partidaTexto,
      chegadaEstimada: VIAGEM_PADRAO.chegadaTexto,
      tecnologia: `${VIAGEM_PADRAO.propulsaoNome} · 0,29 c`,
      assento: '01A',
      classe: 'Luxo',
      emCriogenia: true,
      duracaoBordoAnos: Number((VIAGEM_PADRAO.semLumica.duracaoBordoAnos * 0.1).toFixed(4)),
      usaRotaLumica: false,
      valorPago: Math.round(VIAGEM_PADRAO.semLumica.precoFinal * 2),
    },
  ],
  selecaoAtual: {
    viagemId: VIAGEM_PADRAO.id,
    propulsaoNome: 'Antimatéria',
    classe: 'Executiva',
    usaRotaLumica: false,
    lazer: 'Essencial',
    alimentacao: 'Padrão',
    poltrona: null,
    ultimaConfirmadaId: null,
  },
  ultimaBusca: {
    destino: '',
    partida: '',
    propulsoes: [],
    custoMaximoBi: '20',
    distanciaMaximaAl: 'Infinity',
    tempoTerraMaximoAnos: 'Infinity',
    ordenacao: 'relevancia',
  },
  usuariosRegistrados: [
    {
      nome: 'Dr. Carl Sagan',
      email: 'astronomo@nabuus.space',
      senhaHashDemo: '123456',
      perfil: 'ASTRONOMO',
      doc1: 'IAU-2100-BR',
      doc2: '',
    },
    {
      nome: 'Odyssey Linhas Estelares',
      email: 'fretista@nabuus.space',
      senhaHashDemo: '123456',
      perfil: 'FRETISTA',
      doc1: '12.345.678/0001-99',
      doc2: 'Odyssey Linhas Estelares Ltda',
    },
    {
      nome: 'Aurora Vance',
      email: 'viajante@nabuus.space',
      senhaHashDemo: '123456',
      perfil: 'VIAJANTE',
      doc1: '123.456.789-00',
      doc2: '1998-04-12',
    },
  ],
};

function temStorage() {
  return typeof globalThis !== 'undefined' && typeof globalThis.localStorage !== 'undefined';
}

export function lerEstado() {
  if (!temStorage()) {
    return structuredClone(ESTADO_INICIAL);
  }
  const bruto = globalThis.localStorage.getItem(CHAVE_STORAGE);
  if (!bruto) {
    const copia = structuredClone(ESTADO_INICIAL);
    globalThis.localStorage.setItem(CHAVE_STORAGE, JSON.stringify(copia));
    return copia;
  }
  try {
    return JSON.parse(bruto);
  } catch {
    const copia = structuredClone(ESTADO_INICIAL);
    globalThis.localStorage.setItem(CHAVE_STORAGE, JSON.stringify(copia));
    return copia;
  }
}

export function salvarEstado(novoEstado) {
  if (temStorage()) {
    globalThis.localStorage.setItem(CHAVE_STORAGE, JSON.stringify(novoEstado));
  }
  return novoEstado;
}

export function lerUltimaBusca() {
  const estado = lerEstado();
  return estado.ultimaBusca || structuredClone(ESTADO_INICIAL.ultimaBusca);
}

export function salvarUltimaBusca(busca) {
  const estado = lerEstado();
  estado.ultimaBusca = {
    ...ESTADO_INICIAL.ultimaBusca,
    ...(estado.ultimaBusca || {}),
    ...busca,
  };
  salvarEstado(estado);
  return estado.ultimaBusca;
}

export function lerSessao() {
  if (!temStorage()) {
    return null;
  }
  try {
    const bruto = globalThis.localStorage.getItem(CHAVE_SESSAO);
    return bruto ? JSON.parse(bruto) : null;
  } catch {
    return null;
  }
}

export function salvarSessao(sessao) {
  if (!temStorage()) {
    return;
  }
  if (!sessao) {
    globalThis.localStorage.removeItem(CHAVE_SESSAO);
    return;
  }
  globalThis.localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
}

export async function requisicaoHttp(url, opcoes = {}) {
  const sessao = lerSessao();
  const headers = {
    'Content-Type': 'application/json',
    ...(sessao?.token ? { Authorization: `Bearer ${sessao.token}` } : {}),
    ...(opcoes.headers || {}),
  };

  try {
    const resposta = await fetch(url, { ...opcoes, headers });
    if (resposta.status === 401) {
      if (url.includes('/auth/login')) {
        const problema = await resposta.json().catch(() => ({}));
        throw new Error(problema.detail || 'E-mail ou senha inválidos.');
      }
      salvarSessao(null);
      throw new Error('Sessão expirada. Faça login novamente.');
    }
    if (resposta.status === 403) {
      throw new Error('Seu perfil não possui permissão para esta operação.');
    }
    if (!resposta.ok) {
      const problema = await resposta.json().catch(() => ({}));
      throw new Error(problema.detail || problema.title || 'Erro ao processar requisição.');
    }
    if (resposta.status === 204) {
      return null;
    }
    return await resposta.json();
  } catch (erro) {
    if (erro instanceof TypeError) {
      const falhaRede = new Error('Servidor indisponível no momento.');
      falhaRede.ehErroRede = true;
      throw falhaRede;
    }
    throw erro instanceof Error ? erro : new Error('Falha de comunicação com o servidor.');
  }
}

export async function sincronizarApiJava(caminho, opcoes = {}) {
  const sessao = lerSessao();
  if (!sessao?.token || String(sessao.token).startsWith('demo-jwt-')) {
    return null;
  }
  try {
    return await requisicaoHttp(`${API_JAVA_BASE_URL}${caminho}`, opcoes);
  } catch {
    return null;
  }
}
