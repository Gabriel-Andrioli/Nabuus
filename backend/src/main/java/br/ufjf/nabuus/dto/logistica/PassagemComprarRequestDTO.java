package br.ufjf.nabuus.dto.logistica;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PassagemComprarRequestDTO(
    @NotNull Long viagemId,
    @NotBlank String assentoEscolhido,
    @NotNull Boolean usaRotaLumica
) {
}
