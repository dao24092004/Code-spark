package com.dao.analyticsservice.dto.response;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class AnalyticsOverviewResponse {
    long totalUsers;
    long activeUsers;
    long totalCourses;
    long totalExams;
    long totalExamSubmissions;
    double averageScore;
}

