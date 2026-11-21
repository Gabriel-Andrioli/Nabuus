"""API RESTful do Motor de Cálculo Físico do Nabuus.

Utiliza FastAPI quando instalado e faz fallback transparente para Starlette + Pydantic
(mesma pilha ASGI/Uvicorn e mesmo comportamento HTTP 200/422) caso o pacote `fastapi`
ainda não esteja instalado no ambiente local.
"""
import inspect
from typing import Any, Callable

from pydantic import BaseModel, ValidationError

try:
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    _TEM_FASTAPI = True
except ModuleNotFoundError:  # pragma: no cover
    from starlette.applications import Starlette
    from starlette.middleware.cors import CORSMiddleware
    from starlette.requests import Request
    from starlette.responses import JSONResponse
    _TEM_FASTAPI = False

    class FastAPI(Starlette):  # type: ignore[no-redef]
        """Adaptador leve compatível com FastAPI sobre Starlette + Pydantic."""

        def __init__(self, title: str = "", version: str = "1.0.0", description: str = "", **kw: Any):
            super().__init__(**kw)
            self.title = title
            self.version = version
            self.description = description
            self._rotas_sync: dict[tuple[str, str], tuple[Callable, type[BaseModel] | None]] = {}

        def get(self, path: str, **_: Any) -> Callable:
            def decorator(fn: Callable) -> Callable:
                self._rotas_sync[("GET", path)] = (fn, None)

                async def endpoint(_req: Request) -> JSONResponse:
                    return JSONResponse(_serializar(fn()))

                self.add_route(path, endpoint, methods=["GET"])
                return fn
            return decorator

        def post(self, path: str, **_: Any) -> Callable:
            def decorator(fn: Callable) -> Callable:
                sig = inspect.signature(fn)
                param = next(iter(sig.parameters.values()))
                modelo: type[BaseModel] = param.annotation
                self._rotas_sync[("POST", path)] = (fn, modelo)

                async def endpoint(request: Request) -> JSONResponse:
                    try:
                        payload = await request.json()
                        entrada = modelo.model_validate(payload)
                    except ValidationError as exc:
                        return JSONResponse({"detail": exc.errors()}, status_code=422)
                    except Exception as exc:
                        return JSONResponse({"detail": str(exc)}, status_code=400)
                    return JSONResponse(_serializar(fn(entrada)))

                self.add_route(path, endpoint, methods=["POST"])
                return fn
            return decorator

    def _serializar(obj: Any) -> Any:
        if isinstance(obj, BaseModel):
            return obj.model_dump()
        if isinstance(obj, list):
            return [_serializar(x) for x in obj]
        return obj


from app.config import CUSTO_POR_PARADA
from app.ocupacao import gerar_assentos_ocupados, gerar_perfis
from app.preco import sugerir_precos
from app.schemas import (
    CoPassageiroDTO,
    PerfisRequest,
    PerfisResponse,
    RotaDetalhadaResponse,
    SimulacaoRequest,
    SimulacaoResponse,
    SugestaoPrecoRequest,
    SugestaoPrecoResponse,
)
from app.simulacao import simular_viagem, tracar_rotas

