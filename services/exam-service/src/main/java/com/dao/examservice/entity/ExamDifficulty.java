package com.dao.examservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entity representing exam difficulty lookup table
 * Examples: easy, medium, hard
 */
@Entity
@Table(name = "exam_difficulties")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamDifficulty {

    @Id
    @Column(name = "code", length = 50)
    private String code;

    @Column(name = "label", length = 100, nullable = false)
    private String label;

    @Column(name = "label_vi", length = 100, nullable = false)
    private String labelVi;

    @Column(name = "description")
    private String description;

    @Column(name = "display_order")
    private Integer displayOrder = 0;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}

