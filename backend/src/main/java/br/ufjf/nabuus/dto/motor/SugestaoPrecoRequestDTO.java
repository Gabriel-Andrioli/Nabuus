package br.ufjf.nabuus.dto.motor;

import br.ufjf.nabuus.domain.enums.CategoriaConforto;
import java.math.BigDecimal;

public record SugestaoPrecoRequestDTO(
    BigDecimal precoBaseReferencia,
    BigDecimal custoAnoLuzReferencia,
    CategoriaConforto categoriaConforto
) {
}
