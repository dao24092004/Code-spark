package com.dao.analyticsservice.controller;

import com.dao.analyticsservice.dto.request.ExamResultsRequest;
import com.dao.analyticsservice.dto.response.AnalyticsOverviewResponse;
import com.dao.analyticsservice.dto.response.CheatingStatsResponse;
import com.dao.analyticsservice.dto.response.DashboardResponse;
import com.dao.analyticsservice.dto.response.ExamResultResponse;
import com.dao.analyticsservice.dto.response.KpiMetricResponse;
import com.dao.analyticsservice.dto.response.RecommendationResponse;
import com.dao.analyticsservice.dto.response.ScoreTrendPoint;
import com.dao.analyticsservice.dto.response.TopCourseResponse;
import com.dao.analyticsservice.dto.response.TopPerformerResponse;
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

    @PostMapping("/exam-results/search")
    public ResponseEntity<ApiResponse<List<ExamResultResponse>>> searchExamResults(
            @RequestBody ExamResultsRequest request) {
        List<ExamResultResponse> results = analyticsService.getExamResults(request.getExamId(), request.getUserId());
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

    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<AnalyticsOverviewResponse>> getOverview() {
        AnalyticsOverviewResponse overview = analyticsService.getAnalyticsOverview();
        return ResponseEntity.ok(ApiResponse.success("Overview fetched successfully", overview));
    }

    @GetMapping("/kpis")
    public ResponseEntity<ApiResponse<List<KpiMetricResponse>>> getKpis() {
        List<KpiMetricResponse> kpis = analyticsService.getKpiMetrics();
        return ResponseEntity.ok(ApiResponse.success("KPIs fetched successfully", kpis));
    }

    @GetMapping("/score-trend")
    public ResponseEntity<ApiResponse<List<ScoreTrendPoint>>> getScoreTrend() {
        List<ScoreTrendPoint> trend = analyticsService.getScoreTrend();
        return ResponseEntity.ok(ApiResponse.success("Score trend fetched successfully", trend));
    }

    @GetMapping("/top-performers")
    public ResponseEntity<ApiResponse<List<TopPerformerResponse>>> getTopPerformers(
            @RequestParam(value = "limit", defaultValue = "5") int limit) {
        List<TopPerformerResponse> performers = analyticsService.getTopPerformers(limit);
        return ResponseEntity.ok(ApiResponse.success("Top performers fetched successfully", performers));
    }

    @GetMapping("/top-courses")
    public ResponseEntity<ApiResponse<List<TopCourseResponse>>> getTopCourses(
            @RequestParam(value = "limit", defaultValue = "5") int limit) {
        List<TopCourseResponse> courses = analyticsService.getTopCourses(limit);
        return ResponseEntity.ok(ApiResponse.success("Top courses fetched successfully", courses));
    }

    @GetMapping("/exams/{examId}")
    public ResponseEntity<ApiResponse<com.dao.analyticsservice.dto.response.ExamAnalyticsResponse>> getExamAnalytics(
            @PathVariable UUID examId) {
        com.dao.analyticsservice.dto.response.ExamAnalyticsResponse analytics = analyticsService.getExamAnalytics(examId);
        return ResponseEntity.ok(ApiResponse.success("Exam analytics fetched successfully", analytics));
    }

    @GetMapping("/courses/{courseId}")
    public ResponseEntity<ApiResponse<com.dao.analyticsservice.dto.response.CourseAnalyticsResponse>> getCourseAnalytics(
            @PathVariable UUID courseId) {
        com.dao.analyticsservice.dto.response.CourseAnalyticsResponse analytics = analyticsService.getCourseAnalytics(courseId);
        return ResponseEntity.ok(ApiResponse.success("Course analytics fetched successfully", analytics));
    }

    @GetMapping("/users/{userId}/performance")
    public ResponseEntity<ApiResponse<com.dao.analyticsservice.dto.response.UserPerformanceResponse>> getUserPerformance(
            @PathVariable Long userId) {
        com.dao.analyticsservice.dto.response.UserPerformanceResponse performance = analyticsService.getUserPerformance(userId);
        return ResponseEntity.ok(ApiResponse.success("User performance fetched successfully", performance));
    }
}
