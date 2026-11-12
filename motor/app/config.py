"""Constantes físicas e parâmetros configuráveis do motor."""

# Constantes físicas (SI)
C = 299_792_458.0                 # velocidade da luz [m/s]
G0 = 9.80665                      # gravidade padrão [m/s²]
ANO = 365.25 * 86_400.0           # ano juliano [s]
ANO_LUZ = C * ANO                 # [m]
UA = 149_597_870_700.0            # unidade astronômica [m]

# Limites de validação
BETA_MAX_NAVE = 0.4               # teto de cruzeiro das naves "realistas"

# Preço
CUSTO_POR_PARADA = 2_000.00       # custo fixo por parada de reabastecimento

# Ocupação procedural: taxa base por categoria de conforto e variação aleatória
TAXA_OCUPACAO = {
    "ECONOMICA": 0.85,
    "EXECUTIVA": 0.55,
    "LUXO": 0.25,
}
VARIACAO_OCUPACAO = 0.15
ASSENTOS_POR_FILEIRA = "ABCD"

