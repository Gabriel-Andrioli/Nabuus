package br.ufjf.nabuus.client;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import br.ufjf.nabuus.domain.enums.CategoriaConforto;
import br.ufjf.nabuus.dto.motor.SugestaoPrecoRequestDTO;
import br.ufjf.nabuus.dto.motor.SugestaoPrecoResponseDTO;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.client.RestClientTest;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.client.MockRestServiceServer;
import java.math.BigDecimal;

@RestClientTest(MotorCalculoRestClient.class)
@ActiveProfiles("test")
class MotorCalculoRestClientTest {

    @Autowired
    private MotorCalculoRestClient client;

    @Autowired
    private MockRestServiceServer server;

    @Test
    void deveRetornarSugestaoDePreco_quandoMotorFisicoResponderComSucesso() {
        String respostaJson = """
            {
              "precoBaseSugerido": 1800.00,
              "custoAnoLuzSugerido": 450.00,
              "custoPorParada": 2000.00
            }
            """;
        server.expect(requestTo("http://localhost:8001/v1/precos/sugerir"))
            .andExpect(method(HttpMethod.POST))
            .andRespond(withSuccess(respostaJson, MediaType.APPLICATION_JSON));

        SugestaoPrecoResponseDTO resposta = client.sugerirPreco(
            new SugestaoPrecoRequestDTO(
                new BigDecimal("1000.00"),
                new BigDecimal("250.00"),
                CategoriaConforto.EXECUTIVA
            )
        );

        assertThat(resposta.precoBaseSugerido()).isEqualByComparingTo("1800.00");
        assertThat(resposta.custoAnoLuzSugerido()).isEqualByComparingTo("450.00");
        server.verify();
    }
}
