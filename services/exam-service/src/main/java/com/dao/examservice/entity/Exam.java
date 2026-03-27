package com.dao.examservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "exams", indexes = {
    @Index(name = "idx_exams_course", columnList = "course_id"),
    @Index(name = "idx_exams_status", columnList = "status"),
    @Index(name = "idx_exams_creator", columnList = "created_by"),
    @Index(name = "idx_exams_start_at", columnList = "start_at"),
    @Index(name = "idx_exams_end_at", columnList = "end_at")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Exam {

    public enum ExamStatus {
        DRAFT, SCHEDULED, OPEN, CLOSED, CANCELLED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "course_id", columnDefinition = "uuid")
    private UUID courseId;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "start_at")
    private Instant startAt;

    @Column(name = "end_at")
    private Instant endAt;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "pass_score")
    private Integer passScore;

    @Column(name = "max_attempts")
    private Integer maxAttempts;

    @Column(name = "total_questions")
    private Integer totalQuestions;

    @Column(name = "created_by", columnDefinition = "uuid")
    private UUID createdBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private ExamStatus status = ExamStatus.DRAFT;

    @Column(name = "randomize_question_order", nullable = false)
    @Builder.Default
    private Boolean randomizeQuestionOrder = false;

    @Column(name = "randomize_option_order", nullable = false)
    @Builder.Default
    private Boolean randomizeOptionOrder = false;

    @Column(name = "show_correct_answers", nullable = false)
    @Builder.Default
    private Boolean showCorrectAnswers = true;

    @Column(name = "partial_scoring_enabled", nullable = false)
    @Builder.Default
    private Boolean partialScoringEnabled = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @CreationTimestamp
    @Column(name = "updated_at", nullable = false, updatable = false)
    private Instant updatedAt;

    // Backward-compatible audit fields (kept in DB but not in ERD)
    @Column(name = "updated_by", columnDefinition = "uuid")
    private UUID updatedBy;

    @Column(name = "published_at")
    private Instant publishedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    // Backward-compatible metadata (kept in DB but not in ERD)
    @Column(name = "exam_type")
    private String examType;

    @Column(name = "difficulty")
    private Integer difficulty;

    // Relationships
    @OneToMany(mappedBy = "exam", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<ExamQuestion> examQuestions = new ArrayList<>();

    @OneToMany(mappedBy = "exam", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<ExamRegistration> registrations = new ArrayList<>();

    @OneToMany(mappedBy = "exam", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<ExamTag> tags = new ArrayList<>();

    @OneToMany(mappedBy = "exam", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<ExamSession> sessions = new ArrayList<>();

    // Backward-compatible methods
    public boolean isDeleted() { return deletedAt != null; }

    public void softDelete() { this.deletedAt = Instant.now(); }

    public void restore() { this.deletedAt = null; }
}
