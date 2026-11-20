package br.ufjf.nabuus.dto.motor;

import java.math.BigDecimal;

public record SugestaoPrecoResponseDTO(
    BigDecimal precoBaseSugerido,
    BigDecimal custoAnoLuzSugerido,
    BigDecimal custoPorParada
) {
}
