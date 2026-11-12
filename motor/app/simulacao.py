"""Orquestração completa de simulação de viagem e detalhamento de rotas."""
from app.config import ANO, ANO_LUZ
from app.fisica.propulsao import AceleracaoConstante
from app.formatacao import distancia_al as fmt_dist, tempo as fmt_tempo
from app.geometria import para_cartesiano
from app.ocupacao import gerar_assentos_ocupados
from app.preco import calcular_preco_final
from app.rotas import (
    DadosRotaLumica,
    PontoPlaneta,
    ResultadoTrajetoria,
    calcular_com_lumica,
    calcular_sem_lumica,
)
from app.schemas import (
    CenarioSimulado,
    PlanetaInput,
    RotaCenarioDTO,
    RotaDetalhadaResponse,
    SimulacaoRequest,
    SimulacaoResponse,
    TextoFormatado,
    TrechoRotaDTO,
)


def _para_ponto(p: PlanetaInput) -> PontoPlaneta:
    pos = para_cartesiano(p.ra, p.dec, p.distanciaSolAnosLuz)
    return PontoPlaneta(
        planeta_id=p.planetaId,
        sistema_id=p.sistemaId,
        pos_al=pos,
        distancia_estrela_ua=p.distanciaEstrelaUA,
        nome=p.nome,
    )


def _formatar_texto(tau_s: float, t_s: float, dist_m: float) -> TextoFormatado:
    divida_s = max(0.0, t_s - tau_s)
    return TextoFormatado(
        duracaoBordo=fmt_tempo(tau_s),
        tempoExterno=fmt_tempo(t_s),
        dividaTemporal=fmt_tempo(divida_s),
        distancia=fmt_dist(dist_m / ANO_LUZ),
    )


def _montar_cenario(
    traj: ResultadoTrajetoria,
    preco_base: float,
    custo_ano_luz: float,
    pedagio: float = 0.0,
) -> CenarioSimulado:
    if not traj.viavel:
        return CenarioSimulado(viavel=False, motivoInviabilidade=traj.motivo_inviabilidade)

    tau_anos = traj.tau_total_s / ANO
    t_anos = traj.t_total_s / ANO
    divida_anos = max(0.0, t_anos - tau_anos)
    dist_al = traj.distancia_total_m / ANO_LUZ
    preco = calcular_preco_final(
        preco_base=preco_base,
        custo_ano_luz=custo_ano_luz,
        distancia_al=dist_al,
        num_paradas=len(traj.paradas_planeta_ids),
        pedagio_lumico=pedagio,
    )
    return CenarioSimulado(
        viavel=True,
        duracaoBordoAnos=round(tau_anos, 6),
        tempoExternoAnos=round(t_anos, 6),
        dividaTemporalAnos=round(divida_anos, 6),
        distanciaAnosLuz=round(dist_al, 6),
        paradas=len(traj.paradas_planeta_ids),
        paradasPlanetaIds=traj.paradas_planeta_ids,
        precoFinal=preco,
        rotaLumicaId=traj.rota_lumica_id,
        texto=_formatar_texto(traj.tau_total_s, traj.t_total_s, traj.distancia_total_m),
    )


def _executar_trajetorias(
    req: SimulacaoRequest,
) -> tuple[ResultadoTrajetoria, ResultadoTrajetoria]:
    origem = _para_ponto(req.origem)
    destino = _para_ponto(req.destino)
    postos = [_para_ponto(p) for p in req.postosRecarga]
    propulsao = AceleracaoConstante(req.nave.aceleracaoG, req.nave.velocidadeCruzeiroC)

    sem_lumica = calcular_sem_lumica(
        origem=origem,
        destino=destino,
        postos=postos,
        autonomia_al=req.nave.autonomiaAnosLuz,
        propulsao=propulsao,
    )
    dados_lumica = (
        DadosRotaLumica(
            id=req.rotaLumica.id,
            velocidade_c=req.rotaLumica.velocidadeC,
            pedagio=req.rotaLumica.pedagio,
            ativa=req.rotaLumica.ativa,
        )
        if req.rotaLumica
        else None
    )
    com_lumica = calcular_com_lumica(
        origem=origem,
        destino=destino,
        autonomia_al=req.nave.autonomiaAnosLuz,
        propulsao_nave=propulsao,
        rota_lumica=dados_lumica,
    )
    return sem_lumica, com_lumica


def simular_viagem(req: SimulacaoRequest) -> SimulacaoResponse:
    traj_sem, traj_com = _executar_trajetorias(req)
    pedagio = req.rotaLumica.pedagio if req.rotaLumica else 0.0

    cenario_sem = _montar_cenario(traj_sem, req.precoBase, req.custoAnoLuz, 0.0)
    cenario_com = _montar_cenario(traj_com, req.precoBase, req.custoAnoLuz, pedagio)
    assentos = gerar_assentos_ocupados(
        req.viagemId, req.nave.totalAssentos, req.nave.categoriaConforto
    )
    return SimulacaoResponse(
        viagemId=req.viagemId,
        semLumica=cenario_sem,
        comLumica=cenario_com,
        assentosOcupados=assentos,
        totalAssentosOcupados=len(assentos),
    )


def _converter_rota(traj: ResultadoTrajetoria) -> RotaCenarioDTO:
    if not traj.viavel:
        return RotaCenarioDTO(viavel=False, motivoInviabilidade=traj.motivo_inviabilidade)
    trechos_dto = []
    for idx, tr in enumerate(traj.trechos, start=1):
        tau_a = tr.tau_s / ANO
        t_a = tr.t_s / ANO
        trechos_dto.append(
            TrechoRotaDTO(
                ordem=idx,
                tipo=tr.tipo,
                origemId=tr.origem_id,
                destinoId=tr.destino_id,
                distanciaAnosLuz=round(tr.distancia_m / ANO_LUZ, 8),
                duracaoBordoAnos=round(tau_a, 6),
                tempoExternoAnos=round(t_a, 6),
                dividaTemporalAnos=round(max(0.0, t_a - tau_a), 6),
                origemPosAnosLuz=tr.origem_pos_al,
                destinoPosAnosLuz=tr.destino_pos_al,
                texto=_formatar_texto(tr.tau_s, tr.t_s, tr.distancia_m),
            )
        )
    return RotaCenarioDTO(
        viavel=True,
        paradasPlanetaIds=traj.paradas_planeta_ids,
        rotaLumicaId=traj.rota_lumica_id,
        trechos=trechos_dto,
    )


def tracar_rotas(req: SimulacaoRequest) -> RotaDetalhadaResponse:
    traj_sem, traj_com = _executar_trajetorias(req)
    return RotaDetalhadaResponse(
        semLumica=_converter_rota(traj_sem),
        comLumica=_converter_rota(traj_com),
    )

