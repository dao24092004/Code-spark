package com.codespark.identityservice.controller;

import com.codespark.identityservice.key.WebAuthnService;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST Controller xử lý WebAuthn/FIDO2 authentication endpoints (Simplified version for demo)
 */
@RestController
@RequestMapping("/api/webauthn")
@CrossOrigin(origins = "http://localhost:8080") // Cho phép CORS từ frontend
public class WebAuthnController {

    @Autowired
    private WebAuthnService webAuthnService;

    /**
     * Bắt đầu quá trình authentication (get assertion options)
     */
    @PostMapping("/assertion/options")
    public ResponseEntity<?> startAuthentication(@RequestBody Map<String, String> request) {
        try {
            String username = request.get("username");
            if (username == null || username.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Username is required"));
            }

            Map<String, Object> options = webAuthnService.startAuthentication(username);

            return ResponseEntity.ok(options);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Hoàn thành quá trình authentication (verify assertion)
     */
    @PostMapping("/assertion/result")
    public ResponseEntity<?> finishAuthentication(@RequestBody AssertionResultRequest request) {
        try {
            WebAuthnService.WebAuthnAuthenticationResult result =
                webAuthnService.finishAuthentication(
                    request.getUsername(),
                    request.getCredentialId(),
                    request.getClientDataJSON(),
                    request.getAuthenticatorData(),
                    request.getSignature()
                );

            if (result.isSuccess()) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "username", result.getUsername(),
                    "credentialId", result.getCredentialId()
                ));
            } else {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Authentication failed"
                ));
            }

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }

    /**
     * Bắt đầu quá trình đăng ký thiết bị mới (get registration options)
     */
    @PostMapping("/registration/options")
    public ResponseEntity<?> startRegistration(@RequestBody RegistrationOptionsRequest request) {
        try {
            String username = request.getUsername();
            String displayName = request.getDisplayName();

            if (username == null || username.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Username is required"));
            }
            if (displayName == null || displayName.trim().isEmpty()) {
                displayName = username; // Sử dụng username làm display name mặc định
            }

            Map<String, Object> options = webAuthnService.startRegistration(username, displayName);

            return ResponseEntity.ok(options);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Hoàn thành quá trình đăng ký thiết bị
     */
    @PostMapping("/registration/result")
    public ResponseEntity<?> finishRegistration(@RequestBody RegistrationResultRequest request) {
        try {
            WebAuthnService.WebAuthnRegistrationResult result =
                webAuthnService.finishRegistration(
                    request.getUsername(),
                    request.getCredentialId(),
                    request.getClientDataJSON(),
                    request.getAttestationObject(),
                    request.getPublicKey()
                );

            return ResponseEntity.ok(Map.of(
                "success", result.isSuccess(),
                "message", result.getMessage()
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }

    // DTO classes cho request/response
    public static class AssertionResultRequest {
        @JsonProperty("username")
        private String username;

        @JsonProperty("credentialId")
        private String credentialId;

        @JsonProperty("clientDataJSON")
        private String clientDataJSON;

        @JsonProperty("authenticatorData")
        private String authenticatorData;

        @JsonProperty("signature")
        private String signature;

        // Getters and setters
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getCredentialId() { return credentialId; }
        public void setCredentialId(String credentialId) { this.credentialId = credentialId; }
        public String getClientDataJSON() { return clientDataJSON; }
        public void setClientDataJSON(String clientDataJSON) { this.clientDataJSON = clientDataJSON; }
        public String getAuthenticatorData() { return authenticatorData; }
        public void setAuthenticatorData(String authenticatorData) { this.authenticatorData = authenticatorData; }
        public String getSignature() { return signature; }
        public void setSignature(String signature) { this.signature = signature; }
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

    public static class RegistrationResultRequest {
        @JsonProperty("username")
        private String username;

        @JsonProperty("credentialId")
        private String credentialId;

        @JsonProperty("clientDataJSON")
        private String clientDataJSON;

        @JsonProperty("attestationObject")
        private String attestationObject;

        @JsonProperty("publicKey")
        private String publicKey;

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getCredentialId() { return credentialId; }
        public void setCredentialId(String credentialId) { this.credentialId = credentialId; }
        public String getClientDataJSON() { return clientDataJSON; }
        public void setClientDataJSON(String clientDataJSON) { this.clientDataJSON = clientDataJSON; }
        public String getAttestationObject() { return attestationObject; }
        public void setAttestationObject(String attestationObject) { this.attestationObject = attestationObject; }
        public String getPublicKey() { return publicKey; }
        public void setPublicKey(String publicKey) { this.publicKey = publicKey; }
    }
}
