package com.dao.courseservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "cm_progress",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"student_id", "course_id"})
    },
    indexes = {
        @Index(name = "idx_cm_progress_student", columnList = "student_id"),
        @Index(name = "idx_cm_progress_course", columnList = "course_id"),
        @Index(name = "idx_cm_progress_updated", columnList = "updated_at")
    })
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Progress {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "student_id", nullable = false)
    private UUID studentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(name = "percent_complete", nullable = false)
    @Builder.Default
    private Integer percentComplete = 0;

    @Column(name = "last_material_id")
    private UUID lastMaterialId;

    @Column(name = "passed_final_exam", nullable = false)
    @Builder.Default
    private boolean passedFinalExam = false;

    @Column(name = "course_completed", nullable = false)
    @Builder.Default
    private boolean courseCompleted = false;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
