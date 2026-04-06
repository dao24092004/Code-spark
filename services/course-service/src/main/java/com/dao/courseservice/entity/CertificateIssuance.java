package com.dao.courseservice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "cm_certificate_issuances", indexes = {
    @Index(name = "idx_cm_cert_issue_cert", columnList = "certificate_id"),
    @Index(name = "idx_cm_cert_issue_performer", columnList = "performed_by"),
    @Index(name = "idx_cm_cert_issue_action", columnList = "action")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CertificateIssuance {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "certificate_id", nullable = false)
    private Certificate certificate;

    @Column(nullable = false, length = 20)
    private String action;

    @Column(name = "performed_by", nullable = false)
    private UUID performedBy;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Column(columnDefinition = "TEXT")
    private String metadata;

    @Column(name = "performed_at", nullable = false)
    private LocalDateTime performedAt;
}
