package com.dao.examservice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "exam_registrations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RegistrationStatus status;

    @Column(name = "registered_at")
    private LocalDateTime registeredAt;

    @Column(name = "exam_start_time")
    private LocalDateTime examStartTime;

    @Column(name = "exam_end_time")
    private LocalDateTime examEndTime;

    @Column(name = "attempt_count")
    @Builder.Default
    private Integer attemptCount = 0;

    @Column(name = "max_attempts")
    private Integer maxAttempts;

    @PrePersist
    protected void onCreate() {
        this.registeredAt = LocalDateTime.now();
        this.status = RegistrationStatus.REGISTERED;
    }

    public enum RegistrationStatus {
        REGISTERED, CONFIRMED, CANCELLED, COMPLETED
    }
}
