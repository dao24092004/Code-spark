package com.dao.examservice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "quiz_rankings", indexes = {
    @Index(name = "idx_quiz_rankings_quiz", columnList = "quiz_id"),
    @Index(name = "idx_quiz_rankings_student", columnList = "student_id")
}, uniqueConstraints = {
    @UniqueConstraint(name = "uk_quiz_rankings_quiz_student", columnNames = {"quiz_id", "student_id"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizRanking {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "quiz_id", columnDefinition = "uuid", nullable = false)
    private UUID quizId;

    @Column(name = "student_id", columnDefinition = "uuid", nullable = false)
    private UUID studentId;

    @Column(name = "submission_id", columnDefinition = "uuid", nullable = false)
    private UUID submissionId;

    @Column(precision = 5, scale = 2)
    private BigDecimal percentile;

    private Integer rank;

    @Column(name = "total_submissions")
    private Integer totalSubmissions;
}
