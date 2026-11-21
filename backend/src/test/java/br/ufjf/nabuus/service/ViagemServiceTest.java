package br.ufjf.nabuus.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import br.ufjf.nabuus.client.MotorCalculoClient;
import br.ufjf.nabuus.domain.entity.Astronomo;
import br.ufjf.nabuus.domain.entity.Fretista;
import br.ufjf.nabuus.domain.entity.OnibusEspacial;
import br.ufjf.nabuus.domain.entity.Planeta;
import br.ufjf.nabuus.domain.entity.SistemaSolar;
import br.ufjf.nabuus.domain.entity.TipoPropulsao;
import br.ufjf.nabuus.domain.entity.Viagem;
import br.ufjf.nabuus.domain.enums.CategoriaConforto;
import br.ufjf.nabuus.domain.enums.StatusViagem;
import br.ufjf.nabuus.dto.logistica.OnibusEspacialDTO;
import br.ufjf.nabuus.dto.logistica.PassagemComprarRequestDTO;
import br.ufjf.nabuus.dto.logistica.ViagemPublicarRequestDTO;
import br.ufjf.nabuus.dto.logistica.ViagemResponseDTO;
import br.ufjf.nabuus.dto.motor.CenarioSimuladoDTO;
import br.ufjf.nabuus.dto.motor.ResultadoCenariosDTO;
import br.ufjf.nabuus.dto.motor.RotaDetalhadaResponseDTO;
import br.ufjf.nabuus.exception.RegraDeNegocioException;
import br.ufjf.nabuus.repository.FretistaRepository;
import br.ufjf.nabuus.repository.OnibusEspacialRepository;
import br.ufjf.nabuus.repository.PlanetaRepository;
import br.ufjf.nabuus.repository.RotaLumicaRepository;
import br.ufjf.nabuus.repository.TipoPropulsaoRepository;
import br.ufjf.nabuus.repository.ViagemRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class ViagemServiceTest {

    @Mock
    private ViagemRepository viagemRepository;
    @Mock
    private FretistaRepository fretistaRepository;
    @Mock
    private OnibusEspacialRepository onibusRepository;
    @Mock
    private PlanetaRepository planetaRepository;
    @Mock
    private RotaLumicaRepository rotaLumicaRepository;
    @Mock
    private TipoPropulsaoRepository tipoPropulsaoRepository;
    @Mock
    private MotorCalculoClient motorClient;

    private ViagemService viagemService;
    private UUID fretistaId;
    private Fretista fretista;
    private OnibusEspacial onibus;
    private Planeta terra;
    private Planeta proxima;

    @BeforeEach
    void setup() {
        viagemService = new ViagemService(
            viagemRepository, fretistaRepository, onibusRepository, planetaRepository,
            rotaLumicaRepository, tipoPropulsaoRepository, motorClient, new ObjectMapper()
        );
        fretistaId = UUID.randomUUID();
        fretista = new Fretista("Odyssey", "f@nabuus.space", "h", "123", "Odyssey");
        ReflectionTestUtils.setField(fretista, "id", fretistaId);

        Astronomo astro = new Astronomo("Carl", "a@nabuus.space", "h", "IAU");
        TipoPropulsao prop = new TipoPropulsao(
            astro, "ANTIMATERIA", "Antimatéria", 1.0, 0.4, 15.0,
            CategoriaConforto.LUXO, new BigDecimal("15000.00"), new BigDecimal("2500.00")
        );
        onibus = new OnibusEspacial(fretista, prop, "NABUUS Odyssey", 24);
        SistemaSolar sol = new SistemaSolar(astro, "Solar", "Sol", 0.0, 0.0, 0.0);
        ReflectionTestUtils.setField(sol, "id", 1L);
        SistemaSolar alpha = new SistemaSolar(astro, "Alpha", "Alpha", 217.4, -62.6, 4.24);
        ReflectionTestUtils.setField(alpha, "id", 2L);

        terra = new Planeta(sol, "Terra", 1.0, 1.0, true, 1.0, true, "");
        ReflectionTestUtils.setField(terra, "id", 1L);
        proxima = new Planeta(alpha, "Proxima Centauri b", 1.0, 1.0, true, 0.048, false, "");
        ReflectionTestUtils.setField(proxima, "id", 2L);
    }

    @Test
    void devePublicarViagemComCalculoUnico_quandoTrajetoriaForViavel() {
        when(fretistaRepository.findById(fretistaId)).thenReturn(Optional.of(fretista));
        when(onibusRepository.findById(1L)).thenReturn(Optional.of(onibus));
        when(planetaRepository.findById(1L)).thenReturn(Optional.of(terra));
        when(planetaRepository.findById(2L)).thenReturn(Optional.of(proxima));
        when(planetaRepository.findAllPostosRecarga()).thenReturn(List.of(terra));
        when(rotaLumicaRepository.findAtivaEntreSistemas(1L, 2L)).thenReturn(Optional.empty());

        CenarioSimuladoDTO cenarioViavel = new CenarioSimuladoDTO(
            true, null, 3.2, 5.3, 2.1, 4.24, 0, List.of(), new BigDecimal("25600.00"), null
        );
        CenarioSimuladoDTO semLumicaRota = new CenarioSimuladoDTO(
            false, "Sem rota lúmica", 0.0, 0.0, 0.0, 0.0, 0, List.of(), BigDecimal.ZERO, null
        );
        when(motorClient.simularViagem(any()))
            .thenReturn(new ResultadoCenariosDTO(1L, cenarioViavel, semLumicaRota, List.of("01B"), 1));
        when(motorClient.tracarRota(any()))
            .thenReturn(new RotaDetalhadaResponseDTO(null, null));
        when(viagemRepository.save(any(Viagem.class))).thenAnswer(inv -> inv.getArgument(0));

        ViagemResponseDTO resposta = viagemService.publicar(
            new ViagemPublicarRequestDTO(
                1L, 1L, 2L, OffsetDateTime.now(ZoneOffset.UTC),
                new BigDecimal("15000.00"), new BigDecimal("2500.00")
            ),
            fretistaId
        );

        assertThat(resposta.status()).isEqualTo(StatusViagem.PUBLICADA);
        assertThat(resposta.viavelSemLumica()).isTrue();
        assertThat(resposta.precoSemLumica()).isEqualByComparingTo("25600.00");
    }

    @Test
    void deveLancarRegraDeNegocio_quandoAutonomiaForInsuficiente() {
        when(fretistaRepository.findById(fretistaId)).thenReturn(Optional.of(fretista));
        when(onibusRepository.findById(1L)).thenReturn(Optional.of(onibus));
        when(planetaRepository.findById(1L)).thenReturn(Optional.of(terra));
        when(planetaRepository.findById(2L)).thenReturn(Optional.of(proxima));
        when(planetaRepository.findAllPostosRecarga()).thenReturn(List.of());
        when(rotaLumicaRepository.findAtivaEntreSistemas(1L, 2L)).thenReturn(Optional.empty());

        CenarioSimuladoDTO inviavel = new CenarioSimuladoDTO(
            false, "Autonomia insuficiente", 0.0, 0.0, 0.0, 0.0, 0, List.of(), BigDecimal.ZERO, null
        );
        when(motorClient.simularViagem(any()))
            .thenReturn(new ResultadoCenariosDTO(1L, inviavel, inviavel, List.of(), 0));

        assertThatThrownBy(() -> viagemService.publicar(
            new ViagemPublicarRequestDTO(
                1L, 1L, 2L, OffsetDateTime.now(ZoneOffset.UTC).plusDays(1),
                new BigDecimal("15000.00"), new BigDecimal("2500.00")
            ),
            fretistaId
        )).isInstanceOf(RegraDeNegocioException.class)
          .hasMessageContaining("Autonomia insuficiente");
    }

    @Test
    void deveRejeitarViagem_quandoPlanetaEmbarqueIgualAoDesembarque() {
        assertThatThrownBy(() -> viagemService.publicar(
            new ViagemPublicarRequestDTO(
                1L, 1L, 1L, OffsetDateTime.now(ZoneOffset.UTC).plusDays(1),
                new BigDecimal("15000.00"), new BigDecimal("2500.00")
            ),
            fretistaId
        )).isInstanceOf(RegraDeNegocioException.class)
          .hasMessageContaining("devem ser diferentes");
    }

    @Test
    void deveValidarConstraintsDosDtosDeLogistica() {
        Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

        ViagemPublicarRequestDTO viagemPassada = new ViagemPublicarRequestDTO(
            1L, 1L, 2L, OffsetDateTime.now(ZoneOffset.UTC).minusHours(1),
            new BigDecimal("15000.00"), new BigDecimal("2500.00")
        );
        assertThat(validator.validate(viagemPassada))
            .anyMatch(v -> v.getPropertyPath().toString().equals("dataPartida"));

        OnibusEspacialDTO onibusExcessoAssentos = new OnibusEspacialDTO(
            null, "Nave Gigante", 1L, null, 250, true
        );
        assertThat(validator.validate(onibusExcessoAssentos))
            .anyMatch(v -> v.getPropertyPath().toString().equals("totalAssentos"));

        PassagemComprarRequestDTO assentoInvalido = new PassagemComprarRequestDTO(1L, "ASSENTO-1", false);
        assertThat(validator.validate(assentoInvalido))
            .anyMatch(v -> v.getPropertyPath().toString().equals("assentoEscolhido"));

        PassagemComprarRequestDTO assentoValido = new PassagemComprarRequestDTO(1L, "01A", false);
        assertThat(validator.validate(assentoValido)).isEmpty();
    }
}
