"""Conversão de coordenadas equatoriais para cartesianas (Sol na origem)."""
import math


def para_cartesiano(ra_graus: float, dec_graus: float, distancia_al: float) -> tuple[float, float, float]:
    """RA/Dec em graus + distância em anos-luz → (x, y, z) em anos-luz."""
    ra = math.radians(ra_graus)
    dec = math.radians(dec_graus)
    return (
        distancia_al * math.cos(dec) * math.cos(ra),
        distancia_al * math.cos(dec) * math.sin(ra),
        distancia_al * math.sin(dec),
    )


def distancia(p: tuple[float, float, float], q: tuple[float, float, float]) -> float:
    return math.dist(p, q)

