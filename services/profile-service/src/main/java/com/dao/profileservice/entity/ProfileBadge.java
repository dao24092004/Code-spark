package com.dao.profileservice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * Huy hiệu đã đạt được.
 * Theo ERD: profile_badges table.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "profile_badges", indexes = {
        @Index(name = "idx_profile_badges_profile_id", columnList = "profile_id"),
        @Index(name = "idx_profile_badges_badge_name", columnList = "badge_name")
})
public class ProfileBadge extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_pb_profile"))
    private Profile profile;

    @Column(name = "badge_name", length = 100)
    private String badgeName;

    @Column(name = "badge_icon", length = 255)
    private String badgeIcon;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "earned_at")
    private java.time.LocalDateTime earnedAt;

    @Column(name = "certificate_id")
    private UUID certificateId;

    @Column(name = "course_id")
    private UUID courseId;

    @Builder
    public ProfileBadge(Profile profile, String badgeName, String badgeIcon,
                       String description, java.time.LocalDateTime earnedAt,
                       UUID certificateId, UUID courseId) {
        this.profile = profile;
        this.badgeName = badgeName;
        this.badgeIcon = badgeIcon;
        this.description = description;
        this.earnedAt = earnedAt;
        this.certificateId = certificateId;
        this.courseId = courseId;
    }
}
