package com.dao.analyticsservice.service;

import com.dao.analyticsservice.dto.response.AnalyticsOverviewResponse;
import com.dao.analyticsservice.dto.response.CheatingStatsResponse;
import com.dao.analyticsservice.dto.response.DashboardResponse;
import com.dao.analyticsservice.dto.response.ExamResultResponse;
import com.dao.analyticsservice.dto.response.KpiMetricResponse;
import com.dao.analyticsservice.dto.response.RecommendationResponse;
import com.dao.analyticsservice.dto.response.ScoreTrendPoint;
import com.dao.analyticsservice.dto.response.TopCourseResponse;
import com.dao.analyticsservice.dto.response.TopPerformerResponse;

import java.util.List;
import java.util.UUID;

public interface AnalyticsService {
    List<ExamResultResponse> getExamResults(UUID examId, UUID userId);
    CheatingStatsResponse getCheatingStats(UUID examId);
    DashboardResponse getDashboardData(UUID userId);
    List<RecommendationResponse> getRecommendations(UUID userId);
    AnalyticsOverviewResponse getAnalyticsOverview();
    List<KpiMetricResponse> getKpiMetrics();
    List<ScoreTrendPoint> getScoreTrend();
    List<TopPerformerResponse> getTopPerformers(int limit);
    List<TopCourseResponse> getTopCourses(int limit);
}
