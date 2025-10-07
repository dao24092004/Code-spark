package com.dao.identity_service.service;

import com.dao.identity_service.entity.User;
import com.dao.identity_service.security.JwtService;
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
        return jwtService.generateServiceToken(serviceName);
    }
}