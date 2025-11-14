package com.dao.courseservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "course_metadata")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseMetadata {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;
    
    @OneToOne
    @JoinColumn(name = "course_id", nullable = false)
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
    private String category; // e.g., "Web Development", "Data Science", "Mobile Development"
    
    @Column(columnDefinition = "TEXT")
    private String subcategory; // e.g., "React", "Python", "Machine Learning"
    
    @Column(columnDefinition = "TEXT")
    private String tags; // Comma-separated tags for better search and recommendations
    
    @Column(columnDefinition = "TEXT")
    private String aiPromptContext; // Additional context for AI to understand the course better
}
