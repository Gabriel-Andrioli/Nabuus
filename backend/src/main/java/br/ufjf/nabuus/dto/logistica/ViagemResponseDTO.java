package br.ufjf.nabuus.dto.logistica;

import br.ufjf.nabuus.domain.enums.CategoriaConforto;
import br.ufjf.nabuus.domain.enums.StatusViagem;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record ViagemResponseDTO(
    Long id,
    StatusViagem status,
    OffsetDateTime dataPartida,
    String onibusIdentificacao,
    String propulsaoNome,
    Double velocidadeCruzeiroC,
    Double autonomiaAnosLuz,
    CategoriaConforto categoriaConforto,
    Integer totalAssentos,
    Long planetaEmbarqueId,
    String planetaEmbarqueNome,
    Long planetaDesembarqueId,
    String planetaDesembarqueNome,
    BigDecimal precoBase,
    BigDecimal custoAnoLuz,
    Boolean viavelSemLumica,
    Double duracaoBordoAnosSemLumica,
    Double dividaTemporalAnosSemLumica,
    BigDecimal precoSemLumica,
    Integer paradasReabastecimento,
    Boolean viavelComLumica,
    Double duracaoBordoAnosComLumica,
    Double dividaTemporalAnosComLumica,
    BigDecimal precoComLumica,
    String rota2dJson,
    String assentosOcupadosJson
) {
}
