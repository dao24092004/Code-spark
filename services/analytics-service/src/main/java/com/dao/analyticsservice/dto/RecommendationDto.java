package com.dao.analyticsservice.dto;

import lombok.Data;

@Data
public class RecommendationDto {
    private String studentId;
    private String courseId;
    private String reason;
}
