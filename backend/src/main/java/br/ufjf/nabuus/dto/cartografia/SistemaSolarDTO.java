package br.ufjf.nabuus.dto.cartografia;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record SistemaSolarDTO(
    Long id,
    @NotBlank String nome,
    @NotBlank String estrelaPrincipal,
    @NotNull @DecimalMin("0.0") @DecimalMax("360.0") Double coordenadaRA,
    @NotNull @DecimalMin("-90.0") @DecimalMax("90.0") Double coordenadaDec,
    @NotNull @PositiveOrZero Double distanciaSolAnosLuz
) {
}
