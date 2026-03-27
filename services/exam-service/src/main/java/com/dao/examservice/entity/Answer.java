package com.dao.examservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "answers", indexes = {
    @Index(name = "idx_answers_submission", columnList = "submission_id"),
    @Index(name = "idx_answers_question", columnList = "question_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Answer {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_id", nullable = false)
    private QuizSubmission submission;

    @Column(name = "question_id", columnDefinition = "uuid", nullable = false)
    private UUID questionId;

    @Column(name = "selected_answer", columnDefinition = "text", nullable = false)
    private String selectedAnswer;

    @Column(precision = 5, scale = 2)
    private BigDecimal score;

    @Column(name = "instructor_comment", columnDefinition = "text")
    private String instructorComment;

    @Column(name = "is_correct")
    private Boolean isCorrect;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
