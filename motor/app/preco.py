"""Cálculo de preço final e sugestão de valores base para o fretista."""
from app.config import CUSTO_POR_PARADA

# Multiplicador de conforto sobre os valores de referência do tipo de propulsão
_FATOR_CONFORTO = {
    "ECONOMICA": 1.0,
    "EXECUTIVA": 1.8,
    "LUXO": 3.2,
}


def sugerir_precos(
    preco_base_ref: float,
    custo_ano_luz_ref: float,
    categoria_conforto: str,
) -> tuple[float, float]:
    """Sugere (preco_base, custo_ano_luz) a partir do tipo de propulsão e conforto."""
    fator = _FATOR_CONFORTO.get(categoria_conforto.upper(), 1.0)
    return round(preco_base_ref * fator, 2), round(custo_ano_luz_ref * fator, 2)


def calcular_preco_final(
    preco_base: float,
    custo_ano_luz: float,
    distancia_al: float,
    num_paradas: int,
    pedagio_lumico: float = 0.0,
) -> float:
    """preço final = base + custoAnoLuz·distância + custoParada·paradas + pedágio."""
    total = (
        preco_base
        + custo_ano_luz * distancia_al
        + CUSTO_POR_PARADA * num_paradas
        + pedagio_lumico
    )
    return round(total, 2)

