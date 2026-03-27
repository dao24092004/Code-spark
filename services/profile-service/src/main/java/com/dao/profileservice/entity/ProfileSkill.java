package com.dao.profileservice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * Kỹ năng được extract từ certificates.
 * Theo ERD: profile_skills table.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "profile_skills",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_profile_skills_profile_skill",
                        columnNames = {"profile_id", "skill_name"})
        },
        indexes = {
                @Index(name = "idx_profile_skills_profile_id", columnList = "profile_id")
        })
public class ProfileSkill extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id", nullable = false, referencedColumnName = "id",
            foreignKey = @ForeignKey(name = "fk_ps_profile"))
    private Profile profile;

    @Column(name = "skill_name", length = 100)
    private String skillName;

    @Column(name = "proficiency_level", length = 50)
    @Enumerated(EnumType.STRING)
    private ProficiencyLevel proficiencyLevel;

    @Column(name = "certificate_id")
    private UUID certificateId;

    @Column(name = "earned_at")
    private java.time.LocalDateTime earnedAt;

    @Builder
    public ProfileSkill(Profile profile, String skillName,
                        ProficiencyLevel proficiencyLevel,
                        UUID certificateId, java.time.LocalDateTime earnedAt) {
        this.profile = profile;
        this.skillName = skillName;
        this.proficiencyLevel = proficiencyLevel;
        this.certificateId = certificateId;
        this.earnedAt = earnedAt;
    }
}
