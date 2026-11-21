package br.ufjf.nabuus.dto.logistica;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record OnibusEspacialDTO(
    Long id,
    @NotBlank @Size(max = 100) String identificacao,
    @NotNull Long tipoPropulsaoId,
    String tipoPropulsaoNome,
    @NotNull @Positive @Max(200) Integer totalAssentos,
    Boolean ativo
) {
}
