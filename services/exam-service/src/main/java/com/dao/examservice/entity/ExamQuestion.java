package com.dao.examservice.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Junction entity for many-to-many relationship between Exams and Questions.
 * Stores which questions belong to which exam, with additional metadata like order and score.
 */
@Entity
@Table(name = "exam_questions")
public class ExamQuestion {

    @Id
    @GeneratedValue
    @Column(columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    /**
     * Order/position of question in the exam (1-indexed).
     * Allows admin to reorder questions.
     */
    @Column(name = "display_order")
    private Integer displayOrder;

    /**
     * Score for this question in this specific exam.
     * Overrides the default score in Question entity if set.
     */
    @Column(name = "score")
    private Integer score;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    // ==================== Constructors ====================

    public ExamQuestion() {}

    public ExamQuestion(Exam exam, Question question, Integer displayOrder) {
        this.exam = exam;
        this.question = question;
        this.displayOrder = displayOrder;
        this.score = question.getScore(); // Copy default score from question
    }

    // ==================== Getters & Setters ====================

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Exam getExam() {
        return exam;
    }

    public void setExam(Exam exam) {
        this.exam = exam;
    }

    public Question getQuestion() {
        return question;
    }

    public void setQuestion(Question question) {
        this.question = question;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }

    public Integer getScore() {
        return score;
    }

    public void setScore(Integer score) {
        this.score = score;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}

