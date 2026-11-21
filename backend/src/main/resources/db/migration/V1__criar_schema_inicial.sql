-- V1: Schema relacional inicial do sistema Nabuus (PostgreSQL)

CREATE TABLE usuario (
    id UUID NOT NULL,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL,
    hash_senha VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    CONSTRAINT pk_usuario PRIMARY KEY (id),
    CONSTRAINT uk_usuario_email UNIQUE (email),
    CONSTRAINT ck_usuario_role CHECK (role IN ('ASTRONOMO', 'FRETISTA', 'PASSAGEIRO'))
);

CREATE TABLE astronomo (
    usuario_id UUID NOT NULL,
    credencial_cientifica VARCHAR(60) NOT NULL,
    CONSTRAINT pk_astronomo PRIMARY KEY (usuario_id),
    CONSTRAINT uk_astronomo_credencial UNIQUE (credencial_cientifica),
    CONSTRAINT fk_astronomo_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE RESTRICT
);

CREATE TABLE fretista (
    usuario_id UUID NOT NULL,
    cnpj_intergalactico VARCHAR(30) NOT NULL,
    razao_social VARCHAR(150) NOT NULL,
    CONSTRAINT pk_fretista PRIMARY KEY (usuario_id),
    CONSTRAINT uk_fretista_cnpj UNIQUE (cnpj_intergalactico),
    CONSTRAINT fk_fretista_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE RESTRICT
);

CREATE TABLE passageiro (
    usuario_id UUID NOT NULL,
    cpf VARCHAR(14) NOT NULL,
    data_nascimento DATE NOT NULL,
    CONSTRAINT pk_passageiro PRIMARY KEY (usuario_id),
    CONSTRAINT uk_passageiro_cpf UNIQUE (cpf),
    CONSTRAINT fk_passageiro_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE RESTRICT
);

CREATE TABLE sistema_solar (
    id BIGINT GENERATED ALWAYS AS IDENTITY,
    astronomo_id UUID NOT NULL,
    nome VARCHAR(100) NOT NULL,
    estrela_principal VARCHAR(100) NOT NULL,
    coordenada_ra DOUBLE PRECISION NOT NULL,
    coordenada_dec DOUBLE PRECISION NOT NULL,
    distancia_sol_anos_luz DOUBLE PRECISION NOT NULL,
    CONSTRAINT pk_sistema_solar PRIMARY KEY (id),
    CONSTRAINT uk_sistema_solar_nome UNIQUE (nome),
    CONSTRAINT fk_sistema_solar_astronomo FOREIGN KEY (astronomo_id) REFERENCES astronomo (usuario_id) ON DELETE RESTRICT,
    CONSTRAINT ck_sistema_solar_distancia CHECK (distancia_sol_anos_luz >= 0)
);

CREATE INDEX idx_sistema_solar_astronomo_id ON sistema_solar (astronomo_id);

CREATE TABLE planeta (
    id BIGINT GENERATED ALWAYS AS IDENTITY,
    sistema_solar_id BIGINT NOT NULL,
    nome VARCHAR(100) NOT NULL,
    raio_base DOUBLE PRECISION NOT NULL,
    massa_base DOUBLE PRECISION NOT NULL,
    zona_habitavel BOOLEAN NOT NULL DEFAULT FALSE,
    distancia_estrela_ua DOUBLE PRECISION NOT NULL,
    possui_posto_recarga BOOLEAN NOT NULL DEFAULT FALSE,
    descricao_nabuus TEXT,
    CONSTRAINT pk_planeta PRIMARY KEY (id),
    CONSTRAINT uk_planeta_nome UNIQUE (nome),
    CONSTRAINT fk_planeta_sistema_solar FOREIGN KEY (sistema_solar_id) REFERENCES sistema_solar (id) ON DELETE RESTRICT,
    CONSTRAINT ck_planeta_distancia_ua CHECK (distancia_estrela_ua >= 0)
);

CREATE INDEX idx_planeta_sistema_solar_id ON planeta (sistema_solar_id);

