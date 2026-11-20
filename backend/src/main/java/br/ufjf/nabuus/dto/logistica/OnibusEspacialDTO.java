package br.ufjf.nabuus.dto.logistica;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record OnibusEspacialDTO(
    Long id,
    @NotBlank String identificacao,
    @NotNull Long tipoPropulsaoId,
    String tipoPropulsaoNome,
    @NotNull @Positive Integer totalAssentos,
    Boolean ativo
) {
}
