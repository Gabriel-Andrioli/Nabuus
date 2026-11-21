package br.ufjf.nabuus.controller;

import br.ufjf.nabuus.dto.logistica.ViagemPublicarRequestDTO;
import br.ufjf.nabuus.dto.logistica.ViagemResponseDTO;
import br.ufjf.nabuus.dto.motor.SugestaoPrecoResponseDTO;
import br.ufjf.nabuus.security.UsuarioAutenticado;
import br.ufjf.nabuus.service.ViagemService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/viagens")
public class ViagemController {

    private final ViagemService viagemService;

    public ViagemController(ViagemService viagemService) {
        this.viagemService = viagemService;
    }

    @GetMapping
    public List<ViagemResponseDTO> buscarPublicadas(
        @RequestParam(required = false) Long origemId,
        @RequestParam(required = false) Long destinoId
    ) {
        return viagemService.buscarPublicadas(origemId, destinoId);
    }

    @GetMapping("/{id}")
    public ViagemResponseDTO buscarPorId(@PathVariable Long id) {
        return viagemService.buscarPorId(id);
    }

    @GetMapping("/fretista")
    @PreAuthorize("hasRole('FRETISTA')")
    public List<ViagemResponseDTO> listarDoFretista(
        Authentication authentication,
        @RequestHeader(value = "X-User-Id", required = false) UUID headerUserId
    ) {
        return viagemService.listarDoFretista(UsuarioAutenticado.resolverId(authentication, headerUserId));
    }

    @PostMapping("/sugerir-preco")
    @PreAuthorize("hasRole('FRETISTA')")
    public SugestaoPrecoResponseDTO sugerirPreco(@RequestParam Long tipoPropulsaoId) {
        return viagemService.sugerirPreco(tipoPropulsaoId);
    }

    @PostMapping("/publicar")
    @PreAuthorize("hasRole('FRETISTA')")
    public ResponseEntity<ViagemResponseDTO> publicar(
        @Valid @RequestBody ViagemPublicarRequestDTO dto,
        Authentication authentication,
        @RequestHeader(value = "X-User-Id", required = false) UUID headerUserId
    ) {
        UUID fretistaId = UsuarioAutenticado.resolverId(authentication, headerUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(viagemService.publicar(dto, fretistaId));
    }
}
