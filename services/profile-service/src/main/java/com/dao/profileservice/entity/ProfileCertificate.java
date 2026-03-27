package com.dao.profileservice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * Chứng chỉ của profile.
 * Theo ERD: profile_certificates table.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "profile_certificates", indexes = {
        @Index(name = "idx_profile_certificates_profile_id", columnList = "profile_id"),
        @Index(name = "idx_profile_certificates_certificate_id", columnList = "certificate_id")
})
public class ProfileCertificate extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_pc_profile"))
    private Profile profile;

    @Column(name = "certificate_id", nullable = false)
    private UUID certificateId;

    @Column(name = "title", length = 500)
    private String title;

    @Column(name = "issuer", length = 255)
    private String issuer;

    @Column(name = "issued_at")
    private java.time.LocalDateTime issuedAt;

    @Column(name = "credential_url", columnDefinition = "TEXT")
    private String credentialUrl;

    @Builder
    public ProfileCertificate(Profile profile, UUID certificateId, String title,
                               String issuer, java.time.LocalDateTime issuedAt,
                               String credentialUrl) {
        this.profile = profile;
        this.certificateId = certificateId;
        this.title = title;
        this.issuer = issuer;
        this.issuedAt = issuedAt;
        this.credentialUrl = credentialUrl;
    }
}
