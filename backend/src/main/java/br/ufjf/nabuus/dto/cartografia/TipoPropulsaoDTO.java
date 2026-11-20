package br.ufjf.nabuus.dto.cartografia;

import br.ufjf.nabuus.domain.enums.CategoriaConforto;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;

public record TipoPropulsaoDTO(
    Long id,
    @NotBlank String codigo,
    @NotBlank String nome,
    @NotNull @Positive Double aceleracaoG,
    @NotNull @Positive @DecimalMax("0.4") Double velocidadeCruzeiroC,
    @NotNull @Positive Double autonomiaAnosLuz,
    @NotNull CategoriaConforto categoriaConforto,
    @NotNull @PositiveOrZero BigDecimal precoBaseReferencia,
    @NotNull @PositiveOrZero BigDecimal custoAnoLuzReferencia
) {
}
