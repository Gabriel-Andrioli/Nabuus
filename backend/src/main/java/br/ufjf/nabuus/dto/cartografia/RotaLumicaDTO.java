package br.ufjf.nabuus.dto.cartografia;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;

public record RotaLumicaDTO(
    Long id,
    @NotNull Long sistemaOrigemId,
    String sistemaOrigemNome,
    @NotNull Long sistemaDestinoId,
    String sistemaDestinoNome,
    @NotNull @DecimalMin("0.01") @DecimalMax("0.99") Double velocidadeC,
    @NotNull @PositiveOrZero BigDecimal pedagio,
    @NotNull Boolean ativa
) {
}
