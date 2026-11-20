package br.ufjf.nabuus.dto.motor;

import com.fasterxml.jackson.databind.JsonNode;

public record RotaDetalhadaResponseDTO(
    JsonNode semLumica,
    JsonNode comLumica
) {
}
