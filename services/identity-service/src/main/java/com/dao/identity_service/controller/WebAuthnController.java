package com.dao.identity_service.controller;

import com.dao.common.dto.ApiResponse;
import com.yubico.webauthn.AssertionRequest;
import com.dao.common.exception.AppException;
import com.dao.identity_service.dto.AuthResponse;
import com.dao.identity_service.entity.User;
import com.dao.identity_service.key.WebAuthnService;
import com.dao.identity_service.service.AuthService;
import com.dao.identity_service.service.UserService;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.yubico.webauthn.data.PublicKeyCredentialCreationOptions;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST Controller xử lý WebAuthn/FIDO2 authentication endpoints (Simplified version for demo)
 */
@RestController
@RequestMapping("/api/webauthn")
public class WebAuthnController {

    @Autowired
    private WebAuthnService webAuthnService;

    @Autowired
    private AuthService authService;

    @Autowired
    private UserService userService;

    @PostMapping("/assertion/options")
    public AssertionRequest startAuthentication(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        if (username == null || username.trim().isEmpty()) {
            throw new AppException("Username is required", HttpStatus.BAD_REQUEST);
        }
        return webAuthnService.startAuthentication(username);
    }

    /**
     * Hoàn thành quá trình authentication (verify assertion)
     */
    @PostMapping("/assertion/result")
    public ResponseEntity<ApiResponse<AuthResponse>> finishAuthentication(@RequestBody String request) {
        try {
            WebAuthnService.WebAuthnAuthenticationResult result =
                webAuthnService.finishAuthentication(request);

            if (result.isSuccess()) {
                User user = userService.findByUsernameOrEmail(result.getUsername())
                        .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));
                
                AuthResponse authResponse = authService.generateAuthResponseForUser(user);
                return ResponseEntity.ok(ApiResponse.success("WebAuthn login successful", authResponse));
            } else {
                return ResponseEntity.badRequest().body(ApiResponse.error("WebAuthn authentication failed"));
            }

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Bắt đầu quá trình đăng ký thiết bị mới (get registration options)
     */
    @PostMapping("/registration/options")
    public ResponseEntity<ApiResponse<PublicKeyCredentialCreationOptions>> startRegistration(@RequestBody RegistrationOptionsRequest request) {
        try {
            String username = request.getUsername();
            String displayName = request.getDisplayName();

            if (username == null || username.trim().isEmpty()) {
                throw new AppException("Username is required", HttpStatus.BAD_REQUEST);
            }
            if (displayName == null || displayName.trim().isEmpty()) {
                displayName = username;
            }

            PublicKeyCredentialCreationOptions options = webAuthnService.startRegistration(username, displayName);
            return ResponseEntity.ok(ApiResponse.success("Registration options created", options));
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            // Log chi tiết lỗi
            e.printStackTrace();
            throw new AppException("Failed to start registration: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Hoàn thành quá trình đăng ký thiết bị
     */
    @PostMapping("/registration/result/{username}")
    public ResponseEntity<ApiResponse<AuthResponse>> finishRegistration(@PathVariable String username, @RequestBody String request) {
        try {
            WebAuthnService.WebAuthnRegistrationResult result =
                webAuthnService.finishRegistration(username, request);

            if (result.isSuccess()) {
                User user = userService.findByUsernameOrEmail(result.getUsername())
                        .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));
                
                AuthResponse authResponse = authService.generateAuthResponseForUser(user);
                return ResponseEntity.ok(ApiResponse.success("WebAuthn registration successful", authResponse));
            } else {
                return ResponseEntity.badRequest().body(ApiResponse.error(result.getMessage()));
            }

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    public static class RegistrationOptionsRequest {
        @JsonProperty("username")
        private String username;

        @JsonProperty("displayName")
        private String displayName;

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getDisplayName() { return displayName; }
        public void setDisplayName(String displayName) { this.displayName = displayName; }
    }
}
