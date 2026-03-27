package com.dao.courseservice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "cm_question_options", indexes = {
    @Index(name = "idx_cm_question_options_question", columnList = "question_id"),
    @Index(name = "idx_cm_question_options_correct", columnList = "question_id, is_correct")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionOption {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "is_correct", nullable = false)
    private boolean isCorrect;

    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;
}
