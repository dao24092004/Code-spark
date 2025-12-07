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
            .id("nckh2026.vercel.app")  // rpId phải là domain deploy
            .name("CodeSpark")
            .build();

    Set<String> origins = new HashSet<>();

    // 🌐 Origin deploy (bắt buộc)
    origins.add("https://nckh2026.vercel.app");

    // 💻 Origin local for development
    origins.add("http://localhost:3000");
    origins.add("http://localhost:4173");
    origins.add("http://localhost:5173"); // nếu dùng Vite port mặc định
    origins.add("http://127.0.0.1:5173");

    return RelyingParty.builder()
            .identity(rpIdentity)
            .credentialRepository(this.credentialRepository)
            .origins(origins)
            .build();
}

}
