package com.dao.analyticsservice.dto.response;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {
    private UUID userId;
    private String userRole;
    private Map<String, Object> generalStats;
    private List<ExamResultResponse> recentExamResults;
    private List<RecommendationResponse> recommendations;
    // Potentially more fields for aggregated data
}
