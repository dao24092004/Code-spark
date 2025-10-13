package com.codespark.identityservice.key;

import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service xử lý WebAuthn/FIDO2 authentication (Simplified version for demo)
 * Trong thực tế sẽ sử dụng Yubico WebAuthn hoặc thư viện tương tự
 */
@Service
public class WebAuthnService {

    private final WebAuthnCredentialRepository credentialRepository;

    public WebAuthnService(WebAuthnCredentialRepository credentialRepository) {
        this.credentialRepository = credentialRepository;
    }

    /**
     * Tạo assertion options cho authentication (simplified)
     */
    public Map<String, Object> startAuthentication(String username) {
        // Kiểm tra user có tồn tại không
        Optional<byte[]> userIdOpt = credentialRepository.findUserIdByUsername(username);
        if (userIdOpt.isEmpty()) {
            throw new RuntimeException("User not found or no credentials registered");
        }

        // Tạo challenge ngẫu nhiên
        String challenge = generateChallenge();

        return Map.of(
            "challenge", challenge,
            "rpId", "localhost",
            "userId", Base64.getEncoder().encodeToString(userIdOpt.get()),
            "allowCredentials", getAllowCredentials(username)
        );
    }

    /**
     * Xác thực assertion từ client (simplified)
     */
    public WebAuthnAuthenticationResult finishAuthentication(String username,
                                                           String credentialId,
                                                           String clientDataJSON,
                                                           String authenticatorData,
                                                           String signature) {
        try {
            // Trong thực tế sẽ verify signature và authenticator data
            // Ở đây chỉ kiểm tra credential có tồn tại không

            Optional<WebAuthnCredential> credentialOpt = credentialRepository
                .findByCredentialId(Base64.getDecoder().decode(credentialId));

            if (credentialOpt.isPresent()) {
                WebAuthnCredential credential = credentialOpt.get();

                // Cập nhật last used time
                credential.setLastUsedAt(java.time.Instant.now());
                credentialRepository.save(credential);

                return new WebAuthnAuthenticationResult(
                    true,
                    credential.getUsername(),
                    credentialId
                );
            } else {
                return new WebAuthnAuthenticationResult(false, null, null);
            }

        } catch (Exception e) {
            return new WebAuthnAuthenticationResult(false, null, null);
        }
    }

    /**
     * Tạo registration options cho đăng ký thiết bị mới (simplified)
     */
    public Map<String, Object> startRegistration(String username, String displayName) {
        // Tạo user ID mới
        byte[] userId = generateUserId(username);
        String challenge = generateChallenge();

        return Map.of(
            "challenge", challenge,
            "rp", Map.of(
                "id", "localhost",
                "name", "CodeSpark"
            ),
            "user", Map.of(
                "id", Base64.getEncoder().encodeToString(userId),
                "name", username,
                "displayName", displayName != null ? displayName : username
            ),
            "pubKeyCredParams", List.of(
                Map.of("type", "public-key", "alg", -7),  // ES256
                Map.of("type", "public-key", "alg", -257) // RS256
            ),
            "authenticatorSelection", Map.of(
                "requireResidentKey", false,
                "userVerification", "discouraged"
            ),
            "attestation", "direct"
        );
    }

    /**
     * Hoàn thành quá trình đăng ký thiết bị (simplified)
     */
    public WebAuthnRegistrationResult finishRegistration(String username,
                                                        String credentialId,
                                                        String clientDataJSON,
                                                        String attestationObject,
                                                        String publicKey) {
        try {
            // Trong thực tế sẽ verify attestation object và public key
            // Ở đây chỉ lưu credential vào database

            WebAuthnCredential credential = new WebAuthnCredential();
            credential.setUsername(username);
            credential.setCredentialId(Base64.getDecoder().decode(credentialId));
            credential.setPublicKey(Base64.getDecoder().decode(publicKey));
            credential.setCounter(0L);

            credentialRepository.save(credential);

            return new WebAuthnRegistrationResult(true, "Registration successful");

        } catch (Exception e) {
            return new WebAuthnRegistrationResult(false, "Registration failed: " + e.getMessage());
        }
    }

    private String generateChallenge() {
        // Tạo challenge ngẫu nhiên 32 bytes
        byte[] challenge = new byte[32];
        new Random().nextBytes(challenge);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(challenge);
    }

    private byte[] generateUserId(String username) {
        // Tạo user ID từ username
        return username.getBytes();
    }

    private List<Map<String, Object>> getAllowCredentials(String username) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (WebAuthnCredential cred : credentialRepository.findByUsername(username)) {
            Map<String, Object> map = new HashMap<>();
            map.put("type", "public-key");
            map.put("id", Base64.getEncoder().encodeToString(cred.getCredentialId()));
            result.add(map);
        }
        return result;
    }

    // Simplified result classes
    public static class WebAuthnAuthenticationResult {
        private final boolean success;
        private final String username;
        private final String credentialId;

        public WebAuthnAuthenticationResult(boolean success, String username, String credentialId) {
            this.success = success;
            this.username = username;
            this.credentialId = credentialId;
        }

        public boolean isSuccess() { return success; }
        public String getUsername() { return username; }
        public String getCredentialId() { return credentialId; }
    }

    public static class WebAuthnRegistrationResult {
        private final boolean success;
        private final String message;

        public WebAuthnRegistrationResult(boolean success, String message) {
            this.success = success;
            this.message = message;
        }

        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
    }
}
