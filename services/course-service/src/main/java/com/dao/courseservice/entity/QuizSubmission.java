package com.dao.courseservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "cm_quiz_submissions", indexes = {
    @Index(name = "idx_cm_quiz_submissions_quiz", columnList = "quiz_id"),
    @Index(name = "idx_cm_quiz_submissions_student", columnList = "student_id"),
    @Index(name = "idx_cm_quiz_submissions_time", columnList = "submitted_at DESC")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;

    @Column(name = "student_id", nullable = false)
    private UUID studentId;

    private Integer score;

    @Column(columnDefinition = "TEXT")
    private String answers;

    @CreationTimestamp
    @Column(name = "submitted_at", nullable = false, updatable = false)
    private LocalDateTime submittedAt;
}
