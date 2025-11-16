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
public class CourseAnalyticsResponse {
    private UUID courseId;
    private String courseTitle;
    private Long totalEnrollments;
    private Long activeStudents;
    private Double completionRate;
    private Double averageScore;
    private List<ExamPerformance> examPerformances;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExamPerformance {
        private UUID examId;
        private String examTitle;
        private Long attempts;
        private Double averageScore;
    }
}
