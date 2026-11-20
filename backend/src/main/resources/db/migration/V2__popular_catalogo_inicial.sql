-- V2: Carga inicial de referência (Astrônomo, Fretista, Sistemas, Planetas, Propulsões e Rotas Lúmicas)
-- Senha padrão de demonstração (BCrypt para "123456"): $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

INSERT INTO usuario (id, nome, email, hash_senha, role) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Dr. Carl Sagan', 'astronomo@nabuus.space', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'ASTRONOMO'),
    ('22222222-2222-2222-2222-222222222222', 'Odyssey Linhas Estelares', 'fretista@nabuus.space', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'FRETISTA'),
    ('33333333-3333-3333-3333-333333333333', 'Aurora Vance', 'viajante@nabuus.space', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'PASSAGEIRO');

INSERT INTO astronomo (usuario_id, credencial_cientifica) VALUES
    ('11111111-1111-1111-1111-111111111111', 'IAU-2100-BR');

INSERT INTO fretista (usuario_id, cnpj_intergalactico, razao_social) VALUES
    ('22222222-2222-2222-2222-222222222222', '12.345.678/0001-99', 'Odyssey Linhas Estelares Ltda');

INSERT INTO passageiro (usuario_id, cpf, data_nascimento) VALUES
    ('33333333-3333-3333-3333-333333333333', '123.456.789-00', '1998-04-12');

INSERT INTO sistema_solar (astronomo_id, nome, estrela_principal, coordenada_ra, coordenada_dec, distancia_sol_anos_luz) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Sistema Solar', 'Sol', 0.0, 0.0, 0.0),
    ('11111111-1111-1111-1111-111111111111', 'Sistema Alpha Centauri', 'Alpha Centauri', 217.43, -62.68, 4.24),
    ('11111111-1111-1111-1111-111111111111', 'Sistema de Barnard', 'Estrela de Barnard', 269.45, 4.69, 5.96),
    ('11111111-1111-1111-1111-111111111111', 'TRAPPIST-1', 'TRAPPIST-1', 346.62, -5.04, 40.54);

INSERT INTO planeta (sistema_solar_id, nome, raio_base, massa_base, zona_habitavel, distancia_estrela_ua, possui_posto_recarga, descricao_nabuus) VALUES
    (1, 'Terra', 1.0, 1.0, TRUE, 1.0, TRUE, 'O lar. Único planeta com vida confirmada no universo conhecido.'),
    (1, 'Marte', 0.532, 0.107, FALSE, 1.524, TRUE, 'O planeta vermelho foi o primeiro passo da humanidade além da Terra.'),
    (2, 'Proxima Centauri b', 1.02, 1.05, TRUE, 0.048, FALSE, 'O exoplaneta mais próximo da Terra (4,24 anos-luz).'),
    (2, 'Alpha Centauri A', 1.2, 1.1, FALSE, 1.2, TRUE, 'Estrela e posto avançado de reabastecimento no sistema vizinho.'),
    (3, 'Estrela de Barnard', 1.1, 1.4, FALSE, 0.04, TRUE, 'Anã vermelha próxima a 5,96 anos-luz.'),
    (4, 'TRAPPIST-1 e', 0.92, 0.69, TRUE, 0.029, FALSE, 'Na zona habitável ideal, com atmosfera confirmada pelo JWST.');

INSERT INTO tipo_propulsao (astronomo_id, codigo, nome, aceleracao_g, velocidade_cruzeiro_c, autonomia_anos_luz, categoria_conforto, preco_base_referencia, custo_ano_luz_referencia) VALUES
    ('11111111-1111-1111-1111-111111111111', 'QUIMICA', 'Propulsão Química', 0.001, 0.0001, 0.50, 'ECONOMICA', 500.00, 150.00),
    ('11111111-1111-1111-1111-111111111111', 'VELA_SOLAR', 'Vela Solar Fotônica', 0.0005, 0.002, 2.00, 'ECONOMICA', 800.00, 100.00),
    ('11111111-1111-1111-1111-111111111111', 'VELA_LASER', 'Vela Laser', 0.01, 0.20, 4.50, 'EXECUTIVA', 3500.00, 600.00),
    ('11111111-1111-1111-1111-111111111111', 'FISSAO_PULSADA', 'Fissão Pulsada', 0.05, 0.03, 5.00, 'ECONOMICA', 1800.00, 300.00),
    ('11111111-1111-1111-1111-111111111111', 'FUSAO', 'Fusão Nuclear', 0.05, 0.12, 8.00, 'EXECUTIVA', 4200.00, 750.00),
    ('11111111-1111-1111-1111-111111111111', 'ANTIMATERIA', 'Antimatéria', 1.0, 0.40, 15.00, 'LUXO', 15000.00, 2500.00);

INSERT INTO rota_lumica (astronomo_id, sistema_origem_id, sistema_destino_id, velocidade_c, pedagio, ativa) VALUES
    ('11111111-1111-1111-1111-111111111111', 1, 2, 0.80, 50000.00, TRUE),
    ('11111111-1111-1111-1111-111111111111', 1, 3, 0.85, 75000.00, TRUE);

INSERT INTO onibus_espacial (fretista_id, tipo_propulsao_id, identificacao, total_assentos, ativo) VALUES
    ('22222222-2222-2222-2222-222222222222', 6, 'NABUUS Odyssey', 24, TRUE),
    ('22222222-2222-2222-2222-222222222222', 5, 'NABUUS Horizon', 32, TRUE),
    ('22222222-2222-2222-2222-222222222222', 6, 'NABUUS Aurora', 48, TRUE);
