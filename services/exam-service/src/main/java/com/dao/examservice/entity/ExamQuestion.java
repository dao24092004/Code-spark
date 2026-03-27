package com.dao.examservice.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "exam_questions", indexes = {
    @Index(name = "idx_exam_questions_exam", columnList = "exam_id"),
    @Index(name = "idx_exam_questions_display", columnList = "display_order"),
    @Index(name = "idx_exam_questions_exam_display", columnList = "exam_id, display_order")
})
public class ExamQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_exam_questions_exams"))
    private Exam exam;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(name = "display_order")
    private Integer displayOrder;

    @Column
    private Integer score;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public ExamQuestion() {}

    public ExamQuestion(Exam exam, Question question, Integer displayOrder) {
        this.exam = exam;
        this.question = question;
        this.displayOrder = displayOrder;
        this.score = question.getScore();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Exam getExam() { return exam; }
    public void setExam(Exam exam) { this.exam = exam; }

    public Question getQuestion() { return question; }
    public void setQuestion(Question question) { this.question = question; }

    public Integer getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }

    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
