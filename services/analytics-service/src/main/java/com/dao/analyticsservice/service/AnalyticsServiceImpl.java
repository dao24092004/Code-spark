package com.dao.analyticsservice.service;

import com.dao.analyticsservice.dto.response.CheatingStatsResponse;
import com.dao.analyticsservice.dto.response.DashboardResponse;
import com.dao.analyticsservice.dto.response.ExamResultResponse;
import com.dao.analyticsservice.dto.response.RecommendationResponse;
import com.dao.analyticsservice.entity.ExamResult;
import com.dao.analyticsservice.entity.ProctoringEvent;
import com.dao.analyticsservice.repository.ExamResultRepository;
import com.dao.analyticsservice.repository.ProctoringEventRepository;
import com.dao.common.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AnalyticsServiceImpl implements AnalyticsService {

    @Autowired
    private ExamResultRepository examResultRepository;

    @Autowired
    private ProctoringEventRepository proctoringEventRepository;

    @Override
    public List<ExamResultResponse> getExamResults(UUID examId, UUID userId) {
        List<ExamResult> results;
        if (examId != null) {
            results = examResultRepository.findByExamId(examId);
        } else if (userId != null) {
            results = examResultRepository.findByUserId(userId);
        } else {
            // If both are null, return an empty list as no specific query can be made.
            return Collections.emptyList();
        }

        // Defensive null check. If the repository returns null, treat it as an empty list.
        if (results == null) {
            return Collections.emptyList();
        }

        return results.stream()
                .map(this::mapToExamResultResponse)
                .collect(Collectors.toList());
    }

    @Override
    public CheatingStatsResponse getCheatingStats(UUID examId) {
        List<ProctoringEvent> events = proctoringEventRepository.findByExamId(examId);

        long suspiciousEventsCount = events.stream()
                .filter(event -> event.getEventType().contains("suspicious")) // Example filter
                .count();

        Map<String, Long> eventTypeDistribution = events.stream()
                .collect(Collectors.groupingBy(ProctoringEvent::getEventType, Collectors.counting()));

        // Simple example for cheating risk score
        double cheatingRiskScore = (double) suspiciousEventsCount / events.size();

        return new CheatingStatsResponse(
                examId,
                (long) events.size(),
                suspiciousEventsCount,
                eventTypeDistribution,
                cheatingRiskScore
        );
    }

    @Override
    public DashboardResponse getDashboardData(UUID userId) {
        // This would involve aggregating data from multiple sources
        // For now, return a dummy response
        return new DashboardResponse(
                userId,
                "USER", // Example role
                Map.of("totalExams", 10, "averageScore", 75.5),
                getExamResults(null, userId), // Reuse existing method
                getRecommendations(userId)
        );
    }

    @Override
    public List<RecommendationResponse> getRecommendations(UUID userId) {
        // Logic to recommend courses based on exam results, progress, etc.
        // For now, return dummy data
        return List.of(
                new RecommendationResponse(1L, "Advanced Java", "Based on low score in Java exam", 0.8),
                new RecommendationResponse(2L, "Spring Boot Microservices", "Popular course", 0.7)
        );
    }

    private ExamResultResponse mapToExamResultResponse(ExamResult examResult) {
        return new ExamResultResponse(
                examResult.getId(),
                examResult.getExamId(),
                examResult.getSubmissionId(),
                examResult.getUserId(),
                examResult.getScore(),
                examResult.getCreatedAt()
        );
    }
}