app = FastAPI(
    title="Nabuus — Motor de Cálculo Físico",
    version="1.0.0",
    description=(
        "Microsserviço científico para cinemática relativística, roteamento com "
        "autonomia/rotas lúmicas, precificação e geração procedural de passageiros."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Catálogo inicial de referência para o cadastro do Astrônomo (RF-07 / TipoPropulsao)
CATALOGO_PROPULSAO = [
    {
        "codigo": "QUIMICA",
        "nome": "Propulsão Química Convencional",
        "descricao": "Foguetes químicos de alta eficiência; restrita a trechos curtos.",
        "aceleracaoG": 0.001,
        "velocidadeCruzeiroC": 0.0001,
        "autonomiaAnosLuz": 0.5,
        "categoriaConforto": "ECONOMICA",
        "precoBaseReferencia": 15_000_000.0,
        "custoAnoLuzReferencia": 300_000_000.0,
    },
    {
        "codigo": "VELA_SOLAR",
        "nome": "Vela Solar Fotônica",
        "descricao": "Impulsionada por pressão de radiação estelar; baixíssimo custo operacional.",
        "aceleracaoG": 0.0005,
        "velocidadeCruzeiroC": 0.002,
        "autonomiaAnosLuz": 2.0,
        "categoriaConforto": "ECONOMICA",
        "precoBaseReferencia": 30_000_000.0,
        "custoAnoLuzReferencia": 600_000_000.0,
    },
    {
        "codigo": "VELA_LASER",
        "nome": "Vela Impulsionada por Feixe Laser",
        "descricao": "Arranjos orbitais de laser aceleram a vela até frações significativas de c.",
        "aceleracaoG": 0.01,
        "velocidadeCruzeiroC": 0.20,
        "autonomiaAnosLuz": 4.5,
        "categoriaConforto": "EXECUTIVA",
        "precoBaseReferencia": 60_000_000.0,
        "custoAnoLuzReferencia": 1_000_000_000.0,
    },
    {
        "codigo": "FISSAO_PULSADA",
        "nome": "Propulsão Nuclear de Fissão Pulsada",
        "descricao": "Inspirada no Projeto Orion; alto empuxo e boa autonomia.",
        "aceleracaoG": 0.05,
        "velocidadeCruzeiroC": 0.03,
        "autonomiaAnosLuz": 5.0,
        "categoriaConforto": "ECONOMICA",
        "precoBaseReferencia": 45_000_000.0,
        "custoAnoLuzReferencia": 800_000_000.0,
    },
    {
        "codigo": "FUSAO",
        "nome": "Propulsor Termonuclear de Fusão (D-He3)",
        "descricao": "Inspirado no Projeto Daedalus; equilíbrio entre velocidade e alcance.",
        "aceleracaoG": 0.05,
        "velocidadeCruzeiroC": 0.12,
        "autonomiaAnosLuz": 8.0,
        "categoriaConforto": "EXECUTIVA",
        "precoBaseReferencia": 80_000_000.0,
        "custoAnoLuzReferencia": 1_200_000_000.0,
    },
    {
        "codigo": "ANTIMATERIA",
        "nome": "Aniquilação Matéria-Antimatéria Catalisada",
        "descricao": "Tecnologia de ponta sub-lúmica; máximo conforto, velocidade e alcance.",
        "aceleracaoG": 1.0,
        "velocidadeCruzeiroC": 0.40,
        "autonomiaAnosLuz": 15.0,
        "categoriaConforto": "LUXO",
        "precoBaseReferencia": 120_000_000.0,
        "custoAnoLuzReferencia": 2_000_000_000.0,
    },
]


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/v1/propulsoes")
def listar_propulsoes() -> list[dict]:
    return CATALOGO_PROPULSAO


@app.post("/v1/viagens/simular", response_model=SimulacaoResponse)
def endpoint_simular_viagem(req: SimulacaoRequest) -> SimulacaoResponse:
    return simular_viagem(req)


@app.post("/v1/rotas/tracar", response_model=RotaDetalhadaResponse)
def endpoint_tracar_rotas(req: SimulacaoRequest) -> RotaDetalhadaResponse:
    return tracar_rotas(req)


@app.post("/v1/precos/sugerir", response_model=SugestaoPrecoResponse)
def endpoint_sugerir_precos(req: SugestaoPrecoRequest) -> SugestaoPrecoResponse:
    base, custo_al = sugerir_precos(
        req.precoBaseReferencia, req.custoAnoLuzReferencia, req.categoriaConforto
    )
    return SugestaoPrecoResponse(
        precoBaseSugerido=base,
        custoAnoLuzSugerido=custo_al,
        custoPorParada=CUSTO_POR_PARADA,
    )


@app.post("/v1/ocupacao/perfis", response_model=PerfisResponse)
def endpoint_perfis(req: PerfisRequest) -> PerfisResponse:
    assentos = (
        req.assentosOcupados
        if req.assentosOcupados is not None
        else gerar_assentos_ocupados(req.viagemId, req.totalAssentos, req.categoriaConforto)
    )
    perfis = [
        CoPassageiroDTO(**p)
        for p in gerar_perfis(req.viagemId, assentos, req.categoriaConforto)
    ]
    return PerfisResponse(
        viagemId=req.viagemId,
        assentosOcupados=assentos,
        coPassageiros=perfis,
    )