CREATE TABLE rota_lumica (
    id BIGINT GENERATED ALWAYS AS IDENTITY,
    astronomo_id UUID NOT NULL,
    sistema_origem_id BIGINT NOT NULL,
    sistema_destino_id BIGINT NOT NULL,
    velocidade_c DOUBLE PRECISION NOT NULL,
    pedagio NUMERIC(14, 2) NOT NULL,
    ativa BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT pk_rota_lumica PRIMARY KEY (id),
    CONSTRAINT fk_rota_lumica_astronomo FOREIGN KEY (astronomo_id) REFERENCES astronomo (usuario_id) ON DELETE RESTRICT,
    CONSTRAINT fk_rota_lumica_origem FOREIGN KEY (sistema_origem_id) REFERENCES sistema_solar (id) ON DELETE RESTRICT,
    CONSTRAINT fk_rota_lumica_destino FOREIGN KEY (sistema_destino_id) REFERENCES sistema_solar (id) ON DELETE RESTRICT,
    CONSTRAINT ck_rota_lumica_pedagio_positivo CHECK (pedagio >= 0),
    CONSTRAINT ck_rota_lumica_velocidade CHECK (velocidade_c > 0 AND velocidade_c < 1)
);

CREATE INDEX idx_rota_lumica_astronomo_id ON rota_lumica (astronomo_id);
CREATE INDEX idx_rota_lumica_sistemas ON rota_lumica (sistema_origem_id, sistema_destino_id);

CREATE TABLE tipo_propulsao (
    id BIGINT GENERATED ALWAYS AS IDENTITY,
    astronomo_id UUID NOT NULL,
    codigo VARCHAR(40) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    aceleracao_g DOUBLE PRECISION NOT NULL,
    velocidade_cruzeiro_c DOUBLE PRECISION NOT NULL,
    autonomia_anos_luz DOUBLE PRECISION NOT NULL,
    categoria_conforto VARCHAR(20) NOT NULL,
    preco_base_referencia NUMERIC(14, 2) NOT NULL,
    custo_ano_luz_referencia NUMERIC(14, 2) NOT NULL,
    CONSTRAINT pk_tipo_propulsao PRIMARY KEY (id),
    CONSTRAINT uk_tipo_propulsao_codigo UNIQUE (codigo),
    CONSTRAINT fk_tipo_propulsao_astronomo FOREIGN KEY (astronomo_id) REFERENCES astronomo (usuario_id) ON DELETE RESTRICT,
    CONSTRAINT ck_tipo_propulsao_conforto CHECK (categoria_conforto IN ('ECONOMICA', 'EXECUTIVA', 'LUXO'))
);

CREATE INDEX idx_tipo_propulsao_astronomo_id ON tipo_propulsao (astronomo_id);

CREATE TABLE onibus_espacial (
    id BIGINT GENERATED ALWAYS AS IDENTITY,
    fretista_id UUID NOT NULL,
    tipo_propulsao_id BIGINT NOT NULL,
    identificacao VARCHAR(60) NOT NULL,
    total_assentos INTEGER NOT NULL,
    velocidade_cruzeiro_c DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT pk_onibus_espacial PRIMARY KEY (id),
    CONSTRAINT uk_onibus_identificacao UNIQUE (identificacao),
    CONSTRAINT fk_onibus_espacial_fretista FOREIGN KEY (fretista_id) REFERENCES fretista (usuario_id) ON DELETE RESTRICT,
    CONSTRAINT fk_onibus_espacial_propulsao FOREIGN KEY (tipo_propulsao_id) REFERENCES tipo_propulsao (id) ON DELETE RESTRICT,
    CONSTRAINT ck_onibus_assentos_positivos CHECK (total_assentos > 0)
);

CREATE INDEX idx_onibus_espacial_fretista_id ON onibus_espacial (fretista_id);
CREATE INDEX idx_onibus_espacial_propulsao_id ON onibus_espacial (tipo_propulsao_id);

