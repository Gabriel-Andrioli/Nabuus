package br.ufjf.nabuus.dto.logistica;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record PassagemComprarRequestDTO(
    @NotNull Long viagemId,
    @NotBlank @Pattern(regexp = "^\\d{2}[A-Z]$", message = "Formato de assento inválido (ex.: 01A).") String assentoEscolhido,
    @NotNull Boolean usaRotaLumica,
    String alimentacao
) {
    public PassagemComprarRequestDTO(Long viagemId, String assentoEscolhido, Boolean usaRotaLumica) {
        this(viagemId, assentoEscolhido, usaRotaLumica, null);
    }
}
