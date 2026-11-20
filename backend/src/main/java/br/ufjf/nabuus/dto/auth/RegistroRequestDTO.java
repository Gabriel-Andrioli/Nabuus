package br.ufjf.nabuus.dto.auth;

import br.ufjf.nabuus.domain.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record RegistroRequestDTO(
    @NotBlank String nome,
    @NotBlank @Email String email,
    @NotBlank @Size(min = 6) String senha,
    @NotNull Role role,
    String credencialCientifica,
    String cnpjIntergalactico,
    String razaoSocial,
    String cpf,
    LocalDate dataNascimento
) {
}
