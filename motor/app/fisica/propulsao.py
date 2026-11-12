"""Modelos de propulsão (padrão Strategy — RNF-03 / RNF-09).

Novos modelos (ex.: vela solar com perfil de empuxo real) devem apenas
implementar ``Propulsao.salto`` sem alterar o restante do motor.
"""
from abc import ABC, abstractmethod

from app.config import G0
from app.fisica.cinematica import salto_propulsado, trecho_lumico


class Propulsao(ABC):
    @abstractmethod
    def salto(self, distancia: float) -> tuple[float, float]:
        """Retorna (tau, t) em segundos para um salto parada→parada de ``distancia`` metros."""


class AceleracaoConstante(Propulsao):
    """Aproximação usada para todos os tipos cadastrados pelo astrônomo."""

    def __init__(self, aceleracao_g: float, velocidade_cruzeiro_c: float):
        self.aceleracao = aceleracao_g * G0
        self.beta = velocidade_cruzeiro_c

    def salto(self, distancia: float) -> tuple[float, float]:
        return salto_propulsado(distancia, self.aceleracao, self.beta)


class PropulsaoLumica(Propulsao):
    """Hipótese sci-fi: trânsito a velocidade fixa sem aceleração."""

    def __init__(self, velocidade_c: float):
        self.beta = velocidade_c

    def salto(self, distancia: float) -> tuple[float, float]:
        return trecho_lumico(distancia, self.beta)

