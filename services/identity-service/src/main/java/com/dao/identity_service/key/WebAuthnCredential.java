package com.dao.identity_service.key;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.Instant;

@Entity
@Table(name = "webauthn_credential")
@Getter
@Setter
public class WebAuthnCredential {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private byte[] credentialId;

    @Column(nullable = false)
    private String username;

    @Column(nullable = false)
    private byte[] publicKey;

    @Column(nullable = false)
    private Long counter;

    @Column(nullable = false)
    private Instant createdAt;

    @Column
    private Instant lastUsedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }
}
