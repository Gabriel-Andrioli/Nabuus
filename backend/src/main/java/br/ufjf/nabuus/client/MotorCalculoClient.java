package br.ufjf.nabuus.client;

import br.ufjf.nabuus.dto.motor.ResultadoCenariosDTO;
import br.ufjf.nabuus.dto.motor.RotaDetalhadaResponseDTO;
import br.ufjf.nabuus.dto.motor.SimulacaoRequestDTO;
import br.ufjf.nabuus.dto.motor.SugestaoPrecoRequestDTO;
import br.ufjf.nabuus.dto.motor.SugestaoPrecoResponseDTO;

public interface MotorCalculoClient {
    ResultadoCenariosDTO simularViagem(SimulacaoRequestDTO request);
    SugestaoPrecoResponseDTO sugerirPreco(SugestaoPrecoRequestDTO request);
    RotaDetalhadaResponseDTO tracarRota(SimulacaoRequestDTO request);
}
