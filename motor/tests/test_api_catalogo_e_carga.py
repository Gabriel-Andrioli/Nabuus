"""Testes de API, integração com CSV real (`nabuus_planetas.csv`) e carga (RNF-04)."""
import csv
from dataclasses import dataclass
from pathlib import Path
import random
import time
from typing import Any

from pydantic import BaseModel, ValidationError

from app.main import app


@dataclass
class _Resposta:
    status_code: int
    _dados: Any

    def json(self) -> Any:
        return self._dados


class _ClienteLocal:
    """Cliente síncrono leve que executa os handlers e validações Pydantic da API."""

    def __init__(self, asgi_app: Any):
        self._app = asgi_app

    def get(self, path: str) -> _Resposta:
        fn, _ = self._app._rotas_sync[("GET", path)]
        res = fn()
        return _Resposta(200, res.model_dump() if isinstance(res, BaseModel) else res)

    def post(self, path: str, json: dict) -> _Resposta:
        fn, modelo = self._app._rotas_sync[("POST", path)]
        try:
            entrada = modelo.model_validate(json)
        except ValidationError as exc:
            return _Resposta(422, {"detail": exc.errors()})
        res = fn(entrada)
        return _Resposta(200, res.model_dump() if isinstance(res, BaseModel) else res)


if hasattr(app, "_rotas_sync"):
    client = _ClienteLocal(app)
else:
    from fastapi.testclient import TestClient

    client = TestClient(app)

CSV_PATH = Path(__file__).resolve().parents[2] / "data" / "nabuus_planetas.csv"


def _carregar_planetas_csv() -> list[dict]:
    with CSV_PATH.open(encoding="utf-8") as f:
        linhas = list(csv.DictReader(f))
    sistemas: dict[str, int] = {}
    planetas = []
    for row in linhas:
        nome_sis = row["sistema"]
        if nome_sis not in sistemas:
            sistemas[nome_sis] = len(sistemas)
        planetas.append(
            {
                "planetaId": int(row["id"]),
                "nome": row["nome"],
                "sistema": nome_sis,
                "sistemaId": sistemas[nome_sis],
                "ra": float(row["ra_graus"]) if row["ra_graus"] else 0.0,
                "dec": float(row["dec_graus"]) if row["dec_graus"] else 0.0,
                "distanciaSolAnosLuz": float(row["distancia_sol_anos_luz"]),
                "distanciaEstrelaUA": float(row["distancia_estrela_UA"]),
                "zonaHabitavel": row["zona_habitavel"] == "True",
            }
        )
    return planetas


def test_endpoints_basicos_e_validacao():
    r = client.get("/health")
    assert r.status_code == 200 and r.json()["status"] == "ok"

    prop = client.get("/v1/propulsoes")
    assert prop.status_code == 200
    assert len(prop.json()) >= 6
    assert all(item["precoBaseReferencia"] >= 15_000_000.0 for item in prop.json())

    sug = client.post(
        "/v1/precos/sugerir",
        json={
            "precoBaseReferencia": 1000.0,
            "custoAnoLuzReferencia": 250.0,
            "categoriaConforto": "EXECUTIVA",
        },
    )
    assert sug.status_code == 200
    assert sug.json()["precoBaseSugerido"] == 1800.0

    # Velocidade acima de 0,4c para nave deve retornar 422
    invalido = client.post(
        "/v1/viagens/simular",
        json={
            "viagemId": 1,
            "origem": {"planetaId": 1, "sistemaId": 0},
            "destino": {"planetaId": 2, "sistemaId": 1, "distanciaSolAnosLuz": 4.2},
            "nave": {
                "aceleracaoG": 0.1,
                "velocidadeCruzeiroC": 0.9,
                "autonomiaAnosLuz": 5.0,
                "categoriaConforto": "ECONOMICA",
                "totalAssentos": 40,
            },
            "precoBase": 1000.0,
            "custoAnoLuz": 100.0,
        },
    )
    assert invalido.status_code == 422