CREATE TABLE viagem (
    id BIGINT GENERATED ALWAYS AS IDENTITY,
    fretista_id UUID NOT NULL,
    onibus_espacial_id BIGINT NOT NULL,
    planeta_embarque_id BIGINT NOT NULL,
    planeta_desembarque_id BIGINT NOT NULL,
    rota_lumica_id BIGINT,
    data_partida TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL,
    preco_base NUMERIC(14, 2) NOT NULL,
    custo_ano_luz NUMERIC(14, 2) NOT NULL,
    viavel_sem_lumica BOOLEAN NOT NULL,
    duracao_bordo_anos_sem_lumica DOUBLE PRECISION,
    divida_temporal_anos_sem_lumica DOUBLE PRECISION,
    preco_sem_lumica NUMERIC(14, 2),
    paradas_reabastecimento INTEGER NOT NULL DEFAULT 0,
    viavel_com_lumica BOOLEAN NOT NULL,
    duracao_bordo_anos_com_lumica DOUBLE PRECISION,
    divida_temporal_anos_com_lumica DOUBLE PRECISION,
    preco_com_lumica NUMERIC(14, 2),
    rota_2d_json JSONB NOT NULL,
    assentos_ocupados_json JSONB NOT NULL,
    CONSTRAINT pk_viagem PRIMARY KEY (id),
    CONSTRAINT fk_viagem_fretista FOREIGN KEY (fretista_id) REFERENCES fretista (usuario_id) ON DELETE RESTRICT,
    CONSTRAINT fk_viagem_onibus FOREIGN KEY (onibus_espacial_id) REFERENCES onibus_espacial (id) ON DELETE RESTRICT,
    CONSTRAINT fk_viagem_embarque FOREIGN KEY (planeta_embarque_id) REFERENCES planeta (id) ON DELETE RESTRICT,
    CONSTRAINT fk_viagem_desembarque FOREIGN KEY (planeta_desembarque_id) REFERENCES planeta (id) ON DELETE RESTRICT,
    CONSTRAINT fk_viagem_rota_lumica FOREIGN KEY (rota_lumica_id) REFERENCES rota_lumica (id) ON DELETE RESTRICT,
    CONSTRAINT ck_viagem_precos_positivos CHECK (preco_base >= 0 AND custo_ano_luz >= 0),
    CONSTRAINT ck_viagem_status CHECK (status IN ('PUBLICADA', 'SUSPENSA', 'CANCELADA'))
);

CREATE INDEX idx_viagem_embarque_desembarque_status ON viagem (planeta_embarque_id, planeta_desembarque_id, status);
CREATE INDEX idx_viagem_fretista_id ON viagem (fretista_id);
CREATE INDEX idx_viagem_rota_lumica_id ON viagem (rota_lumica_id);

CREATE TABLE passagem (
    id BIGINT GENERATED ALWAYS AS IDENTITY,
    viagem_id BIGINT NOT NULL,
    passageiro_id UUID NOT NULL,
    assento_escolhido VARCHAR(10) NOT NULL,
    usa_rota_lumica BOOLEAN NOT NULL DEFAULT FALSE,
    valor_pago NUMERIC(14, 2) NOT NULL,
    data_compra TIMESTAMP WITH TIME ZONE NOT NULL,
    codigo_comprovante VARCHAR(40) NOT NULL,
    CONSTRAINT pk_passagem PRIMARY KEY (id),
    CONSTRAINT uk_passagem_comprovante UNIQUE (codigo_comprovante),
    CONSTRAINT uk_passagem_viagem_passageiro_assento UNIQUE (viagem_id, passageiro_id, assento_escolhido),
    CONSTRAINT fk_passagem_viagem FOREIGN KEY (viagem_id) REFERENCES viagem (id) ON DELETE RESTRICT,
    CONSTRAINT fk_passagem_passageiro FOREIGN KEY (passageiro_id) REFERENCES passageiro (usuario_id) ON DELETE RESTRICT,
    CONSTRAINT ck_passagem_valor_positivo CHECK (valor_pago >= 0)
);

CREATE INDEX idx_passagem_viagem_id ON passagem (viagem_id);
CREATE INDEX idx_passagem_passageiro_id ON passagem (passageiro_id);
