package com.dao.identity_service.security;

import com.dao.identity_service.config.JwtProperties;
import com.dao.identity_service.entity.User;
import io.jsonwebtoken.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Service for handling JWT token generation, validation, and extraction
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class JwtService {

    private static final String ROLES_CLAIM = "roles";
    private static final String PERMISSIONS_CLAIM = "permissions";
    private static final String USER_ID_CLAIM = "userId";

    private final JwtProperties jwtProperties;
    private final SecretKey secretKey;

    /**
     * Generate JWT token for authenticated user
     */
    public String generateToken(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalArgumentException("Cannot generate token for unauthenticated user");
        }

        UserDetails userPrincipal = (UserDetails) authentication.getPrincipal();
        
        Map<String, Object> claims = new HashMap<>();
        List<String> roles = userPrincipal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());
        
        claims.put(ROLES_CLAIM, roles);
        return buildToken(claims, userPrincipal.getUsername(), jwtProperties.getExpirationMs());
    }

    /**
     * Generate JWT token with custom claims for a user
     */
    public String generateTokenWithUserId(User user, String userId) {
        if (user == null || userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("User and userId cannot be null or empty");
        }

        Map<String, Object> claims = new HashMap<>();
        claims.put(USER_ID_CLAIM, userId);
        
        List<String> roles = user.getRoles().stream()
                .map(role -> "ROLE_" + role.getName())
                .collect(Collectors.toList());
        claims.put(ROLES_CLAIM, roles);

        List<String> permissions = user.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());
        claims.put(PERMISSIONS_CLAIM, permissions);

        return buildToken(claims, user.getUsername(), jwtProperties.getExpirationMs());
    }

    /**
     * Generate a refresh token with extended expiration
     */
    public String generateRefreshToken(User user) {
        if (user == null || user.getId() == null) {
            throw new IllegalArgumentException("User and userId cannot be null");
        }
        
        Map<String, Object> claims = new HashMap<>();
        claims.put(USER_ID_CLAIM, user.getId());
        return buildToken(claims, user.getUsername(), jwtProperties.getRefreshExpirationMs());
    }

    /**
     * Generate a token for inter-service communication.
     */
    public String generateServiceToken(String serviceName) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("service", serviceName);
        claims.put("type", "service");
        return buildToken(claims, serviceName, jwtProperties.getExpirationMs());
    }

    private String buildToken(Map<String, Object> extraClaims, String subject, long expiration) {
        return Jwts.builder()
                .setClaims(extraClaims)
                .setSubject(subject)
                .setIssuer(jwtProperties.getIssuer())
                .setAudience(jwtProperties.getAudience())
                .setIssuedAt(new Date())
                .setExpiration(new Date((new Date()).getTime() + expiration))
                .signWith(secretKey, SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public String extractUserId(String token) {
        return extractClaim(token, claims -> claims.get(USER_ID_CLAIM, String.class));
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername())) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public boolean validateToken(String authToken) {
        try {
            Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(authToken);
            return true;
        } catch (Exception e) {
            log.error("Invalid JWT: {}", e.getMessage());
            return false;
        }
    }
}
