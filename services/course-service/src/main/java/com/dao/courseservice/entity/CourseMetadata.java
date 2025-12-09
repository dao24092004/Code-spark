package com.dao.courseservice.entity;

import jakarta.persistence.*;
import lombok.*; // Import đầy đủ Lombok

import java.util.UUID;

@Entity
@Table(name = "course_metadata")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseMetadata {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID) // Nên dùng UUID cho đồng bộ
    private UUID id;

    @OneToOne
    @JoinColumn(name = "course_id", nullable = false)
    @ToString.Exclude // QUAN TRỌNG: Ngăn Lombok tạo vòng lặp vô tận khi in log
    private Course course;

    @Column(columnDefinition = "TEXT")
    private String learningObjectives;

    @Column(columnDefinition = "TEXT")
    private String prerequisites;

    @Column(columnDefinition = "TEXT")
    private String targetAudience;

    @Column(columnDefinition = "TEXT")
    private String skillsCovered;

    @Column(columnDefinition = "TEXT")
    private String difficultyLevel; // BEGINNER, INTERMEDIATE, ADVANCED

    @Column(columnDefinition = "TEXT")
    private String category;

    @Column(columnDefinition = "TEXT")
    private String subcategory;

    @Column(columnDefinition = "TEXT")
    private String tags;

    @Column(columnDefinition = "TEXT")
    private String aiPromptContext;
}