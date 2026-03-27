package com.dao.identity_service.key;

import com.dao.identity_service.entity.User;
import com.dao.identity_service.repository.UserRepository;
import com.dao.common.exception.AppException;
import com.yubico.webauthn.*;
import com.yubico.webauthn.data.*;
import com.yubico.webauthn.data.ClientRegistrationExtensionOutputs;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class WebAuthnService {

    private final WebAuthnCredentialRepository credentialRepository;
    private final UserRepository userRepository;
    private final RelyingParty relyingParty;
    private final Map<String, PublicKeyCredentialCreationOptions> registrationChallenges = new ConcurrentHashMap<>();
    private final Map<String, AssertionRequest> assertionRequests = new ConcurrentHashMap<>();

    public WebAuthnService(WebAuthnCredentialRepository credentialRepository,
                            UserRepository userRepository,
                            RelyingParty relyingParty) {
        this.credentialRepository = credentialRepository;
        this.userRepository = userRepository;
        this.relyingParty = relyingParty;
    }

    @Transactional(readOnly = true)
    public AssertionRequest startAuthentication(String username) {
        if (credentialRepository.findByUsername(username).isEmpty()) {
            throw new AppException("User not found or no WebAuthn credentials registered for this user.", HttpStatus.BAD_REQUEST);
        }
        AssertionRequest assertionRequest = relyingParty.startAssertion(StartAssertionOptions.builder()
            .username(username)
            .build());
        assertionRequests.put(username, assertionRequest);
        return assertionRequest;
    }

    @Transactional
    public WebAuthnAuthenticationResult finishAuthentication(String responseJson) {
        try {
            var response = PublicKeyCredential.parseAssertionResponseJson(responseJson);
            ByteArray userHandle = response.getResponse().getUserHandle().orElseThrow();
            String username = new String(userHandle.getBytes(), java.nio.charset.StandardCharsets.UTF_8);

            AssertionRequest assertionRequest = assertionRequests.get(username);
            if (assertionRequest == null) {
                throw new AppException("No authentication challenge found for user.", HttpStatus.BAD_REQUEST);
            }

            com.yubico.webauthn.AssertionResult result = relyingParty.finishAssertion(FinishAssertionOptions.builder()
                .request(assertionRequest)
                .response(response)
                .build());

            if (result.isSuccess()) {
                byte[] credId = result.getCredential().getCredentialId().getBytes();
                Optional<WebAuthnCredential> credOpt = credentialRepository.findByCredentialId(credId);
                if (credOpt.isPresent()) {
                    WebAuthnCredential cred = credOpt.get();
                    cred.setCounter(result.getSignatureCount());
                    cred.setLastUsedAt(java.time.Instant.now());
                    credentialRepository.save(cred);
                }
                assertionRequests.remove(username);
                return new WebAuthnAuthenticationResult(true, username, Base64.getUrlEncoder().encodeToString(credId));
            } else {
                assertionRequests.remove(username);
                return new WebAuthnAuthenticationResult(false, null, null);
            }
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException("Authentication failed: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @Transactional(readOnly = true)
    public PublicKeyCredentialCreationOptions startRegistration(String username, String displayName) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException("User not found: " + username, HttpStatus.NOT_FOUND));

        StartRegistrationOptions options = StartRegistrationOptions.builder()
                .user(UserIdentity.builder()
                        .name(username)
                        .displayName(displayName != null ? displayName : username)
                        .id(new ByteArray(user.getId().toString().getBytes(java.nio.charset.StandardCharsets.UTF_8)))
                        .build())
                .build();
        PublicKeyCredentialCreationOptions creationOptions = relyingParty.startRegistration(options);
        registrationChallenges.put(username, creationOptions);
        return creationOptions;
    }

    @Transactional
    public WebAuthnRegistrationResult finishRegistration(String username, String responseJson) {
        try {
            PublicKeyCredentialCreationOptions creationOptions = registrationChallenges.get(username);
            if (creationOptions == null) {
                throw new AppException("No registration challenge found for user.", HttpStatus.BAD_REQUEST);
            }

            com.yubico.webauthn.RegistrationResult registrationResult = relyingParty.finishRegistration(
                FinishRegistrationOptions.builder()
                    .request(creationOptions)
                    .response(PublicKeyCredential.parseRegistrationResponseJson(responseJson))
                    .build());

            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new AppException("User not found: " + username, HttpStatus.NOT_FOUND));

            byte[] userHandle = user.getId().toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);

            WebAuthnCredential newCredential = new WebAuthnCredential();
            newCredential.setUser(user);
            newCredential.setUsername(username);
            newCredential.setUserHandle(userHandle);
            newCredential.setCredentialId(registrationResult.getKeyId().getId().getBytes());
            newCredential.setPublicKey(registrationResult.getPublicKeyCose().getBytes());
            newCredential.setCounter(registrationResult.getSignatureCount());

            credentialRepository.save(newCredential);
            registrationChallenges.remove(username);

            return new WebAuthnRegistrationResult(true, "Registration successful", username);

        } catch (AppException e) {
            registrationChallenges.remove(username);
            throw e;
        } catch (Exception e) {
            registrationChallenges.remove(username);
            throw new AppException("Registration failed: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @Transactional
    public void deleteCredential(String username, byte[] credentialId) {
        WebAuthnCredential cred = credentialRepository.findByCredentialId(credentialId)
                .orElseThrow(() -> new AppException("Credential not found", HttpStatus.NOT_FOUND));
        if (!cred.getUsername().equals(username)) {
            throw new AppException("Credential does not belong to user", HttpStatus.FORBIDDEN);
        }
        credentialRepository.delete(cred);
    }

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
        private final String username;

        public WebAuthnRegistrationResult(boolean success, String message, String username) {
            this.success = success;
            this.message = message;
            this.username = username;
        }

        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
        public String getUsername() { return username; }
    }
}
