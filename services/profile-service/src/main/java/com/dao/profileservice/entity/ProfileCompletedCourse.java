package com.dao.profileservice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * Lịch sử khóa học hoàn thành.
 * Theo ERD: profile_completed_courses table.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "profile_completed_courses", indexes = {
        @Index(name = "idx_profile_completed_courses_profile_id", columnList = "profile_id"),
        @Index(name = "idx_profile_completed_courses_course_id", columnList = "course_id")
})
public class ProfileCompletedCourse extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_pcc_profile"))
    private Profile profile;

    @Column(name = "course_id", nullable = false)
    private UUID courseId;

    @Column(name = "completed_at")
    private java.time.LocalDateTime completedAt;

    @Column(name = "final_score")
    private Integer finalScore;

    @Builder
    public ProfileCompletedCourse(Profile profile, UUID courseId,
                                 java.time.LocalDateTime completedAt, Integer finalScore) {
        this.profile = profile;
        this.courseId = courseId;
        this.completedAt = completedAt;
        this.finalScore = finalScore;
    }
}
