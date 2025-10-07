package com.dao.identity_service.controller;

import com.dao.common.dto.ApiResponse;
import com.dao.identity_service.service.InterServiceAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/inter-service")
@RequiredArgsConstructor
public class InterServiceController {

    private final InterServiceAuthService interServiceAuthService;

    /**
     * Xác thực token cho giao tiếp giữa các service
     */
    @PostMapping("/validate-token")
    public ResponseEntity<ApiResponse<Map<String, Object>>> validateToken(@RequestParam String token) {
        Map<String, Object> userInfo = interServiceAuthService.validateTokenForService(token);
        return ResponseEntity.ok(ApiResponse.success("Token is valid", userInfo));
    }

    /**
     * Kiểm tra quyền từ token
     */
    @PostMapping("/check-permission")
    public ResponseEntity<ApiResponse<Boolean>> checkPermission(
            @RequestParam String token,
            @RequestParam String permission
    ) {
        boolean hasPermission = interServiceAuthService.hasPermission(token, permission);
        return ResponseEntity.ok(ApiResponse.success(hasPermission));
    }

    /**
     * Kiểm tra vai trò từ token
     */
    @PostMapping("/check-role")
    public ResponseEntity<ApiResponse<Boolean>> checkRole(
            @RequestParam String token,
            @RequestParam String role
    ) {
        boolean hasRole = interServiceAuthService.hasRole(token, role);
        return ResponseEntity.ok(ApiResponse.success(hasRole));
    }

    /**
     * Kiểm tra bất kỳ vai trò nào từ danh sách
     */
    @PostMapping("/check-any-role")
    public ResponseEntity<ApiResponse<Boolean>> checkAnyRole(
            @RequestParam String token,
            @RequestBody Set<String> roles
    ) {
        boolean hasAnyRole = interServiceAuthService.hasAnyRole(token, roles);
        return ResponseEntity.ok(ApiResponse.success(hasAnyRole));
    }

    /**
     * Kiểm tra bất kỳ quyền nào từ danh sách
     */
    @PostMapping("/check-any-permission")
    public ResponseEntity<ApiResponse<Boolean>> checkAnyPermission(
            @RequestParam String token,
            @RequestBody Set<String> permissions
    ) {
        boolean hasAnyPermission = interServiceAuthService.hasAnyPermission(token, permissions);
        return ResponseEntity.ok(ApiResponse.success(hasAnyPermission));
    }

    /**
     * Tạo token cho service
     */
    @PostMapping("/generate-service-token")
    public ResponseEntity<ApiResponse<String>> generateServiceToken(@RequestParam String serviceName) {
        String token = interServiceAuthService.generateServiceToken(serviceName);
        return ResponseEntity.ok(ApiResponse.success("Service token generated", token));
    }
}