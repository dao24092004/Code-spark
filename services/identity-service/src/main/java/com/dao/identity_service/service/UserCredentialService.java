package com.dao.identity_service.service;

import com.dao.identity_service.entity.CredentialType;
import com.dao.identity_service.entity.User;
import com.dao.identity_service.entity.UserCredential;
import com.dao.identity_service.repository.UserCredentialRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UserCredentialService {

    private final UserCredentialRepository credentialRepository;

    public UserCredential createOAuthToken(User user, String accessToken, String refreshToken, LocalDateTime expiresAt) {
        UserCredential credential = UserCredential.builder()
                .user(user)
                .credentialType(CredentialType.OAUTH_TOKEN)
                .credentialData(accessToken)
                .encryptedCredentialData(refreshToken)
                .expiresAt(expiresAt)
                .keyVersion(1)
                .build();
        return credentialRepository.save(credential);
    }

    public UserCredential createApiKey(User user, String apiKey) {
        UserCredential credential = UserCredential.builder()
                .user(user)
                .credentialType(CredentialType.API_KEY)
                .credentialData(apiKey)
                .build();
        return credentialRepository.save(credential);
    }

    public UserCredential createMfaSecret(User user, String secret) {
        UserCredential credential = UserCredential.builder()
                .user(user)
                .credentialType(CredentialType.MFA_SECRET)
                .encryptedCredentialData(secret)
                .keyVersion(1)
                .build();
        return credentialRepository.save(credential);
    }

    public UserCredential createRecoveryCodes(User user, List<String> codes) {
        UserCredential credential = UserCredential.builder()
                .user(user)
                .credentialType(CredentialType.RECOVERY_CODE)
                .credentialData(String.join(",", codes))
                .build();
        return credentialRepository.save(credential);
    }

    @Transactional(readOnly = true)
    public List<UserCredential> getCredentialsByUser(UUID userId) {
        return credentialRepository.findByUserId(userId);
    }

    @Transactional(readOnly = true)
    public Optional<UserCredential> getValidOAuthToken(UUID userId) {
        List<UserCredential> tokens = credentialRepository.findValidCredentials(
                userId, CredentialType.OAUTH_TOKEN, LocalDateTime.now());
        return tokens.isEmpty() ? Optional.empty() : Optional.of(tokens.get(0));
    }

    @Transactional(readOnly = true)
    public Optional<UserCredential> getMfaSecret(UUID userId) {
        List<UserCredential> secrets = credentialRepository.findByUserIdAndCredentialType(
                userId, CredentialType.MFA_SECRET);
        return secrets.isEmpty() ? Optional.empty() : Optional.of(secrets.get(0));
    }

    @Transactional
    public void rotateApiKey(UUID credentialId) {
        UserCredential credential = credentialRepository.findById(credentialId)
                .orElseThrow(() -> new RuntimeException("Credential not found"));
        if (credential.getCredentialType() != CredentialType.API_KEY) {
            throw new RuntimeException("Only API_KEY credentials can be rotated");
        }
        credential.setCredentialData(generateNewApiKey());
        credentialRepository.save(credential);
    }

    @Transactional
    public void expireCredential(UUID credentialId) {
        UserCredential credential = credentialRepository.findById(credentialId)
                .orElseThrow(() -> new RuntimeException("Credential not found"));
        credential.setExpiresAt(LocalDateTime.now().minusSeconds(1));
        credentialRepository.save(credential);
    }

    @Transactional
    public void deleteCredential(UUID credentialId) {
        credentialRepository.deleteById(credentialId);
    }

    private String generateNewApiKey() {
        return "sk_" + UUID.randomUUID().toString().replace("-", "");
    }
}
