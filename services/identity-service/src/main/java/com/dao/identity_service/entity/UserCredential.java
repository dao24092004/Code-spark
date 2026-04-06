package com.dao.identity_service.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_credentials", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "credential_type", "key_version"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserCredential {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    User user;

    @Column(name = "credential_type", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    CredentialType credentialType;

    @Column(name = "key_version")
    @Builder.Default
    Integer keyVersion = 1;

    @Column(name = "credential_data", columnDefinition = "TEXT")
    String credentialData;

    @Column(name = "encrypted_credential_data", columnDefinition = "TEXT")
    String encryptedCredentialData;

    @Column(name = "expires_at")
    LocalDateTime expiresAt;

    @Column(name = "created_at")
    LocalDateTime createdAt;

    @Column(name = "updated_at")
    LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.keyVersion == null) {
            this.keyVersion = 1;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
