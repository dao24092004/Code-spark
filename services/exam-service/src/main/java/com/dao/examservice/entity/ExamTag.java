package com.dao.examservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "exam_tags", indexes = {
    @Index(name = "idx_exam_tags_exam", columnList = "exam_id")
}, uniqueConstraints = {
    @UniqueConstraint(name = "uk_exam_tags_exam_tag", columnNames = {"exam_id", "tag"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamTag {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_exam_tags_exams"))
    private Exam exam;

    @Column(nullable = false, length = 100)
    private String tag;
}
