package br.ufjf.nabuus.security;

import java.util.Collection;
import java.util.UUID;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.User;

public class UsuarioAutenticado extends User {

    private final UUID id;

    public UsuarioAutenticado(
        UUID id,
        String username,
        String password,
        Collection<? extends GrantedAuthority> authorities
    ) {
        super(username, password, authorities);
        this.id = id;
    }

    public UUID getId() {
        return id;
    }

    public static UUID resolverId(Authentication auth, UUID headerFallback) {
        if (auth != null && auth.getPrincipal() instanceof UsuarioAutenticado usuario) {
            return usuario.getId();
        }
        if (headerFallback != null) {
            return headerFallback;
        }
        throw new BadCredentialsException("Usuário autenticado não identificado.");
    }
}
