package com.dao.analyticsservice.dto.response;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationResponse {
    private Long courseId;
    private String courseTitle;
    private String reason;
    private Double confidenceScore;
}
