package br.ufjf.nabuus.dto.cartografia;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record SistemaSolarDTO(
    Long id,
    @NotBlank String nome,
    @NotBlank String estrelaPrincipal,
    @NotNull Double coordenadaRA,
    @NotNull Double coordenadaDec,
    @NotNull @PositiveOrZero Double distanciaSolAnosLuz
) {
}
