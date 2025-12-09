package com.dao.courseservice.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class CourseAiDto {
    private UUID id;
    private String title;
    private String description;
    private BigDecimal price;

    // Các trường lấy từ Metadata
    private String level; // difficultyLevel
    private String category;
    private String skills; // skillsCovered
    private String objectives; // learningObjectives
    private String aiContext; // aiPromptContext
}