def test_integracao_catalogo_real_terra_para_trappist1e():
    """Simula viagem real do catálogo: Terra → TRAPPIST-1 e (~40,66 al) com paradas em estrelas reais."""
    planetas = _carregar_planetas_csv()
    terra = next(p for p in planetas if p["planetaId"] == 3)
    trappist_e = next(p for p in planetas if "TRAPPIST-1 e" in p["nome"])

    # Habilita um posto de recarga no 1º planeta de cada sistema intermediário
    vistos = set()
    postos = []
    for p in planetas:
        if p["sistemaId"] not in vistos:
            vistos.add(p["sistemaId"])
            postos.append(p)

    payload = {
        "viagemId": 101,
        "origem": terra,
        "destino": trappist_e,
        "nave": {
            "aceleracaoG": 0.05,
            "velocidadeCruzeiroC": 0.12,
            "autonomiaAnosLuz": 35.0,
            "categoriaConforto": "EXECUTIVA",
            "totalAssentos": 80,
        },
        "precoBase": 4200.0,
        "custoAnoLuz": 750.0,
        "postosRecarga": postos,
        "rotaLumica": {"id": 5, "velocidadeC": 0.85, "pedagio": 120_000.0, "ativa": True},
    }

    r = client.post("/v1/viagens/simular", json=payload)
    assert r.status_code == 200
    dados = r.json()

    sem = dados["semLumica"]
    com = dados["comLumica"]
    assert sem["viavel"] and com["viavel"]
    assert sem["paradas"] >= 1
    assert com["paradas"] == 0
    # Com rota lúmica é mais rápida a bordo, porém mais cara e com maior dívida temporal
    assert com["duracaoBordoAnos"] < sem["duracaoBordoAnos"]
    assert com["dividaTemporalAnos"] > sem["dividaTemporalAnos"]
    assert com["precoFinal"] > sem["precoFinal"]

    # Testa detalhamento da rota para o mapa galáctico (RF-17) e perfis (RF-15)
    rota = client.post("/v1/rotas/tracar", json=payload)
    assert rota.status_code == 200
    assert len(rota.json()["semLumica"]["trechos"]) == sem["paradas"] + 1
    assert len(rota.json()["comLumica"]["trechos"]) == 3

    perfis = client.post(
        "/v1/ocupacao/perfis",
        json={
            "viagemId": 101,
            "categoriaConforto": "EXECUTIVA",
            "assentosOcupados": dados["assentosOcupados"],
        },
    )
    assert perfis.status_code == 200
    assert len(perfis.json()["coPassageiros"]) == dados["totalAssentosOcupados"]


def test_desempenho_5000_sistemas_abaixo_de_3_segundos():
    """RNF-04 / RNF-08: roteamento sobre 5 000 sistemas deve responder em < 3 s."""
    rng = random.Random(2026)
    postos = [
        {
            "planetaId": i,
            "sistemaId": i,
            "ra": rng.uniform(0.0, 360.0),
            "dec": rng.uniform(-30.0, 30.0),
            "distanciaSolAnosLuz": rng.uniform(1.0, 160.0),
            "distanciaEstrelaUA": 1.0,
        }
        for i in range(1, 5001)
    ]
    payload = {
        "viagemId": 999,
        "origem": {"planetaId": 0, "sistemaId": 0, "distanciaSolAnosLuz": 0.0, "distanciaEstrelaUA": 1.0},
        "destino": {
            "planetaId": 9999,
            "sistemaId": 9999,
            "ra": 180.0,
            "dec": 0.0,
            "distanciaSolAnosLuz": 150.0,
            "distanciaEstrelaUA": 1.0,
        },
        "nave": {
            "aceleracaoG": 0.2,
            "velocidadeCruzeiroC": 0.3,
            "autonomiaAnosLuz": 25.0,
            "categoriaConforto": "ECONOMICA",
            "totalAssentos": 120,
        },
        "precoBase": 2000.0,
        "custoAnoLuz": 300.0,
        "postosRecarga": postos,
    }

    t0 = time.perf_counter()
    r = client.post("/v1/viagens/simular", json=payload)
    decorrido = time.perf_counter() - t0

    assert r.status_code == 200
    assert r.json()["semLumica"]["viavel"] is True
    assert decorrido < 3.0, f"Tempo excedeu 3s: {decorrido:.3f}s"
