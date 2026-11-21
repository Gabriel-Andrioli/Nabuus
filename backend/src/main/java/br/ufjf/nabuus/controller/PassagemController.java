package br.ufjf.nabuus.controller;

import br.ufjf.nabuus.dto.logistica.PassagemComprarRequestDTO;
import br.ufjf.nabuus.dto.logistica.PassagemResponseDTO;
import br.ufjf.nabuus.security.JwtService;
import br.ufjf.nabuus.service.PassagemService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/passagens")
@PreAuthorize("hasRole('PASSAGEIRO')")
public class PassagemController {

    private final PassagemService passagemService;

    public PassagemController(PassagemService passagemService) {
        this.passagemService = passagemService;
    }

    @GetMapping("/minhas")
    public List<PassagemResponseDTO> listarMinhas(
        Authentication authentication,
        @RequestHeader(value = "X-User-Id", required = false) UUID headerUserId
    ) {
        return passagemService.listarMinhas(JwtService.resolverUsuarioId(authentication, headerUserId));
    }

    @PostMapping("/comprar")
    public ResponseEntity<PassagemResponseDTO> comprar(
        @Valid @RequestBody PassagemComprarRequestDTO dto,
        Authentication authentication,
        @RequestHeader(value = "X-User-Id", required = false) UUID headerUserId
    ) {
        UUID passageiroId = JwtService.resolverUsuarioId(authentication, headerUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(passagemService.comprar(dto, passageiroId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remover(
        @PathVariable Long id,
        Authentication authentication,
        @RequestHeader(value = "X-User-Id", required = false) UUID headerUserId
    ) {
        passagemService.excluir(id, JwtService.resolverUsuarioId(authentication, headerUserId));
        return ResponseEntity.noContent().build();
    }
}
