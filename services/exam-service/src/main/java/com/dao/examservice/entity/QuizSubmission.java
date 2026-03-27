package com.dao.examservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "quiz_submissions", indexes = {
    @Index(name = "idx_quiz_submissions_quiz", columnList = "quiz_id"),
    @Index(name = "idx_quiz_submissions_student", columnList = "student_id"),
    @Index(name = "idx_quiz_submissions_quiz_student", columnList = "quiz_id, student_id"),
    @Index(name = "idx_quiz_submissions_org", columnList = "organization_id"),
    @Index(name = "idx_quiz_submissions_submitted_at", columnList = "submitted_at DESC")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "organization_id", columnDefinition = "uuid")
    private UUID organizationId;

    @Column(name = "quiz_id", columnDefinition = "uuid")
    private UUID quizId;

    @Column(name = "student_id", columnDefinition = "uuid")
    private UUID studentId;

    private Integer score;

    @CreationTimestamp
    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(columnDefinition = "text")
    private String answers;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "time_spent_seconds")
    private Integer timeSpentSeconds;

    @Column(name = "correct_answers")
    private Integer correctAnswers;

    @Column(name = "wrong_answers")
    private Integer wrongAnswers;

    @Column(name = "total_questions")
    private Integer totalQuestions;

    @Column(name = "is_final", nullable = false)
    @Builder.Default
    private Boolean isFinal = false;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", columnDefinition = "text")
    private String userAgent;

    @Version
    @Builder.Default
    private Integer version = 1;

    @OneToMany(mappedBy = "submission", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Answer> answersList = new ArrayList<>();
}
