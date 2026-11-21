package br.ufjf.nabuus.controller;

import br.ufjf.nabuus.dto.cartografia.PlanetaDTO;
import br.ufjf.nabuus.dto.cartografia.RotaLumicaDTO;
import br.ufjf.nabuus.dto.cartografia.SistemaSolarDTO;
import br.ufjf.nabuus.dto.cartografia.TipoPropulsaoDTO;
import br.ufjf.nabuus.security.JwtService;
import br.ufjf.nabuus.service.CartografiaService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cartografia")
public class CartografiaController {

    private final CartografiaService cartografiaService;

    public CartografiaController(CartografiaService cartografiaService) {
        this.cartografiaService = cartografiaService;
    }

    @GetMapping("/sistemas")
    public List<SistemaSolarDTO> listarSistemas() {
        return cartografiaService.listarSistemas();
    }

    @PostMapping("/sistemas")
    @PreAuthorize("hasRole('ASTRONOMO')")
    public ResponseEntity<SistemaSolarDTO> cadastrarSistema(
        @Valid @RequestBody SistemaSolarDTO dto,
        Authentication authentication,
        @RequestHeader(value = "X-User-Id", required = false) UUID headerUserId
    ) {
        UUID astronomoId = JwtService.resolverUsuarioId(authentication, headerUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(cartografiaService.cadastrarSistema(dto, astronomoId));
    }

    @GetMapping("/planetas")
    public List<PlanetaDTO> listarPlanetas() {
        return cartografiaService.listarPlanetas();
    }

    @PostMapping("/planetas")
    @PreAuthorize("hasRole('ASTRONOMO')")
    public ResponseEntity<PlanetaDTO> cadastrarPlaneta(@Valid @RequestBody PlanetaDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(cartografiaService.cadastrarPlaneta(dto));
    }

    @GetMapping("/propulsoes")
    public List<TipoPropulsaoDTO> listarPropulsoes() {
        return cartografiaService.listarPropulsoes();
    }

    @PostMapping("/propulsoes")
    @PreAuthorize("hasRole('ASTRONOMO')")
    public ResponseEntity<TipoPropulsaoDTO> cadastrarPropulsao(
        @Valid @RequestBody TipoPropulsaoDTO dto,
        Authentication authentication,
        @RequestHeader(value = "X-User-Id", required = false) UUID headerUserId
    ) {
        UUID astronomoId = JwtService.resolverUsuarioId(authentication, headerUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(cartografiaService.cadastrarPropulsao(dto, astronomoId));
    }

    @GetMapping("/rotas-lumicas")
    public List<RotaLumicaDTO> listarRotasLumicas() {
        return cartografiaService.listarRotasLumicas();
    }

    @PostMapping("/rotas-lumicas")
    @PreAuthorize("hasRole('ASTRONOMO')")
    public ResponseEntity<RotaLumicaDTO> cadastrarRotaLumica(
        @Valid @RequestBody RotaLumicaDTO dto,
        Authentication authentication,
        @RequestHeader(value = "X-User-Id", required = false) UUID headerUserId
    ) {
        UUID astronomoId = JwtService.resolverUsuarioId(authentication, headerUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(cartografiaService.cadastrarRotaLumica(dto, astronomoId));
    }

    @PatchMapping("/rotas-lumicas/{id}/status")
    @PreAuthorize("hasRole('ASTRONOMO')")
    public ResponseEntity<RotaLumicaDTO> alternarStatusRota(
        @PathVariable Long id,
        @RequestParam boolean ativa
    ) {
        return ResponseEntity.ok(cartografiaService.alternarStatusRotaLumica(id, ativa));
    }
}
