package com.dao.identity_service.key;

import com.dao.identity_service.entity.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "webauthn_credential")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class WebAuthnCredential {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    User user;

    @Column(name = "user_handle", nullable = false, columnDefinition = "bytea")
    byte[] userHandle;

    @Column(name = "credential_id", nullable = false, columnDefinition = "bytea", unique = true)
    byte[] credentialId;

    @Column(name = "username", nullable = false, length = 100)
    String username;

    @Column(name = "public_key", nullable = false, columnDefinition = "bytea")
    byte[] publicKey;

    @Column(nullable = false)
    Long counter;

    @Column(name = "created_at", nullable = false)
    Instant createdAt;

    @Column(name = "last_used_at")
    Instant lastUsedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        if (counter == null) {
            counter = 0L;
        }
    }
}
