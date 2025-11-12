package com.dao.examservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entity representing exam status lookup table
 * Examples: draft, published, ongoing, ended, archived
 */
@Entity
@Table(name = "exam_statuses")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamStatus {

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

