package com.dao.courseservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "cm_rewards", indexes = {
    @Index(name = "idx_cm_rewards_student", columnList = "student_id"),
    @Index(name = "idx_cm_rewards_course", columnList = "course_id"),
    @Index(name = "idx_cm_rewards_awarded_at", columnList = "awarded_at DESC")
})
public class Reward {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "student_id", nullable = false)
    private UUID studentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(name = "tokens_awarded", nullable = false)
    private Integer tokensAwarded;

    @Column(name = "reason_code", length = 50)
    private String reasonCode;

    @Column(name = "related_id", length = 255)
    private String relatedId;

    @Column(name = "transaction_type", length = 10)
    private String transactionType;

    @CreationTimestamp
    @Column(name = "awarded_at", nullable = false, updatable = false)
    private LocalDateTime awardedAt;

    /** Convenience getter for DTO/mapping; course is the owning side of the relation. */
    public UUID getCourseId() {
        return course == null ? null : course.getId();
    }
}
