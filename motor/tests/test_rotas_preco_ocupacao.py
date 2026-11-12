"""Testes de roteamento (sem/com lúmica, paradas gulosas), preço e ocupação."""
import math

from app.config import ANO, CUSTO_POR_PARADA
from app.fisica.propulsao import AceleracaoConstante
from app.ocupacao import gerar_assentos_ocupados, gerar_perfis
from app.preco import calcular_preco_final, sugerir_precos
from app.rotas import (
    DadosRotaLumica,
    PontoPlaneta,
    calcular_com_lumica,
    calcular_sem_lumica,
)


def test_viagem_intrasistema_terra_marte():
    terra = PontoPlaneta(planeta_id=3, sistema_id=0, pos_al=(0.0, 0.0, 0.0), distancia_estrela_ua=1.0)
    marte = PontoPlaneta(planeta_id=4, sistema_id=0, pos_al=(0.0, 0.0, 0.0), distancia_estrela_ua=1.524)
    prop = AceleracaoConstante(aceleracao_g=0.05, velocidade_cruzeiro_c=0.12)

    res = calcular_sem_lumica(terra, marte, postos=[], autonomia_al=1.0, propulsao=prop)
    assert res.viavel
    assert res.paradas_planeta_ids == []
    assert len(res.trechos) == 1
    assert res.trechos[0].tipo == "INTRASISTEMA"
    # A 0,05g por 0,524 UA (~7,84e10 m), T = 2·sqrt(d/a) ≈ 9,25 dias
    dias = res.tau_total_s / 86_400
    assert 8.5 < dias < 10.0


def test_roteamento_guloso_escolhe_posto_mais_avancado():
    """Com autonomia de 4 al para ir de x=0 até x=10, deve parar em x=3.8 e depois em x=7.5."""
    origem = PontoPlaneta(1, 1, (0.0, 0.0, 0.0), 1.0)
    destino = PontoPlaneta(99, 99, (10.0, 0.0, 0.0), 1.0)
    postos = [
        PontoPlaneta(10, 10, (2.0, 0.0, 0.0)),   # alcançável, mas menos avançado
        PontoPlaneta(11, 11, (3.8, 0.0, 0.0)),   # mais avançado no 1º salto (≤ 4 al)
        PontoPlaneta(12, 12, (5.5, 0.0, 0.0)),   # alcançável no 2º salto, menos avançado
        PontoPlaneta(13, 13, (7.5, 0.0, 0.0)),   # mais avançado no 2º salto (3.8 + 3.7 ≤ 4 al)
    ]
    prop = AceleracaoConstante(0.1, 0.2)

    res = calcular_sem_lumica(origem, destino, postos, autonomia_al=4.0, propulsao=prop)
    assert res.viavel
    assert res.paradas_planeta_ids == [11, 13]
    assert len(res.trechos) == 3


def test_roteamento_inviavel_quando_lacuna_excede_autonomia():
    origem = PontoPlaneta(1, 1, (0.0, 0.0, 0.0))
    destino = PontoPlaneta(2, 2, (12.0, 0.0, 0.0))
    postos = [PontoPlaneta(10, 10, (3.0, 0.0, 0.0))]  # falta posto entre 3 e 12
    prop = AceleracaoConstante(0.1, 0.2)

    res = calcular_sem_lumica(origem, destino, postos, autonomia_al=4.0, propulsao=prop)
    assert not res.viavel
    assert res.motivo_inviabilidade is not None


def test_cenario_com_rota_lumica_tres_etapas():
    origem = PontoPlaneta(3, 0, (0.0, 0.0, 0.0), distancia_estrela_ua=1.0)
    destino = PontoPlaneta(9, 1, (4.2465, 0.0, 0.0), distancia_estrela_ua=0.0485)
    prop = AceleracaoConstante(0.05, 0.12)
    rota = DadosRotaLumica(id=7, velocidade_c=0.8, pedagio=50_000.0, ativa=True)

    res = calcular_com_lumica(origem, destino, autonomia_al=2.0, propulsao_nave=prop, rota_lumica=rota)
    assert res.viavel
    assert res.rota_lumica_id == 7
    assert [t.tipo for t in res.trechos] == ["INTRASISTEMA", "LUMICO", "INTRASISTEMA"]
    # O trecho lúmico a 0,8c por 4,2465 al leva ~3,185 anos de bordo (+ ~15 dias intrasistema)
    assert math.isclose(res.trechos[1].tau_s / ANO, 4.2465 / 0.8 * 0.6, rel_tol=1e-6)
    assert math.isclose(res.tau_total_s / ANO, 4.2465 / 0.8 * 0.6, rel_tol=0.02)


def test_preco_e_sugestao():
    base, custo_al = sugerir_precos(1000.0, 200.0, "LUXO")
    assert base > 1000.0 and custo_al > 200.0

    final = calcular_preco_final(
        preco_base=1500.0,
        custo_ano_luz=200.0,
        distancia_al=5.0,
        num_paradas=2,
        pedagio_lumico=10_000.0,
    )
    assert final == 1500.0 + 1000.0 + 2 * CUSTO_POR_PARADA + 10_000.0


def test_ocupacao_deterministica_e_proporcional_ao_conforto():
    a1 = gerar_assentos_ocupados(viagem_id=42, total_assentos=100, categoria_conforto="ECONOMICA")
    a2 = gerar_assentos_ocupados(viagem_id=42, total_assentos=100, categoria_conforto="ECONOMICA")
    assert a1 == a2

    p1 = gerar_perfis(42, a1[:5], "ECONOMICA")
    p2 = gerar_perfis(42, a1[:5], "ECONOMICA")
    assert p1 == p2

    # Em média (em várias viagens), econômica é mais cheia que executiva e luxo
    media_eco = sum(len(gerar_assentos_ocupados(i, 100, "ECONOMICA")) for i in range(20)) / 20
    media_exe = sum(len(gerar_assentos_ocupados(i, 100, "EXECUTIVA")) for i in range(20)) / 20
    media_lux = sum(len(gerar_assentos_ocupados(i, 100, "LUXO")) for i in range(20)) / 20
    assert media_eco > media_exe > media_lux
