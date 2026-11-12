"""Cinemática relativística dos trechos de viagem.

Todas as funções recebem e devolvem grandezas em SI e retornam uma tupla
``(tau, t)``: tempo próprio (a bordo) e tempo no referencial estacionário.
"""
import math

from app.config import C


def _gama_menos_um(beta: float) -> float:
    """γ - 1 calculado de forma estável para β pequeno."""
    s = math.sqrt(1.0 - beta * beta)
    return beta * beta / (s * (1.0 + s))


def salto_propulsado(distancia: float, aceleracao: float, beta: float) -> tuple[float, float]:
    """Salto parada→parada: aceleração própria constante, cruzeiro em β e frenagem simétrica.

    Se a distância não permite atingir o cruzeiro, a nave acelera até a metade
    do caminho e freia na outra metade.
    """
    if distancia <= 0:
        return 0.0, 0.0
    if aceleracao <= 0 or not 0 < beta < 1:
        raise ValueError("aceleração deve ser > 0 e 0 < β < 1")

    gama = 1.0 / math.sqrt(1.0 - beta * beta)
    d_acc = (C * C / aceleracao) * _gama_menos_um(beta)

    if 2.0 * d_acc <= distancia:
        tau_acc = (C / aceleracao) * math.atanh(beta)
        t_acc = (C / aceleracao) * gama * beta
        t_cruz = (distancia - 2.0 * d_acc) / (beta * C)
        tau_cruz = t_cruz / gama
        return 2.0 * tau_acc + tau_cruz, 2.0 * t_acc + t_cruz

    # Sem cruzeiro: γ de pico = 1 + x, com x = a·(d/2)/c²
    x = aceleracao * distancia / (2.0 * C * C)
    raiz = math.sqrt(x * (x + 2.0))          # = sqrt(γp² - 1) = γβ de pico
    tau = 2.0 * (C / aceleracao) * math.log1p(x + raiz)   # 2(c/a)·arcosh(γp)
    t = 2.0 * (C / aceleracao) * raiz
    return tau, t


def trecho_lumico(distancia: float, beta: float) -> tuple[float, float]:
    """Trânsito por rota lúmica: velocidade constante, entrada/saída instantâneas."""
    if distancia <= 0:
        return 0.0, 0.0
    if not 0 < beta < 1:
        raise ValueError("0 < β < 1")
    t = distancia / (beta * C)
    return t * math.sqrt(1.0 - beta * beta), t

