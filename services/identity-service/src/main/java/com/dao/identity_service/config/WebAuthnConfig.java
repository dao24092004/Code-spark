package com.dao.identity_service.config;

import com.dao.identity_service.key.YubicoCredentialRepository;
import com.yubico.webauthn.RelyingParty;
import com.yubico.webauthn.data.RelyingPartyIdentity;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashSet;
import java.util.Set;

@Configuration
@RequiredArgsConstructor
public class WebAuthnConfig {

    private final YubicoCredentialRepository credentialRepository;

    @Bean
    public RelyingParty relyingParty() {
        RelyingPartyIdentity rpIdentity = RelyingPartyIdentity.builder()
                .id("localhost") // This should match the rpId in the frontend
                .name("CodeSpark")
                .build();

        Set<String> origins = new HashSet<>();
        origins.add("http://localhost:4173");

        return RelyingParty.builder()
                .identity(rpIdentity)
                .credentialRepository(this.credentialRepository)
                .origins(origins) // The origin of the frontend
                .build();
    }
}
