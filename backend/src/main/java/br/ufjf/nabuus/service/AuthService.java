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
import br.ufjf.nabuus.repository.UsuarioRepository;
import br.ufjf.nabuus.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthService(
        UsuarioRepository usuarioRepository,
        PasswordEncoder passwordEncoder,
        JwtService jwtService,
        AuthenticationManager authenticationManager
    ) {
        this.usuarioRepository = usuarioRepository;
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
        return new AuthResponseDTO(salvo.getId(), salvo.getNome(), salvo.getEmail(), salvo.getRole(), jwtService.gerarToken(salvo));
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
            return new Astronomo(dto.nome(), dto.email(), hash, exigirCampo(dto.credencialCientifica(), "Credencial científica"));
        }
        if (dto.role() == Role.FRETISTA) {
            return new Fretista(
                dto.nome(),
                dto.email(),
                hash,
                exigirCampo(dto.cnpjIntergalactico(), "CNPJ intergaláctico"),
                exigirCampo(dto.razaoSocial(), "Razão social")
            );
        }
        if (dto.dataNascimento() == null) {
            throw new RegraDeNegocioException("Data de nascimento é obrigatória para passageiros.");
        }
        return new Passageiro(dto.nome(), dto.email(), hash, exigirCampo(dto.cpf(), "CPF"), dto.dataNascimento());
    }

    private String exigirCampo(String valor, String nomeCampo) {
        if (valor == null || valor.isBlank()) {
            throw new RegraDeNegocioException(nomeCampo + " é obrigatório.");
        }
        return valor.trim();
    }
}
