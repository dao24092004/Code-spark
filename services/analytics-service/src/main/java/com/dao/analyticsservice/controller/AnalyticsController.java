package com.dao.analyticsservice.controller;

import com.dao.analyticsservice.dto.AuditLogDto;
import com.dao.analyticsservice.dto.CheatingStatsDto;
import com.dao.analyticsservice.dto.DashboardDto;
import com.dao.analyticsservice.dto.ExamResultDto;
import com.dao.analyticsservice.dto.RecommendationDto;
import com.dao.analyticsservice.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/exam-results")
    public ResponseEntity<List<ExamResultDto>> getExamResults(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String classId) {
        return ResponseEntity.ok(analyticsService.getExamResults(userId, classId));
    }

    @GetMapping("/cheating-stats")
    public ResponseEntity<List<CheatingStatsDto>> getCheatingStats(
            @RequestParam String examId) {
        return ResponseEntity.ok(analyticsService.getCheatingStats(examId));
    }

    @GetMapping("/dashboards")
    public ResponseEntity<DashboardDto> getDashboard(
            @RequestParam String userId) {
        return ResponseEntity.ok(analyticsService.getDashboard(userId));
    }

    @GetMapping("/recommendations")
    public ResponseEntity<List<RecommendationDto>> getRecommendations(
            @RequestParam String studentId) {
        return ResponseEntity.ok(analyticsService.getRecommendations(studentId));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<List<AuditLogDto>> getAuditLogs() {
        return ResponseEntity.ok(analyticsService.getAuditLogs());
    }
}
