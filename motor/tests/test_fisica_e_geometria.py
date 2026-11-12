"""Testes unitários de cinemática relativística, geometria 3D e formatação de escalas."""
import math
import pytest

from app.config import ANO, ANO_LUZ, C, G0, UA
from app.fisica.cinematica import salto_propulsado, trecho_lumico
from app.fisica.propulsao import AceleracaoConstante, PropulsaoLumica
from app.formatacao import distancia_al, tempo
from app.geometria import distancia, para_cartesiano


def test_salto_propulsado_continuidade_na_fronteira_cruzeiro():
    """Na distância exata 2·d_acc, os regimes com e sem cruzeiro coincidem."""
    a = 1.0 * G0
    beta = 0.3
    gama = 1.0 / math.sqrt(1.0 - beta * beta)
    d_limite = 2.0 * (C * C / a) * (gama - 1.0)

    tau_com, t_com = salto_propulsado(d_limite * 1.000001, a, beta)
    tau_sem, t_sem = salto_propulsado(d_limite * 0.999999, a, beta)

    assert math.isclose(tau_com, tau_sem, rel_tol=1e-5)
    assert math.isclose(t_com, t_sem, rel_tol=1e-5)
    assert t_com > tau_com > d_limite / C


def test_limite_newtoniano_baixa_velocidade():
    """Para β << 1 e distância curta sem cruzeiro, d = 2·(1/2·a·(T/2)²) => T = 2·sqrt(d/a)."""
    a = 0.01 * G0
    d = 1.0 * UA
    tau, t = salto_propulsado(d, a, beta=0.2)  # não atinge 0.2c em 1 UA a 0.01g
    t_newton = 2.0 * math.sqrt(d / a)
    assert math.isclose(tau, t_newton, rel_tol=1e-4)
    assert math.isclose(t, t_newton, rel_tol=1e-4)


def test_trecho_lumico_fator_lorentz_exato():
    """A 0,8c, γ = 5/3 => τ = 0,6·t e dívida temporal = 0,4·t."""
    d = 10.0 * ANO_LUZ
    tau, t = trecho_lumico(d, 0.8)
    t_esperado = 10.0 / 0.8 * ANO  # 12,5 anos
    tau_esperado = 0.6 * t_esperado  # 7,5 anos
    assert math.isclose(t, t_esperado, rel_tol=1e-12)
    assert math.isclose(tau, tau_esperado, rel_tol=1e-12)
    assert math.isclose(t - tau, 5.0 * ANO, rel_tol=1e-12)


def test_divida_temporal_maior_na_rota_lumica():
    """Rota lúmica a 0,8c gera menor duração a bordo porém maior dívida temporal que nave a 0,12c."""
    d = 4.2465 * ANO_LUZ
    nave = AceleracaoConstante(aceleracao_g=0.05, velocidade_cruzeiro_c=0.12)
    lumica = PropulsaoLumica(velocidade_c=0.8)

    tau_nave, t_nave = nave.salto(d)
    tau_lum, t_lum = lumica.salto(d)

    assert tau_lum < tau_nave
    assert (t_lum - tau_lum) > (t_nave - tau_nave)


def test_geometria_proxima_e_alfa_centauri():
    sol = para_cartesiano(0.0, 0.0, 0.0)
    proxima = para_cartesiano(217.42895, -62.67948, 4.2465)
    alfa_cen = para_cartesiano(219.90206, -60.83399, 4.3441)

    assert math.isclose(distancia(sol, proxima), 4.2465, rel_tol=1e-9)
    # Proxima está a ~0,21 ano-luz do par Alfa Centauri A/B
    d_ab = distancia(proxima, alfa_cen)
    assert 0.15 < d_ab < 0.30


def test_formatacao_escalas_rf23():
    assert tempo(3600 * 5) == "5 horas"
    assert tempo(86400 * 10) == "10 dias"
    assert tempo(86400 * 90) == "3 meses"
    assert tempo(ANO * 4.2) == "4,2 anos"
    assert tempo(ANO * 3_200) == "3,2 mil de anos"
    assert tempo(ANO * 2_500_000) == "2,5 milhões de anos"
    assert tempo(ANO * 1_000_000_000) == "1 bilhão de anos"
    assert distancia_al(4.25) == "4,2 anos-luz"
    assert "UA" in distancia_al(1.0 / 63_241.077)


def test_entradas_invalidas_cinematica():
    with pytest.raises(ValueError):
        salto_propulsado(1000.0, -1.0, 0.1)
    with pytest.raises(ValueError):
        trecho_lumico(1000.0, 1.0)

