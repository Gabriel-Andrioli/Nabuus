package br.ufjf.nabuus.dto.logistica;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record ViagemPublicarRequestDTO(
    @NotNull Long onibusEspacialId,
    @NotNull Long planetaEmbarqueId,
    @NotNull Long planetaDesembarqueId,
    @NotNull @Future(message = "Data de partida deve estar no futuro.") OffsetDateTime dataPartida,
    @NotNull @PositiveOrZero BigDecimal precoBase,
    @NotNull @PositiveOrZero BigDecimal custoAnoLuz
) {
}
