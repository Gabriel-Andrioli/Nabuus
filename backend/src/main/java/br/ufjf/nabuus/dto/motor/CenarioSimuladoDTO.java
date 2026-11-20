package br.ufjf.nabuus.dto.motor;

import java.math.BigDecimal;
import java.util.List;

public record CenarioSimuladoDTO(
    Boolean viavel,
    String motivoInviabilidade,
    Double duracaoBordoAnos,
    Double tempoExternoAnos,
    Double dividaTemporalAnos,
    Double distanciaAnosLuz,
    Integer paradas,
    List<Long> paradasPlanetaIds,
    BigDecimal precoFinal,
    Long rotaLumicaId
) {
}
