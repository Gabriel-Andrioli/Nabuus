package br.ufjf.nabuus.client;

import br.ufjf.nabuus.dto.motor.ResultadoCenariosDTO;
import br.ufjf.nabuus.dto.motor.RotaDetalhadaResponseDTO;
import br.ufjf.nabuus.dto.motor.SimulacaoRequestDTO;
import br.ufjf.nabuus.dto.motor.SugestaoPrecoRequestDTO;
import br.ufjf.nabuus.dto.motor.SugestaoPrecoResponseDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class MotorCalculoRestClient implements MotorCalculoClient {

    private final RestClient restClient;

    public MotorCalculoRestClient(
        RestClient.Builder restClientBuilder,
        @Value("${nabuus.motor.base-url}") String baseUrl
    ) {
        this.restClient = restClientBuilder.baseUrl(baseUrl).build();
    }

    @Override
    public ResultadoCenariosDTO simularViagem(SimulacaoRequestDTO request) {
        return restClient.post()
            .uri("/viagens/simular")
            .contentType(MediaType.APPLICATION_JSON)
            .body(request)
            .retrieve()
            .body(ResultadoCenariosDTO.class);
    }

    @Override
    public SugestaoPrecoResponseDTO sugerirPreco(SugestaoPrecoRequestDTO request) {
        return restClient.post()
            .uri("/precos/sugerir")
            .contentType(MediaType.APPLICATION_JSON)
            .body(request)
            .retrieve()
            .body(SugestaoPrecoResponseDTO.class);
    }

    @Override
    public RotaDetalhadaResponseDTO tracarRota(SimulacaoRequestDTO request) {
        return restClient.post()
            .uri("/rotas/tracar")
            .contentType(MediaType.APPLICATION_JSON)
            .body(request)
            .retrieve()
            .body(RotaDetalhadaResponseDTO.class);
    }
}
