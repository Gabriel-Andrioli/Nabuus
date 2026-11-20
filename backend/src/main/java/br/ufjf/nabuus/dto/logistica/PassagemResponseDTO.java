package br.ufjf.nabuus.dto.logistica;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record PassagemResponseDTO(
    Long id,
    Long viagemId,
    String planetaEmbarqueNome,
    String planetaDesembarqueNome,
    String assentoEscolhido,
    Boolean usaRotaLumica,
    BigDecimal valorPago,
    OffsetDateTime dataCompra,
    String codigoComprovante
) {
}
