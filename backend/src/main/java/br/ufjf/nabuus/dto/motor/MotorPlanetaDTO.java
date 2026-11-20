package br.ufjf.nabuus.dto.motor;

public record MotorPlanetaDTO(
    Long planetaId,
    Long sistemaId,
    Double ra,
    Double dec,
    Double distanciaSolAnosLuz,
    Double distanciaEstrelaUA,
    String nome
) {
}
