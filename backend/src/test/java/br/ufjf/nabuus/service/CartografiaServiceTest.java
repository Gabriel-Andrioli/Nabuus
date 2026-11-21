package br.ufjf.nabuus.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.ufjf.nabuus.domain.entity.Astronomo;
import br.ufjf.nabuus.domain.entity.RotaLumica;
import br.ufjf.nabuus.domain.entity.SistemaSolar;
import br.ufjf.nabuus.domain.enums.StatusViagem;
import br.ufjf.nabuus.dto.cartografia.RotaLumicaDTO;
import br.ufjf.nabuus.dto.cartografia.SistemaSolarDTO;
import br.ufjf.nabuus.exception.RegraDeNegocioException;
import br.ufjf.nabuus.repository.AstronomoRepository;
import br.ufjf.nabuus.repository.PlanetaRepository;
import br.ufjf.nabuus.repository.RotaLumicaRepository;
import br.ufjf.nabuus.repository.SistemaSolarRepository;
import br.ufjf.nabuus.repository.TipoPropulsaoRepository;
import br.ufjf.nabuus.repository.ViagemRepository;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CartografiaServiceTest {

    @Mock
    private SistemaSolarRepository sistemaSolarRepository;
    @Mock
    private PlanetaRepository planetaRepository;
    @Mock
    private RotaLumicaRepository rotaLumicaRepository;
    @Mock
    private TipoPropulsaoRepository tipoPropulsaoRepository;
    @Mock
    private AstronomoRepository astronomoRepository;
    @Mock
    private ViagemRepository viagemRepository;

    @InjectMocks
    private CartografiaService cartografiaService;

    @Test
    void deveSuspenderViagensAtivas_quandoRotaLumicaForDesativada() {
        Astronomo astronomo = new Astronomo("Carl", "carl@nabuus.space", "hash", "IAU-1");
        SistemaSolar sol = new SistemaSolar(astronomo, "Sistema Solar", "Sol", 0.0, 0.0, 0.0);
        SistemaSolar alpha = new SistemaSolar(astronomo, "Alpha Centauri", "Alpha", 217.4, -62.6, 4.24);
        RotaLumica rota = new RotaLumica(astronomo, sol, alpha, 0.8, new BigDecimal("50000.00"), Boolean.TRUE);

        when(rotaLumicaRepository.findById(1L)).thenReturn(Optional.of(rota));
        when(rotaLumicaRepository.save(rota)).thenReturn(rota);

        RotaLumicaDTO resultado = cartografiaService.alternarStatusRotaLumica(1L, false);

        assertThat(resultado.ativa()).isFalse();
        verify(viagemRepository).suspenderPorRotaLumica(1L, StatusViagem.PUBLICADA, StatusViagem.SUSPENSA);
    }

    @Test
    void deveRejeitarRotaLumica_quandoOrigemIgualAoDestino() {
        RotaLumicaDTO dto = new RotaLumicaDTO(
            null, 1L, "Sistema Solar", 1L, "Sistema Solar",
            0.99, new BigDecimal("50000.00"), Boolean.TRUE
        );

        assertThatThrownBy(() -> cartografiaService.cadastrarRotaLumica(dto, UUID.randomUUID()))
            .isInstanceOf(RegraDeNegocioException.class)
            .hasMessageContaining("devem ser diferentes");
    }

    @Test
    void deveValidarCoordenadasAstronomicasEmSistemaSolarDTO() {
        Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

        SistemaSolarDTO raInvalida = new SistemaSolarDTO(null, "Teste", "Estrela", 361.0, 10.0, 5.0);
        assertThat(validator.validate(raInvalida))
            .anyMatch(v -> v.getPropertyPath().toString().equals("coordenadaRA"));

        SistemaSolarDTO decInvalida = new SistemaSolarDTO(null, "Teste", "Estrela", 120.0, -95.0, 5.0);
        assertThat(validator.validate(decInvalida))
            .anyMatch(v -> v.getPropertyPath().toString().equals("coordenadaDec"));

        SistemaSolarDTO valido = new SistemaSolarDTO(null, "Alpha", "Proxima", 217.43, -62.68, 4.24);
        assertThat(validator.validate(valido)).isEmpty();
    }
}
