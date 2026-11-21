package br.ufjf.nabuus.dto.auth;

import br.ufjf.nabuus.domain.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record RegistroRequestDTO(
    @NotBlank @Size(max = 120) String nome,
    @NotBlank @Email String email,
    @NotBlank @Size(min = 6, max = 72) String senha,
    @NotNull Role role,
    String credencialCientifica,
    String cnpjIntergalactico,
    @Size(max = 120) String razaoSocial,
    String cpf,
    @Past(message = "Data de nascimento deve estar no passado.") LocalDate dataNascimento
) {
}
