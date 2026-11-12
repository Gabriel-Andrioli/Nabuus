"""Cálculo de trajetória nos cenários sem e com rota lúmica."""
from dataclasses import dataclass, field
import numpy as np
from scipy.spatial import cKDTree

from app.config import ANO_LUZ, UA
from app.fisica.propulsao import Propulsao, PropulsaoLumica
from app.geometria import distancia


@dataclass(frozen=True)
class PontoPlaneta:
    planeta_id: int
    sistema_id: int
    pos_al: tuple[float, float, float]
    distancia_estrela_ua: float = 0.0
    nome: str = ""


@dataclass(frozen=True)
class DadosRotaLumica:
    id: int
    velocidade_c: float
    pedagio: float
    ativa: bool = True


@dataclass
class TrechoCalculado:
    tipo: str                  # "PROPULSADO" | "LUMICO" | "INTRASISTEMA"
    origem_id: int
    destino_id: int
    distancia_m: float
    tau_s: float
    t_s: float
    origem_pos_al: tuple[float, float, float]
    destino_pos_al: tuple[float, float, float]


@dataclass
class ResultadoTrajetoria:
    viavel: bool
    motivo_inviabilidade: str | None = None
    tau_total_s: float = 0.0
    t_total_s: float = 0.0
    distancia_total_m: float = 0.0
    paradas_planeta_ids: list[int] = field(default_factory=list)
    trechos: list[TrechoCalculado] = field(default_factory=list)
    rota_lumica_id: int | None = None


def calcular_sem_lumica(
    origem: PontoPlaneta,
    destino: PontoPlaneta,
    postos: list[PontoPlaneta],
    autonomia_al: float,
    propulsao: Propulsao,
) -> ResultadoTrajetoria:
    """Trajetória direta planeta→planeta com paradas gulosas no posto mais avançado."""
    if origem.planeta_id == destino.planeta_id:
        return ResultadoTrajetoria(viavel=True)

    # Viagem dentro do mesmo sistema solar
    if origem.sistema_id == destino.sistema_id:
        dist_m = abs(origem.distancia_estrela_ua - destino.distancia_estrela_ua) * UA
        if dist_m > autonomia_al * ANO_LUZ:
            return ResultadoTrajetoria(False, "Autonomia insuficiente para o trecho intrasistema")
        tau, t = propulsao.salto(dist_m)
        return ResultadoTrajetoria(
            viavel=True,
            tau_total_s=tau,
            t_total_s=t,
            distancia_total_m=dist_m,
            trechos=[
                TrechoCalculado(
                    "INTRASISTEMA", origem.planeta_id, destino.planeta_id,
                    dist_m, tau, t, origem.pos_al, destino.pos_al,
                )
            ],
        )

    # Filtra postos (um por sistema basta; ignora origem/destino)
    candidatos = [
        p for p in postos
        if p.sistema_id != origem.sistema_id and p.sistema_id != destino.sistema_id
    ]
    arvore = cKDTree([p.pos_al for p in candidatos]) if candidatos else None

    atual = origem
    dist_atual_dest = distancia(atual.pos_al, destino.pos_al)
    paradas: list[int] = []
    trechos: list[TrechoCalculado] = []
    visitados = {origem.sistema_id}

    while dist_atual_dest > autonomia_al:
        if arvore is None:
            return ResultadoTrajetoria(
                False, "Autonomia insuficiente e não há postos de recarga disponíveis"
            )
        idxs = arvore.query_ball_point(atual.pos_al, r=autonomia_al)
        melhor: PontoPlaneta | None = None
        melhor_chave: tuple[float, int] | None = None

        for i in idxs:
            cand = candidatos[i]
            if cand.sistema_id in visitados:
                continue
            d_dest = distancia(cand.pos_al, destino.pos_al)
            if d_dest < dist_atual_dest:
                chave = (d_dest, cand.planeta_id)
                if melhor_chave is None or chave < melhor_chave:
                    melhor_chave = chave
                    melhor = cand

        if melhor is None:
            return ResultadoTrajetoria(
                False,
                "Autonomia insuficiente: nenhum posto de recarga alcançável aproxima do destino",
            )

        dist_salto_m = distancia(atual.pos_al, melhor.pos_al) * ANO_LUZ
        tau, t = propulsao.salto(dist_salto_m)
        trechos.append(
            TrechoCalculado(
                "PROPULSADO", atual.planeta_id, melhor.planeta_id,
                dist_salto_m, tau, t, atual.pos_al, melhor.pos_al,
            )
        )
        paradas.append(melhor.planeta_id)
        visitados.add(melhor.sistema_id)
        atual = melhor
        dist_atual_dest = melhor_chave[0]

    dist_final_m = dist_atual_dest * ANO_LUZ
    tau, t = propulsao.salto(dist_final_m)
    trechos.append(
        TrechoCalculado(
            "PROPULSADO", atual.planeta_id, destino.planeta_id,
            dist_final_m, tau, t, atual.pos_al, destino.pos_al,
        )
    )

    return ResultadoTrajetoria(
        viavel=True,
        tau_total_s=sum(tr.tau_s for tr in trechos),
        t_total_s=sum(tr.t_s for tr in trechos),
        distancia_total_m=sum(tr.distancia_m for tr in trechos),
        paradas_planeta_ids=paradas,
        trechos=trechos,
    )


