package br.ufjf.nabuus.dto.motor;

import java.util.List;

public record ResultadoCenariosDTO(
    Long viagemId,
    CenarioSimuladoDTO semLumica,
    CenarioSimuladoDTO comLumica,
    List<String> assentosOcupados,
    Integer totalAssentosOcupados
) {
}
