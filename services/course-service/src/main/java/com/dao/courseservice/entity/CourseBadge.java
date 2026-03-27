package com.dao.courseservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "cm_course_badges", indexes = {
    @Index(name = "idx_cm_course_badges_course", columnList = "course_id"),
    @Index(name = "idx_cm_course_badges_org", columnList = "organization_id")
}, uniqueConstraints = {
    @UniqueConstraint(name = "uk_cm_course_badges_org_name", columnNames = {"organization_id", "badge_name"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseBadge {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "badge_name", nullable = false)
    private String badgeName;

    @Column(name = "badge_icon", length = 500)
    private String badgeIcon;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private Integer displayOrder = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
