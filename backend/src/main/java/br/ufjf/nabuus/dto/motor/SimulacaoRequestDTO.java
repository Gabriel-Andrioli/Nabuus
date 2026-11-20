package br.ufjf.nabuus.dto.motor;

import java.math.BigDecimal;
import java.util.List;

public record SimulacaoRequestDTO(
    Long viagemId,
    MotorPlanetaDTO origem,
    MotorPlanetaDTO destino,
    MotorNaveDTO nave,
    BigDecimal precoBase,
    BigDecimal custoAnoLuz,
    List<MotorPlanetaDTO> postosRecarga,
    MotorRotaLumicaDTO rotaLumica
) {
}
