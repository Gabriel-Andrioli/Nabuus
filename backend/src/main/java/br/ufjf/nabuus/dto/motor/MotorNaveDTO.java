package br.ufjf.nabuus.dto.motor;

import br.ufjf.nabuus.domain.enums.CategoriaConforto;

public record MotorNaveDTO(
    Double aceleracaoG,
    Double velocidadeCruzeiroC,
    Double autonomiaAnosLuz,
    CategoriaConforto categoriaConforto,
    Integer totalAssentos
) {
}
