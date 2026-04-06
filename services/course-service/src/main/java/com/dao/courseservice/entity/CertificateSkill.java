package com.dao.courseservice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "cm_certificate_skills", indexes = {
    @Index(name = "idx_cm_cert_skill_cert", columnList = "certificate_id"),
    @Index(name = "idx_cm_cert_skill_name", columnList = "skill_name")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CertificateSkill {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "certificate_id", nullable = false)
    private Certificate certificate;

    @Column(name = "skill_name", nullable = false, length = 255)
    private String skillName;

    @Column(name = "skill_level", length = 50)
    private String skillLevel;

    @Column(name = "earned_at")
    private LocalDateTime earnedAt;
}
