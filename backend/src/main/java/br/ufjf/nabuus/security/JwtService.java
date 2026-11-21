package br.ufjf.nabuus.security;

import br.ufjf.nabuus.domain.entity.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private final SecretKey chaveSecreta;
    private final long expiracaoMs;

    public JwtService(
        @Value("${nabuus.jwt.secret}") String secret,
        @Value("${nabuus.jwt.expiration-ms}") long expiracaoMs
    ) {
        this.chaveSecreta = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expiracaoMs = expiracaoMs;
    }

    public String gerarToken(Usuario usuario) {
        Date agora = new Date();
        Date expiracao = new Date(agora.getTime() + expiracaoMs);
        return Jwts.builder()
            .subject(usuario.getEmail())
            .claim("userId", usuario.getId().toString())
            .claim("role", usuario.getRole().name())
            .issuedAt(agora)
            .expiration(expiracao)
            .signWith(chaveSecreta)
            .compact();
    }

    public String extrairEmail(String token) {
        return extrairClaims(token).getSubject();
    }

    public UUID extrairUserId(String token) {
        String userId = extrairClaims(token).get("userId", String.class);
        return userId != null ? UUID.fromString(userId) : null;
    }

    public static UUID resolverUsuarioId(Authentication auth, UUID headerFallback) {
        if (auth != null && auth.getCredentials() instanceof UUID id) {
            return id;
        }
        if (headerFallback != null) {
            return headerFallback;
        }
        throw new BadCredentialsException("Usuário autenticado não identificado.");
    }

    public boolean tokenValido(String token) {
        try {
            Claims claims = extrairClaims(token);
            return claims.getExpiration().after(new Date());
        } catch (RuntimeException ex) {
            return false;
        }
    }

    private Claims extrairClaims(String token) {
        return Jwts.parser()
            .verifyWith(chaveSecreta)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }
}
