package br.ufjf.nabuus.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.ufjf.nabuus.domain.enums.CategoriaConforto;
import br.ufjf.nabuus.domain.enums.StatusViagem;
import br.ufjf.nabuus.dto.logistica.ViagemResponseDTO;
import br.ufjf.nabuus.security.JwtAuthenticationFilter;
import br.ufjf.nabuus.security.JwtService;
import br.ufjf.nabuus.security.UsuarioDetailsService;
import br.ufjf.nabuus.service.ViagemService;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(ViagemController.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class ViagemControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ViagemService viagemService;

    @MockitoBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UsuarioDetailsService usuarioDetailsService;

    @Test
    void deveRetornarListaDeViagensPublicadas_quandoConsultarCatalogo() throws Exception {
        ViagemResponseDTO dto = new ViagemResponseDTO(
            1L, StatusViagem.PUBLICADA, OffsetDateTime.now(ZoneOffset.UTC),
            "NABUUS Odyssey", "Antimatéria", 0.4, 15.0, CategoriaConforto.LUXO, 24,
            1L, "Terra", 2L, "Proxima Centauri b",
            new BigDecimal("15000.00"), new BigDecimal("2500.00"),
            true, 3.2, 2.1, new BigDecimal("25600.00"), 0,
            true, 0.12, 0.08, new BigDecimal("75600.00"),
            "{}", "[\"01B\"]"
        );
        when(viagemService.buscarPublicadas(null, null)).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/viagens"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].planetaDesembarqueNome").value("Proxima Centauri b"))
            .andExpect(jsonPath("$[0].status").value("PUBLICADA"));
    }
}
