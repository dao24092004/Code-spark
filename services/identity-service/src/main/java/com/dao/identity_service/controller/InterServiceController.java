package com.dao.identity_service.controller;

import com.dao.identity_service.dto.ApiResponse;
import com.dao.identity_service.service.InterServiceAuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/v1/inter-service")
@RequiredArgsConstructor
@Slf4j
public class InterServiceController {

    private final InterServiceAuthService interServiceAuthService;

    @PostMapping("/validate-token")
    public ResponseEntity<ApiResponse<Map<String, Object>>> validateToken(@RequestParam String token) {
        try {
            Map<String, Object> userInfo = interServiceAuthService.validateTokenForService(token);
            return ResponseEntity.ok(ApiResponse.success("Token is valid", userInfo));
        } catch (Exception e) {
            log.error("Token validation failed: {}", e.getMessage());
            return ResponseEntity.status(401)
                    .body(ApiResponse.error("Token validation failed", e.getMessage()));
        }
    }

    @PostMapping("/check-permission")
    public ResponseEntity<ApiResponse<Boolean>> checkPermission(
            @RequestParam String token,
            @RequestParam String permission
    ) {
        try {
            boolean hasPermission = interServiceAuthService.hasPermission(token, permission);
            return ResponseEntity.ok(ApiResponse.success(hasPermission));
        } catch (Exception e) {
            log.error("Permission check failed: {}", e.getMessage());
            return ResponseEntity.status(401)
                    .body(ApiResponse.error("Permission check failed", e.getMessage()));
        }
    }

    @PostMapping("/check-role")
    public ResponseEntity<ApiResponse<Boolean>> checkRole(
            @RequestParam String token,
            @RequestParam String role
    ) {
        try {
            boolean hasRole = interServiceAuthService.hasRole(token, role);
            return ResponseEntity.ok(ApiResponse.success(hasRole));
        } catch (Exception e) {
            log.error("Role check failed: {}", e.getMessage());
            return ResponseEntity.status(401)
                    .body(ApiResponse.error("Role check failed", e.getMessage()));
        }
    }

    @PostMapping("/check-any-role")
    public ResponseEntity<ApiResponse<Boolean>> checkAnyRole(
            @RequestParam String token,
            @RequestBody Set<String> roles
    ) {
        try {
            boolean hasAnyRole = interServiceAuthService.hasAnyRole(token, roles);
            return ResponseEntity.ok(ApiResponse.success(hasAnyRole));
        } catch (Exception e) {
            log.error("Role check failed: {}", e.getMessage());
            return ResponseEntity.status(401)
                    .body(ApiResponse.error("Role check failed", e.getMessage()));
        }
    }

    @PostMapping("/check-any-permission")
    public ResponseEntity<ApiResponse<Boolean>> checkAnyPermission(
            @RequestParam String token,
            @RequestBody Set<String> permissions
    ) {
        try {
            boolean hasAnyPermission = interServiceAuthService.hasAnyPermission(token, permissions);
            return ResponseEntity.ok(ApiResponse.success(hasAnyPermission));
        } catch (Exception e) {
            log.error("Permission check failed: {}", e.getMessage());
            return ResponseEntity.status(401)
                    .body(ApiResponse.error("Permission check failed", e.getMessage()));
        }
    }

    @PostMapping("/generate-service-token")
    public ResponseEntity<ApiResponse<String>> generateServiceToken(@RequestParam String serviceName) {
        try {
            String token = interServiceAuthService.generateServiceToken(serviceName);
            return ResponseEntity.ok(ApiResponse.success("Service token generated", token));
        } catch (Exception e) {
            log.error("Service token generation failed: {}", e.getMessage());
            return ResponseEntity.status(500)
                    .body(ApiResponse.error("Service token generation failed", e.getMessage()));
        }
    }
}