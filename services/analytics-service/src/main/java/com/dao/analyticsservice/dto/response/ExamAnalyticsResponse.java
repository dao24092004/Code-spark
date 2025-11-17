package com.dao.analyticsservice.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamAnalyticsResponse {
    private UUID examId;
    private String examTitle;
    private Long totalAttempts;
    private Double averageScore;
    private Double passRate;
    private Long totalParticipants;
    private List<ScoreDistribution> scoreDistribution;
    private CheatingStatsResponse cheatingStats;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScoreDistribution {
        private String range;
        private Long count;
        private Double percentage;
    }
}
