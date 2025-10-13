

package com.codespark.identityservice.key;

import com.webauthn4j.springframework.security.authenticator.WebAuthnAuthenticator;
import com.webauthn4j.springframework.security.authenticator.WebAuthnAuthenticatorService;
import com.webauthn4j.springframework.security.userdetails.WebAuthnUser;
import com.webauthn4j.springframework.security.userdetails.WebAuthnUserService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class WebAuthnUserDetailsService implements WebAuthnUserService, WebAuthnAuthenticatorService {

    private final WebAuthnCredentialRepository credentialRepository;

    public WebAuthnUserDetailsService(WebAuthnCredentialRepository credentialRepository) {
        this.credentialRepository = credentialRepository;
    }

    @Override
    public WebAuthnUser loadUserByUsername(String username) throws UsernameNotFoundException {
        // This is a dummy implementation. You should fetch user details from your user store.
        return new WebAuthnUser(username, "password", List.of());
    }

    @Override
    public WebAuthnAuthenticator loadAuthenticatorByCredentialId(byte[] credentialId) {
        return credentialRepository.findByCredentialId(credentialId)
                .map(this::mapToWebAuthnAuthenticator)
                .orElseThrow(() -> new UsernameNotFoundException("Authenticator not found"));
    }

    @Override
    public List<WebAuthnAuthenticator> loadAuthenticatorsByUsername(String username) {
        return credentialRepository.findByUsername(username).stream()
                .map(this::mapToWebAuthnAuthenticator)
                .toList();
    }

    private WebAuthnAuthenticator mapToWebAuthnAuthenticator(WebAuthnCredential credential) {
        return new WebAuthnAuthenticator(
                credential.getCredentialId(),
                credential.getAuthenticatorData(),
                credential.getAttestationStatement(),
                credential.getCounter()
        );
    }
}