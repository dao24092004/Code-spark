package com.dao.user_service.security;

import org.springframework.core.convert.converter.Converter;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

@Component
public class JwtAuthConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private static final String ROLES_CLAIM = "roles";
    private static final String PERMISSIONS_CLAIM = "permissions";

    @Override
    public AbstractAuthenticationToken convert(@NonNull Jwt jwt) {
        Set<GrantedAuthority> authorities = new HashSet<>();
        authorities.addAll(extractAuthorities(jwt, ROLES_CLAIM));
        authorities.addAll(extractAuthorities(jwt, PERMISSIONS_CLAIM));

        return new JwtAuthenticationToken(jwt, authorities, resolvePrincipal(jwt));
    }

    private String resolvePrincipal(Jwt jwt) {
        return jwt.getClaimAsString("sub");
    }

    @SuppressWarnings("unchecked")
    private Collection<? extends GrantedAuthority> extractAuthorities(Jwt jwt, String claimName) {
        Object claim = jwt.getClaim(claimName);
        if (claim instanceof Collection<?> values) {
            return ((Collection<String>) values).stream()
                    .map(SimpleGrantedAuthority::new)
                    .toList();
        }
        return Collections.emptySet();
    }
}
