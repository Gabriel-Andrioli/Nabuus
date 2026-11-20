package br.ufjf.nabuus.dto.cartografia;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

public record PlanetaDTO(
    Long id,
    @NotNull Long sistemaSolarId,
    String sistemaSolarNome,
    @NotBlank String nome,
    @NotNull @Positive Double raioBase,
    @NotNull @Positive Double massaBase,
    @NotNull Boolean zonaHabitavel,
    @NotNull @PositiveOrZero Double distanciaEstrelaUA,
    @NotNull Boolean possuiPostoRecarga,
    String descricaoNabuus
) {
}
