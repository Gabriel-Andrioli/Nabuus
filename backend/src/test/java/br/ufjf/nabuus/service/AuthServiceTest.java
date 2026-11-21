package br.ufjf.nabuus.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import br.ufjf.nabuus.domain.entity.Passageiro;
import br.ufjf.nabuus.domain.enums.Role;
import br.ufjf.nabuus.dto.auth.AuthResponseDTO;
import br.ufjf.nabuus.dto.auth.RegistroRequestDTO;
import br.ufjf.nabuus.exception.RegraDeNegocioException;
import br.ufjf.nabuus.repository.AstronomoRepository;
import br.ufjf.nabuus.repository.FretistaRepository;
import br.ufjf.nabuus.repository.PassageiroRepository;
import br.ufjf.nabuus.repository.UsuarioRepository;
import br.ufjf.nabuus.security.JwtService;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import java.time.LocalDate;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private AstronomoRepository astronomoRepository;

    @Mock
    private FretistaRepository fretistaRepository;

    @Mock
    private PassageiroRepository passageiroRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private AuthenticationManager authenticationManager;

    private AuthService authService;
    private Validator validator;

    @BeforeEach
    void setUp() {
        authService = new AuthService(
            usuarioRepository,
            astronomoRepository,
            fretistaRepository,
            passageiroRepository,
            passwordEncoder,
            jwtService,
            authenticationManager
        );
        validator = Validation.buildDefaultValidatorFactory().getValidator();
    }

    @Test
    void deveRegistrarPassageiro_quandoCpfCom11DigitosEDataNoPassado() {
        RegistroRequestDTO dto = new RegistroRequestDTO(
            "Nova Viajante",
            "nova@nabuus.space",
            "segredo123",
            Role.PASSAGEIRO,
            null,
            null,
            null,
            "11122233344",
            LocalDate.now().minusYears(25)
        );

        when(usuarioRepository.existsByEmail(dto.email())).thenReturn(false);
        when(passwordEncoder.encode(dto.senha())).thenReturn("hash");
        when(passageiroRepository.existsByCpf("111.222.333-44")).thenReturn(false);
        when(usuarioRepository.save(any(Passageiro.class))).thenAnswer(inv -> inv.getArgument(0));
        when(jwtService.gerarToken(any())).thenReturn("jwt-token");

        AuthResponseDTO resp = authService.registrar(dto);

        assertThat(resp.email()).isEqualTo("nova@nabuus.space");
        assertThat(resp.token()).isEqualTo("jwt-token");
    }

    @Test
    void deveRejeitarPassageiro_quandoCpfNaoTiver11Digitos() {
        RegistroRequestDTO dto = new RegistroRequestDTO(
            "Nova Viajante",
            "nova@nabuus.space",
            "segredo123",
            Role.PASSAGEIRO,
            null,
            null,
            null,
            "12345",
            LocalDate.now().minusYears(25)
        );

        when(usuarioRepository.existsByEmail(dto.email())).thenReturn(false);
        when(passwordEncoder.encode(dto.senha())).thenReturn("hash");

        assertThatThrownBy(() -> authService.registrar(dto))
            .isInstanceOf(RegraDeNegocioException.class)
            .hasMessageContaining("CPF inválido");
    }

    @Test
    void deveRejeitarPassageiro_quandoDataNascimentoEstiverNoFuturoOuHoje() {
        RegistroRequestDTO dtoFuturo = new RegistroRequestDTO(
            "Viajante Futuro",
            "futuro@nabuus.space",
            "segredo123",
            Role.PASSAGEIRO,
            null,
            null,
            null,
            "111.222.333-44",
            LocalDate.now().plusDays(1)
        );

        when(usuarioRepository.existsByEmail(dtoFuturo.email())).thenReturn(false);
        when(passwordEncoder.encode(dtoFuturo.senha())).thenReturn("hash");
        when(passageiroRepository.existsByCpf("111.222.333-44")).thenReturn(false);

        assertThatThrownBy(() -> authService.registrar(dtoFuturo))
            .isInstanceOf(RegraDeNegocioException.class)
            .hasMessageContaining("data de nascimento válida");

        Set<ConstraintViolation<RegistroRequestDTO>> violacoes = validator.validate(dtoFuturo);
        assertThat(violacoes).anyMatch(v -> v.getPropertyPath().toString().equals("dataNascimento"));
    }

    @Test
    void deveRejeitarPassageiro_quandoDataNascimentoForAnteriorA120Anos() {
        RegistroRequestDTO dtoAntigo = new RegistroRequestDTO(
            "Viajante Medieval",
            "antigo@nabuus.space",
            "segredo123",
            Role.PASSAGEIRO,
            null,
            null,
            null,
            "111.222.333-44",
            LocalDate.of(1000, 3, 18)
        );

        when(usuarioRepository.existsByEmail(dtoAntigo.email())).thenReturn(false);
        when(passwordEncoder.encode(dtoAntigo.senha())).thenReturn("hash");
        when(passageiroRepository.existsByCpf("111.222.333-44")).thenReturn(false);

        assertThatThrownBy(() -> authService.registrar(dtoAntigo))
            .isInstanceOf(RegraDeNegocioException.class)
            .hasMessageContaining("data de nascimento válida");
    }

    @Test
    void deveRejeitarRegistroDTO_quandoSenhaExceder20Caracteres() {
        RegistroRequestDTO dtoValido = new RegistroRequestDTO(
            "Viajante",
            "viajante1@nabuus.space",
            "a".repeat(20),
            Role.PASSAGEIRO,
            null,
            null,
            null,
            "111.222.333-44",
            LocalDate.now().minusYears(20)
        );
        Set<ConstraintViolation<RegistroRequestDTO>> violacoesValido = validator.validate(dtoValido);
        assertThat(violacoesValido).noneMatch(v -> v.getPropertyPath().toString().equals("senha"));

        RegistroRequestDTO dtoInvalido = new RegistroRequestDTO(
            "Viajante",
            "viajante2@nabuus.space",
            "a".repeat(21),
            Role.PASSAGEIRO,
            null,
            null,
            null,
            "111.222.333-44",
            LocalDate.now().minusYears(20)
        );

        Set<ConstraintViolation<RegistroRequestDTO>> violacoes = validator.validate(dtoInvalido);
        assertThat(violacoes).anyMatch(v -> v.getPropertyPath().toString().equals("senha"));
    }
}
