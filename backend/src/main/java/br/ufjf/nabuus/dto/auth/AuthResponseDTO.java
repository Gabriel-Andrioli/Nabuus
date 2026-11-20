package br.ufjf.nabuus.dto.auth;

import br.ufjf.nabuus.domain.enums.Role;
import java.util.UUID;

public record AuthResponseDTO(
    UUID id,
    String nome,
    String email,
    Role role,
    String token
) {
}
