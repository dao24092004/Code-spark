package com.dao.analyticsservice.controller;

import com.dao.analyticsservice.dto.response.CheatingStatsResponse;
import com.dao.analyticsservice.dto.response.DashboardResponse;
import com.dao.analyticsservice.dto.response.ExamResultResponse;
import com.dao.analyticsservice.dto.response.RecommendationResponse;
import com.dao.analyticsservice.service.AnalyticsService;
import com.dao.common.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("analytics")
public class AnalyticsController {

    @Autowired
    private AnalyticsService analyticsService;

    @GetMapping("/exam-results")
    public ResponseEntity<ApiResponse<List<ExamResultResponse>>> getExamResults(
            @RequestParam(required = false) UUID examId,
            @RequestParam(required = false) UUID userId) {
        List<ExamResultResponse> results = analyticsService.getExamResults(examId, userId);
        return ResponseEntity.ok(ApiResponse.success("Exam results fetched successfully", results));
    }

    @GetMapping("/cheating-stats")
    public ResponseEntity<ApiResponse<CheatingStatsResponse>> getCheatingStats(
            @RequestParam UUID examId) {
        CheatingStatsResponse stats = analyticsService.getCheatingStats(examId);
        return ResponseEntity.ok(ApiResponse.success("Cheating statistics fetched successfully", stats));
    }

    @GetMapping("/dashboards")
    public ResponseEntity<ApiResponse<DashboardResponse>> getDashboardData(
            @RequestParam UUID userId) {
        DashboardResponse dashboard = analyticsService.getDashboardData(userId);
        return ResponseEntity.ok(ApiResponse.success("Dashboard data fetched successfully", dashboard));
    }

    @GetMapping("/recommendations")
    public ResponseEntity<ApiResponse<List<RecommendationResponse>>> getRecommendations(
            @RequestParam UUID userId) {
        List<RecommendationResponse> recommendations = analyticsService.getRecommendations(userId);
        return ResponseEntity.ok(ApiResponse.success("Recommendations fetched successfully", recommendations));
    }
}
