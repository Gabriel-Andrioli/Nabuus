package br.ufjf.nabuus.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import br.ufjf.nabuus.domain.entity.Astronomo;
import br.ufjf.nabuus.domain.entity.Fretista;
import br.ufjf.nabuus.domain.entity.OnibusEspacial;
import br.ufjf.nabuus.domain.entity.Passageiro;
import br.ufjf.nabuus.domain.entity.Passagem;
import br.ufjf.nabuus.domain.entity.Planeta;
import br.ufjf.nabuus.domain.entity.SistemaSolar;
import br.ufjf.nabuus.domain.entity.TipoPropulsao;
import br.ufjf.nabuus.domain.entity.Viagem;
import br.ufjf.nabuus.domain.enums.CategoriaConforto;
import br.ufjf.nabuus.domain.enums.StatusViagem;
import br.ufjf.nabuus.dto.logistica.PassagemComprarRequestDTO;
import br.ufjf.nabuus.dto.logistica.PassagemResponseDTO;
import br.ufjf.nabuus.exception.ConflitoDeEstadoException;
import br.ufjf.nabuus.repository.PassagemRepository;
import br.ufjf.nabuus.repository.PassageiroRepository;
import br.ufjf.nabuus.repository.ViagemRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class PassagemServiceTest {

    @Mock
    private PassagemRepository passagemRepository;
    @Mock
    private ViagemRepository viagemRepository;
    @Mock
    private PassageiroRepository passageiroRepository;

    private PassagemService passagemService;
    private UUID passageiroId;
    private Passageiro passageiro;
    private Viagem viagem;

    @BeforeEach
    void setup() {
        passagemService = new PassagemService(
            passagemRepository, viagemRepository, passageiroRepository, new ObjectMapper()
        );
        passageiroId = UUID.randomUUID();
        passageiro = new Passageiro("Aurora", "aurora@nabuus.space", "h", "123", LocalDate.of(1998, 4, 12));
        ReflectionTestUtils.setField(passageiro, "id", passageiroId);

        Astronomo astro = new Astronomo("Carl", "a@nabuus.space", "h", "IAU");
        Fretista fretista = new Fretista("Odyssey", "f@nabuus.space", "h", "123", "Odyssey");
        TipoPropulsao prop = new TipoPropulsao(
            astro, "ANTIMATERIA", "Antimatéria", 1.0, 0.4, 15.0,
            CategoriaConforto.LUXO, new BigDecimal("15000.00"), new BigDecimal("2500.00")
        );
        OnibusEspacial onibus = new OnibusEspacial(fretista, prop, "NABUUS Odyssey", 24);
        SistemaSolar sol = new SistemaSolar(astro, "Solar", "Sol", 0.0, 0.0, 0.0);
        Planeta terra = new Planeta(sol, "Terra", 1.0, 1.0, true, 1.0, true, "");
        Planeta proxima = new Planeta(sol, "Proxima Centauri b", 1.0, 1.0, true, 0.048, false, "");

        viagem = new Viagem(
            fretista, onibus, terra, proxima, null,
            OffsetDateTime.now(ZoneOffset.UTC), StatusViagem.PUBLICADA,
            new BigDecimal("15000.00"), new BigDecimal("2500.00")
        );
        ReflectionTestUtils.setField(viagem, "id", 1L);
        viagem.setViavelSemLumica(true);
        viagem.setPrecoSemLumica(new BigDecimal("25600.00"));
        viagem.setViavelComLumica(true);
        viagem.setPrecoComLumica(new BigDecimal("75600.00"));
        viagem.setAssentosOcupadosJson("[\"01B\",\"02A\"]");
    }

    @Test
    void deveEmitirPassagem_quandoAssentoEstiverLivre() {
        when(viagemRepository.findDetalhadaPorId(1L)).thenReturn(Optional.of(viagem));
        when(passageiroRepository.findById(passageiroId)).thenReturn(Optional.of(passageiro));
        when(passagemRepository.existsByViagemIdAndPassageiroIdAndAssentoEscolhido(1L, passageiroId, "01A"))
            .thenReturn(false);
        when(passagemRepository.save(any(Passagem.class))).thenAnswer(inv -> inv.getArgument(0));

        PassagemResponseDTO resp = passagemService.comprar(
            new PassagemComprarRequestDTO(1L, "01A", false),
            passageiroId
        );

        assertThat(resp.assentoEscolhido()).isEqualTo("01A");
        assertThat(resp.valorPago()).isEqualByComparingTo("25600.00");
        assertThat(viagem.getAssentosOcupadosJson()).doesNotContain("01A");
    }

    @Test
    void deveLancarConflito_quandoMesmoPassageiroReservarAssentoDuplicado() {
        when(viagemRepository.findDetalhadaPorId(1L)).thenReturn(Optional.of(viagem));
        when(passageiroRepository.findById(passageiroId)).thenReturn(Optional.of(passageiro));
        when(passagemRepository.existsByViagemIdAndPassageiroIdAndAssentoEscolhido(1L, passageiroId, "01A"))
            .thenReturn(true);

        assertThatThrownBy(() -> passagemService.comprar(
            new PassagemComprarRequestDTO(1L, "01A", false),
            passageiroId
        )).isInstanceOf(ConflitoDeEstadoException.class)
          .hasMessageContaining("01A");
    }

    @Test
    void deveLancarConflito_quandoAssentoJaEstiverOcupado() {
        when(viagemRepository.findDetalhadaPorId(1L)).thenReturn(Optional.of(viagem));
        when(passageiroRepository.findById(passageiroId)).thenReturn(Optional.of(passageiro));

        assertThatThrownBy(() -> passagemService.comprar(
            new PassagemComprarRequestDTO(1L, "01B", false),
            passageiroId
        )).isInstanceOf(ConflitoDeEstadoException.class)
          .hasMessageContaining("01B");
    }
}
