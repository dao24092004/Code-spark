package com.dao.courseservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "cm_material_progress",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"student_id", "material_id"})
    },
    indexes = {
        @Index(name = "idx_cm_material_progress_student", columnList = "student_id"),
        @Index(name = "idx_cm_material_progress_material", columnList = "material_id"),
        @Index(name = "idx_cm_material_progress_completed", columnList = "completed_at")
    })
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaterialProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "student_id", nullable = false)
    private UUID studentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "material_id", nullable = false)
    private Material material;

    @CreationTimestamp
    @Column(name = "completed_at", nullable = false, updatable = false)
    private LocalDateTime completedAt;
}
