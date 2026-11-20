package br.ufjf.nabuus.dto.motor;

import java.math.BigDecimal;

public record MotorRotaLumicaDTO(
    Long id,
    Double velocidadeC,
    BigDecimal pedagio,
    Boolean ativa
) {
}
