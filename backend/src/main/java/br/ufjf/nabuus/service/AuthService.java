package br.ufjf.nabuus.service;

import br.ufjf.nabuus.domain.entity.Astronomo;
import br.ufjf.nabuus.domain.entity.Fretista;
import br.ufjf.nabuus.domain.entity.Passageiro;
import br.ufjf.nabuus.domain.entity.Usuario;
import br.ufjf.nabuus.domain.enums.Role;
import br.ufjf.nabuus.dto.auth.AuthResponseDTO;
import br.ufjf.nabuus.dto.auth.LoginRequestDTO;
import br.ufjf.nabuus.dto.auth.RegistroRequestDTO;
import br.ufjf.nabuus.exception.ConflitoDeEstadoException;
import br.ufjf.nabuus.exception.RegraDeNegocioException;
import br.ufjf.nabuus.repository.AstronomoRepository;
import br.ufjf.nabuus.repository.FretistaRepository;
import br.ufjf.nabuus.repository.PassageiroRepository;
import br.ufjf.nabuus.repository.UsuarioRepository;
import br.ufjf.nabuus.security.JwtService;
import java.time.LocalDate;
import java.util.Locale;
import java.util.Set;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final Set<String> CREDENCIAIS_ASTRONOMO_HOMOLOGADAS = Set.of(
        "IAU-2100-BR",
        "IAU-2100-001",
        "IAU-2100-002",
        "IAU-2100-003",
        "IAU-2100-004",
        "IAU-2100-005",
        "IAU-2100-006",
        "IAU-2100-007",
        "IAU-2100-008",
        "IAU-2100-009"
    );

    private static final Set<String> CNPJS_FRETISTA_HOMOLOGADOS = Set.of(
        "12.345.678/0001-99",
        "10.100.001/0001-01",
        "10.100.002/0001-02",
        "10.100.003/0001-03",
        "10.100.004/0001-04",
        "10.100.005/0001-05",
        "10.100.006/0001-06",
        "10.100.007/0001-07",
        "10.100.008/0001-08",
        "10.100.009/0001-09"
    );

    private final UsuarioRepository usuarioRepository;
    private final AstronomoRepository astronomoRepository;
    private final FretistaRepository fretistaRepository;
    private final PassageiroRepository passageiroRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthService(
        UsuarioRepository usuarioRepository,
        AstronomoRepository astronomoRepository,
        FretistaRepository fretistaRepository,
        PassageiroRepository passageiroRepository,
        PasswordEncoder passwordEncoder,
        JwtService jwtService,
        AuthenticationManager authenticationManager
    ) {
        this.usuarioRepository = usuarioRepository;
        this.astronomoRepository = astronomoRepository;
        this.fretistaRepository = fretistaRepository;
        this.passageiroRepository = passageiroRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
    }

    @Transactional
    public AuthResponseDTO registrar(RegistroRequestDTO dto) {
        if (usuarioRepository.existsByEmail(dto.email())) {
            throw new ConflitoDeEstadoException("Já existe uma conta cadastrada com este e-mail.");
        }

        String hash = passwordEncoder.encode(dto.senha());
        Usuario novoUsuario = instanciarUsuarioPorRole(dto, hash);
        Usuario salvo = usuarioRepository.save(novoUsuario);
        return new AuthResponseDTO(
            salvo.getId(), salvo.getNome(), salvo.getEmail(), salvo.getRole(), jwtService.gerarToken(salvo)
        );
    }

    @Transactional(readOnly = true)
    public AuthResponseDTO autenticar(LoginRequestDTO dto) {
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(dto.email(), dto.senha()));
        Usuario usuario = usuarioRepository.findByEmail(dto.email())
            .orElseThrow(() -> new RegraDeNegocioException("Usuário não encontrado."));
        return new AuthResponseDTO(
            usuario.getId(),
            usuario.getNome(),
            usuario.getEmail(),
            usuario.getRole(),
            jwtService.gerarToken(usuario)
        );
    }

    private Usuario instanciarUsuarioPorRole(RegistroRequestDTO dto, String hash) {
        if (dto.role() == Role.ASTRONOMO) {
            String credencial = exigirCampo(dto.credencialCientifica(), "Credencial científica")
                .toUpperCase(Locale.ROOT);
            if (!CREDENCIAIS_ASTRONOMO_HOMOLOGADAS.contains(credencial)) {
                throw new RegraDeNegocioException(
                    "Credencial científica inválida ou não homologada para cadastro de astrônomo."
                );
            }
            if (astronomoRepository.existsByCredencialCientifica(credencial)) {
                throw new ConflitoDeEstadoException("Esta credencial científica já está vinculada a outra conta.");
            }
            return new Astronomo(dto.nome(), dto.email(), hash, credencial);
        }
        if (dto.role() == Role.FRETISTA) {
            String cnpj = exigirCampo(dto.cnpjIntergalactico(), "CNPJ intergaláctico");
            if (!CNPJS_FRETISTA_HOMOLOGADOS.contains(cnpj)) {
                throw new RegraDeNegocioException(
                    "CNPJ intergaláctico inválido ou não homologado para cadastro de fretista."
                );
            }
            if (fretistaRepository.existsByCnpjIntergalactico(cnpj)) {
                throw new ConflitoDeEstadoException("Este CNPJ intergaláctico já está vinculado a outra conta.");
            }
            String razaoSocial = exigirCampo(dto.razaoSocial(), "Razão social");
            return new Fretista(dto.nome(), dto.email(), hash, cnpj, razaoSocial);
        }
        String cpfNormalizado = validarENormalizarCpf(exigirCampo(dto.cpf(), "CPF"));
        if (passageiroRepository.existsByCpf(cpfNormalizado)) {
            throw new ConflitoDeEstadoException("Este CPF já está vinculado a outra conta.");
        }
        if (dto.dataNascimento() == null) {
            throw new RegraDeNegocioException("Data de nascimento é obrigatória para passageiros.");
        }
        LocalDate hoje = LocalDate.now();
        LocalDate dataMinima = hoje.minusYears(120);
        if (!dto.dataNascimento().isBefore(hoje) || dto.dataNascimento().isBefore(dataMinima)) {
            throw new RegraDeNegocioException("Informe uma data de nascimento válida.");
        }
        return new Passageiro(dto.nome(), dto.email(), hash, cpfNormalizado, dto.dataNascimento());
    }

    private String validarENormalizarCpf(String cpf) {
        String digitos = cpf.replaceAll("\\D", "");
        if (digitos.length() != 11) {
            throw new RegraDeNegocioException("CPF inválido. Informe 11 dígitos.");
        }
        return digitos.substring(0, 3) + "."
            + digitos.substring(3, 6) + "."
            + digitos.substring(6, 9) + "-"
            + digitos.substring(9, 11);
    }

    private String exigirCampo(String valor, String nomeCampo) {
        if (valor == null || valor.isBlank()) {
            throw new RegraDeNegocioException(nomeCampo + " é obrigatório.");
        }
        return valor.trim();
    }
}
