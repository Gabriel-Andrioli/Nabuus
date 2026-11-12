"""Contratos de entrada e saída (Pydantic) da API do motor físico."""
from typing import Literal
from pydantic import BaseModel, Field, model_validator

from app.config import BETA_MAX_NAVE

CategoriaConforto = Literal["ECONOMICA", "EXECUTIVA", "LUXO"]


class PlanetaInput(BaseModel):
    planetaId: int
    sistemaId: int
    ra: float = Field(0.0, description="Ascensão reta em graus [0, 360)")
    dec: float = Field(0.0, description="Declinação em graus [-90, 90]")
    distanciaSolAnosLuz: float = Field(0.0, ge=0.0)
    distanciaEstrelaUA: float = Field(0.0, ge=0.0)
    nome: str = ""


class SistemaInput(BaseModel):
    """Formato alternativo agrupado por sistema solar."""
    id: int
    ra: float = 0.0
    dec: float = 0.0
    distanciaSolAnosLuz: float = Field(0.0, ge=0.0)
    planetasComPosto: list[int] = Field(default_factory=list)


class NaveInput(BaseModel):
    aceleracaoG: float = Field(..., gt=0.0, description="Aceleração própria em múltiplos de g")
    velocidadeCruzeiroC: float = Field(
        ..., gt=0.0, le=BETA_MAX_NAVE, description="Velocidade de cruzeiro em fração de c"
    )
    autonomiaAnosLuz: float = Field(..., gt=0.0, description="Alcance máximo entre recargas [al]")
    categoriaConforto: CategoriaConforto = "ECONOMICA"
    totalAssentos: int = Field(40, ge=1, le=2000)


class RotaLumicaInput(BaseModel):
    id: int
    velocidadeC: float = Field(..., gt=0.0, lt=1.0)
    pedagio: float = Field(..., ge=0.0)
    ativa: bool = True


class SimulacaoRequest(BaseModel):
    viagemId: int = 1
    origem: PlanetaInput
    destino: PlanetaInput
    nave: NaveInput
    precoBase: float = Field(..., ge=0.0)
    custoAnoLuz: float = Field(..., ge=0.0)
    postosRecarga: list[PlanetaInput] = Field(default_factory=list)
    sistemas: list[SistemaInput] = Field(default_factory=list)
    rotaLumica: RotaLumicaInput | None = None

    @model_validator(mode="after")
    def _normalizar_sistemas(self) -> "SimulacaoRequest":
        """Se o Java enviar `sistemas`, preenche coordenadas e postos automaticamente."""
        if not self.sistemas:
            return self
        mapa = {s.id: s for s in self.sistemas}
        for p in (self.origem, self.destino):
            if p.sistemaId in mapa and p.distanciaSolAnosLuz == 0.0 and p.ra == 0.0 and p.dec == 0.0:
                s = mapa[p.sistemaId]
                p.ra = s.ra
                p.dec = s.dec
                p.distanciaSolAnosLuz = s.distanciaSolAnosLuz
        if not self.postosRecarga:
            postos: list[PlanetaInput] = []
            for s in self.sistemas:
                for pid in s.planetasComPosto:
                    postos.append(
                        PlanetaInput(
                            planetaId=pid,
                            sistemaId=s.id,
                            ra=s.ra,
                            dec=s.dec,
                            distanciaSolAnosLuz=s.distanciaSolAnosLuz,
                        )
                    )
            self.postosRecarga = postos
        return self


class TextoFormatado(BaseModel):
    duracaoBordo: str
    tempoExterno: str
    dividaTemporal: str
    distancia: str


class CenarioSimulado(BaseModel):
    viavel: bool
    motivoInviabilidade: str | None = None
    duracaoBordoAnos: float = 0.0
    tempoExternoAnos: float = 0.0
    dividaTemporalAnos: float = 0.0
    distanciaAnosLuz: float = 0.0
    paradas: int = 0
    paradasPlanetaIds: list[int] = Field(default_factory=list)
    precoFinal: float = 0.0
    rotaLumicaId: int | None = None
    texto: TextoFormatado | None = None


class SimulacaoResponse(BaseModel):
    viagemId: int
    semLumica: CenarioSimulado
    comLumica: CenarioSimulado
    assentosOcupados: list[str]
    totalAssentosOcupados: int


class TrechoRotaDTO(BaseModel):
    ordem: int
    tipo: str
    origemId: int
    destinoId: int
    distanciaAnosLuz: float
    duracaoBordoAnos: float
    tempoExternoAnos: float
    dividaTemporalAnos: float
    origemPosAnosLuz: tuple[float, float, float]
    destinoPosAnosLuz: tuple[float, float, float]
    texto: TextoFormatado


class RotaCenarioDTO(BaseModel):
    viavel: bool
    motivoInviabilidade: str | None = None
    paradasPlanetaIds: list[int] = Field(default_factory=list)
    rotaLumicaId: int | None = None
    trechos: list[TrechoRotaDTO] = Field(default_factory=list)


class RotaDetalhadaResponse(BaseModel):
    semLumica: RotaCenarioDTO
    comLumica: RotaCenarioDTO


class SugestaoPrecoRequest(BaseModel):
    precoBaseReferencia: float = Field(..., ge=0.0)
    custoAnoLuzReferencia: float = Field(..., ge=0.0)
    categoriaConforto: CategoriaConforto = "ECONOMICA"


class SugestaoPrecoResponse(BaseModel):
    precoBaseSugerido: float
    custoAnoLuzSugerido: float
    custoPorParada: float


class PerfisRequest(BaseModel):
    viagemId: int
    categoriaConforto: CategoriaConforto = "ECONOMICA"
    assentosOcupados: list[str] | None = None
    totalAssentos: int = Field(40, ge=1, le=2000)


class CoPassageiroDTO(BaseModel):
    poltrona: str
    nomeGerado: str
    tracoPersonalidade: str


class PerfisResponse(BaseModel):
    viagemId: int
    assentosOcupados: list[str]
    coPassageiros: list[CoPassageiroDTO]

