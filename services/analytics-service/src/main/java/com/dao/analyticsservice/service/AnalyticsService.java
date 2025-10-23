package com.dao.analyticsservice.service;

import com.dao.analyticsservice.dto.response.CheatingStatsResponse;
import com.dao.analyticsservice.dto.response.DashboardResponse;
import com.dao.analyticsservice.dto.response.ExamResultResponse;
import com.dao.analyticsservice.dto.response.RecommendationResponse;

import java.util.List;
import java.util.UUID;

public interface AnalyticsService {
    List<ExamResultResponse> getExamResults(UUID examId, UUID userId);
    CheatingStatsResponse getCheatingStats(UUID examId);
    DashboardResponse getDashboardData(UUID userId);
    List<RecommendationResponse> getRecommendations(UUID userId);
}
