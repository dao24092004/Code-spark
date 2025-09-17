package com.dao.identity_service.service;

import com.dao.identity_service.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InterServiceAuthService {

    private final UserService userService;
    private final JwtService jwtService;

    @Value("${app.inter-service.secret:inter-service-secret-key-123456789}")
    private String interServiceSecret;

    public Map<String, Object> validateTokenForService(String token) {
        try {
            String username = jwtService.extractUsername(token);
            User user = userService.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (!jwtService.isTokenValid(token, user)) {
                throw new RuntimeException("Invalid token");
            }

            Set<String> permissions = user.getAuthorities().stream()
                    .map(authority -> authority.getAuthority())
                    .collect(Collectors.toSet());

            Set<String> roles = user.getRoles().stream()
                    .map(role -> role.getName())
                    .collect(Collectors.toSet());

            return Map.of(
                    "userId", user.getId(),
                    "username", user.getUsername(),
                    "email", user.getEmail(),
                    "roles", roles,
                    "permissions", permissions,
                    "enabled", user.isEnabled()
            );
        } catch (Exception e) {
            log.error("Token validation failed: {}", e.getMessage());
            throw new RuntimeException("Token validation failed: " + e.getMessage());
        }
    }

    public boolean hasPermission(String token, String permission) {
        try {
            Map<String, Object> userInfo = validateTokenForService(token);
            @SuppressWarnings("unchecked")
            Set<String> permissions = (Set<String>) userInfo.get("permissions");
            return permissions.contains(permission);
        } catch (Exception e) {
            log.error("Permission check failed: {}", e.getMessage());
            return false;
        }
    }

    public boolean hasRole(String token, String role) {
        try {
            Map<String, Object> userInfo = validateTokenForService(token);
            @SuppressWarnings("unchecked")
            Set<String> roles = (Set<String>) userInfo.get("roles");
            return roles.contains(role);
        } catch (Exception e) {
            log.error("Role check failed: {}", e.getMessage());
            return false;
        }
    }

    public boolean hasAnyRole(String token, Set<String> roles) {
        try {
            Map<String, Object> userInfo = validateTokenForService(token);
            @SuppressWarnings("unchecked")
            Set<String> userRoles = (Set<String>) userInfo.get("roles");
            return userRoles.stream().anyMatch(roles::contains);
        } catch (Exception e) {
            log.error("Role check failed: {}", e.getMessage());
            return false;
        }
    }

    public boolean hasAnyPermission(String token, Set<String> permissions) {
        try {
            Map<String, Object> userInfo = validateTokenForService(token);
            @SuppressWarnings("unchecked")
            Set<String> userPermissions = (Set<String>) userInfo.get("permissions");
            return userPermissions.stream().anyMatch(permissions::contains);
        } catch (Exception e) {
            log.error("Permission check failed: {}", e.getMessage());
            return false;
        }
    }

    public String generateServiceToken(String serviceName) {
        // Generate a special token for inter-service communication
        // This is a simplified approach - in production, you might use a different strategy
        try {
            java.lang.reflect.Method buildTokenMethod = jwtService.getClass().getDeclaredMethod(
                    "buildToken", Map.class, 
                    org.springframework.security.core.userdetails.UserDetails.class, 
                    long.class);
            buildTokenMethod.setAccessible(true);
            return (String) buildTokenMethod.invoke(
                    jwtService,
                    Map.of("service", serviceName, "type", "service"),
                    new ServiceUserDetails(serviceName),
                    24 * 60 * 60 * 1000L // 24 hours
            );
        } catch (Exception e) {
            log.error("Failed to generate service token: {}", e.getMessage());
            throw new RuntimeException("Failed to generate service token", e);
        }
    }

    // Inner class for service authentication
    private static class ServiceUserDetails implements org.springframework.security.core.userdetails.UserDetails {
        private final String serviceName;

        public ServiceUserDetails(String serviceName) {
            this.serviceName = serviceName;
        }

        @Override
        public java.util.Collection<? extends org.springframework.security.core.GrantedAuthority> getAuthorities() {
            return Set.of(() -> "ROLE_SERVICE");
        }

        @Override
        public String getPassword() {
            return "";
        }

        @Override
        public String getUsername() {
            return serviceName;
        }

        @Override
        public boolean isAccountNonExpired() {
            return true;
        }

        @Override
        public boolean isAccountNonLocked() {
            return true;
        }

        @Override
        public boolean isCredentialsNonExpired() {
            return true;
        }

        @Override
        public boolean isEnabled() {
            return true;
        }
    }
}