package com.dao.analyticsservice.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPerformanceResponse {
    private Long userId;
    private String username;
    private String fullName;
    private Long totalExamsTaken;
    private Double averageScore;
    private Long passedExams;
    private Long failedExams;
    private Double passRate;
    private List<ExamAttempt> recentAttempts;
    private List<String> strengths;
    private List<String> weaknesses;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExamAttempt {
        private UUID examId;
        private String examTitle;
        private Double score;
        private Boolean passed;
        private LocalDateTime attemptedAt;
    }
}
