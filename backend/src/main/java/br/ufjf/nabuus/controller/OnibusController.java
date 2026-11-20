package br.ufjf.nabuus.controller;

import br.ufjf.nabuus.dto.logistica.OnibusEspacialDTO;
import br.ufjf.nabuus.service.FrotaService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/onibus")
@PreAuthorize("hasRole('FRETISTA')")
public class OnibusController {

    private final FrotaService frotaService;

    public OnibusController(FrotaService frotaService) {
        this.frotaService = frotaService;
    }

    @GetMapping
    public List<OnibusEspacialDTO> listar(@RequestHeader("X-User-Id") UUID fretistaId) {
        return frotaService.listarPorFretista(fretistaId);
    }

    @PostMapping
    public ResponseEntity<OnibusEspacialDTO> cadastrar(
        @Valid @RequestBody OnibusEspacialDTO dto,
        @RequestHeader("X-User-Id") UUID fretistaId
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(frotaService.cadastrar(dto, fretistaId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remover(
        @PathVariable Long id,
        @RequestHeader("X-User-Id") UUID fretistaId
    ) {
        frotaService.inativar(id, fretistaId);
        return ResponseEntity.noContent().build();
    }
}
