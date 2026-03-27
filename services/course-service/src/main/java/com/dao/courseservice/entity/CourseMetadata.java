package com.dao.courseservice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "course_metadata", indexes = {
    @Index(name = "idx_course_metadata_difficulty", columnList = "difficulty_level"),
    @Index(name = "idx_course_metadata_category", columnList = "category")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseMetadata {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(name = "learning_objectives", columnDefinition = "TEXT")
    private String learningObjectives;

    @Column(columnDefinition = "TEXT")
    private String prerequisites;

    @Column(name = "target_audience", columnDefinition = "TEXT")
    private String targetAudience;

    @Column(name = "skills_covered", columnDefinition = "TEXT")
    private String skillsCovered;

    @Column(name = "difficulty_level", length = 50)
    private String difficultyLevel;

    @Column(columnDefinition = "TEXT")
    private String category;

    @Column(columnDefinition = "TEXT")
    private String subcategory;

    @Column(columnDefinition = "TEXT")
    private String tags;

    @Column(name = "ai_prompt_context", columnDefinition = "TEXT")
    private String aiPromptContext;
}