def calcular_com_lumica(
    origem: PontoPlaneta,
    destino: PontoPlaneta,
    autonomia_al: float,
    propulsao_nave: Propulsao,
    rota_lumica: DadosRotaLumica | None,
) -> ResultadoTrajetoria:
    """Trajetória planeta→estrela→(rota lúmica)→estrela→planeta."""
    if origem.sistema_id == destino.sistema_id:
        return ResultadoTrajetoria(False, "Rota lúmica não se aplica a viagens no mesmo sistema")
    if rota_lumica is None or not rota_lumica.ativa:
        return ResultadoTrajetoria(False, "Não há rota lúmica ativa entre os sistemas")

    d_saida_m = origem.distancia_estrela_ua * UA
    d_chegada_m = destino.distancia_estrela_ua * UA
    autonomia_m = autonomia_al * ANO_LUZ
    if d_saida_m > autonomia_m or d_chegada_m > autonomia_m:
        return ResultadoTrajetoria(False, "Autonomia insuficiente para alcançar o portal na estrela")

    d_lumica_m = distancia(origem.pos_al, destino.pos_al) * ANO_LUZ
    tau1, t1 = propulsao_nave.salto(d_saida_m)
    tau2, t2 = PropulsaoLumica(rota_lumica.velocidade_c).salto(d_lumica_m)
    tau3, t3 = propulsao_nave.salto(d_chegada_m)

    trechos = [
        TrechoCalculado(
            "INTRASISTEMA", origem.planeta_id, -origem.sistema_id,
            d_saida_m, tau1, t1, origem.pos_al, origem.pos_al,
        ),
        TrechoCalculado(
            "LUMICO", -origem.sistema_id, -destino.sistema_id,
            d_lumica_m, tau2, t2, origem.pos_al, destino.pos_al,
        ),
        TrechoCalculado(
            "INTRASISTEMA", -destino.sistema_id, destino.planeta_id,
            d_chegada_m, tau3, t3, destino.pos_al, destino.pos_al,
        ),
    ]
    return ResultadoTrajetoria(
        viavel=True,
        tau_total_s=tau1 + tau2 + tau3,
        t_total_s=t1 + t2 + t3,
        distancia_total_m=d_saida_m + d_lumica_m + d_chegada_m,
        paradas_planeta_ids=[],
        trechos=trechos,
        rota_lumica_id=rota_lumica.id,
    )

