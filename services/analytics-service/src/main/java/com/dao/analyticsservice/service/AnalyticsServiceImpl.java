package com.dao.analyticsservice.service;

import com.dao.analyticsservice.client.CourseServiceClient;
import com.dao.analyticsservice.client.IdentityServiceClient;
import com.dao.analyticsservice.dto.client.CourseSummaryDto;
import com.dao.analyticsservice.dto.client.PageResponse;
import com.dao.analyticsservice.dto.client.UserSummaryDto;
import com.dao.analyticsservice.dto.response.AnalyticsOverviewResponse;
import com.dao.analyticsservice.dto.response.CheatingStatsResponse;
import com.dao.analyticsservice.dto.response.DashboardResponse;
import com.dao.analyticsservice.dto.response.ExamResultResponse;
import com.dao.analyticsservice.dto.response.KpiMetricResponse;
import com.dao.analyticsservice.dto.response.RecommendationResponse;
import com.dao.analyticsservice.dto.response.ScoreTrendPoint;
import com.dao.analyticsservice.dto.response.TopCourseResponse;
import com.dao.analyticsservice.dto.response.TopPerformerResponse;
import com.dao.analyticsservice.entity.ExamResult;
import com.dao.analyticsservice.entity.ProctoringEvent;
import com.dao.analyticsservice.repository.ExamResultRepository;
import com.dao.analyticsservice.repository.ProctoringEventRepository;
import com.dao.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsServiceImpl implements AnalyticsService {

    private final ExamResultRepository examResultRepository;
    private final ProctoringEventRepository proctoringEventRepository;
    private final IdentityServiceClient identityServiceClient;
    private final CourseServiceClient courseServiceClient;

    @Override
    public List<ExamResultResponse> getExamResults(UUID examId, UUID userId) {
        List<ExamResult> results;
        if (examId != null) {
            results = examResultRepository.findByExamId(examId);
        } else if (userId != null) {
            results = examResultRepository.findByUserId(userId);
        } else {
            return Collections.emptyList();
        }

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
                .filter(event -> event.getEventType().contains("suspicious"))
                .count();

        Map<String, Long> eventTypeDistribution = events.stream()
                .collect(Collectors.groupingBy(ProctoringEvent::getEventType, Collectors.counting()));

        double cheatingRiskScore = events.isEmpty() ? 0 : (double) suspiciousEventsCount / events.size();

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
        return new DashboardResponse(
                userId,
                "USER",
                Map.of(
                        "totalExams", examResultRepository.countDistinctByExamIdIsNotNull(),
                        "averageScore", Optional.ofNullable(examResultRepository.findAverageScore()).orElse(0.0)
                ),
                getExamResults(null, userId),
                getRecommendations(userId)
        );
    }

    @Override
    public List<RecommendationResponse> getRecommendations(UUID userId) {
        return List.of(
                new RecommendationResponse(1L, "Advanced Java", "Based on recent performance", 0.8),
                new RecommendationResponse(2L, "Spring Boot Microservices", "Popular course", 0.7)
        );
    }

    @Override
    public AnalyticsOverviewResponse getAnalyticsOverview() {
        long totalExamSubmissions = examResultRepository.count();
        long distinctExams = examResultRepository.countDistinctByExamIdIsNotNull();
        long activeLearners = examResultRepository.countDistinctByUserIdIsNotNull();
        Double averageScore = Optional.ofNullable(examResultRepository.findAverageScore()).orElse(0.0);

        long totalUsers = fetchUsers().size();
        long totalCourses = fetchTotalCourses();

        return AnalyticsOverviewResponse.builder()
                .totalUsers(totalUsers)
                .activeUsers(activeLearners)
                .totalCourses(totalCourses)
                .totalExams(distinctExams)
                .totalExamSubmissions(totalExamSubmissions)
                .averageScore(round(averageScore))
                .build();
    }

    @Override
    public List<KpiMetricResponse> getKpiMetrics() {
        AnalyticsOverviewResponse overview = getAnalyticsOverview();

        long last7DaysAttempts = examResultRepository.countByCreatedAtBetween(LocalDateTime.now().minusDays(7), LocalDateTime.now());
        long previous7DaysAttempts = examResultRepository.countByCreatedAtBetween(LocalDateTime.now().minusDays(14), LocalDateTime.now().minusDays(7));

        double attemptChange = calculateChangePercentage(previous7DaysAttempts, last7DaysAttempts);

        Double lastWeekAvgScore = averageScoreForRange(LocalDate.now().minusDays(7), LocalDate.now());
        Double prevWeekAvgScore = averageScoreForRange(LocalDate.now().minusDays(14), LocalDate.now().minusDays(7));
        double scoreChange = calculateChangePercentage(prevWeekAvgScore, lastWeekAvgScore);

        double activeRate = overview.getTotalUsers() == 0
                ? 0
                : round(((double) overview.getActiveUsers() / overview.getTotalUsers()) * 100.0);

        return List.of(
                KpiMetricResponse.builder()
                        .id("kpi-active-users")
                        .title("Người dùng hoạt động")
                        .unit("learner")
                        .value(overview.getActiveUsers())
                        .changePercentage(activeRate)
                        .trend(determineTrend(activeRate, 50))
                        .build(),
                KpiMetricResponse.builder()
                        .id("kpi-average-score")
                        .title("Điểm trung bình")
                        .unit("điểm")
                        .value(overview.getAverageScore())
                        .changePercentage(scoreChange)
                        .trend(determineTrend(scoreChange, 0))
                        .build(),
                KpiMetricResponse.builder()
                        .id("kpi-exam-attempts")
                        .title("Lượt thi trong 7 ngày")
                        .unit("attempt")
                        .value(last7DaysAttempts)
                        .changePercentage(attemptChange)
                        .trend(determineTrend(attemptChange, 0))
                        .build()
        );
    }

    @Override
    public List<ScoreTrendPoint> getScoreTrend() {
        LocalDate today = LocalDate.now();
        LocalDate start = today.minusDays(29);
        List<ExamResult> results = examResultRepository.findByCreatedAtBetween(start.atStartOfDay(), today.plusDays(1).atStartOfDay());

        Map<LocalDate, List<ExamResult>> grouped = results.stream()
                .collect(Collectors.groupingBy(er -> er.getCreatedAt().toLocalDate()));

        return start.datesUntil(today.plusDays(1))
                .map(date -> {
                    List<ExamResult> dayResults = grouped.getOrDefault(date, Collections.emptyList());
                    double avg = dayResults.stream().mapToDouble(ExamResult::getScore).average().orElse(0.0);
                    return new ScoreTrendPoint(date, round(avg), dayResults.size());
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<TopPerformerResponse> getTopPerformers(int limit) {
        Map<UUID, List<ExamResult>> byUser = examResultRepository.findAll().stream()
                .collect(Collectors.groupingBy(ExamResult::getUserId));

        return byUser.entrySet().stream()
                .map(entry -> {
                    UUID userId = entry.getKey();
                    List<ExamResult> userResults = entry.getValue();
                    double avgScore = userResults.stream().mapToDouble(ExamResult::getScore).average().orElse(0.0);
                    long attempts = userResults.size();
                    String displayName = userId != null ? userId.toString() : "Unknown";
                    return new TopPerformerResponse(userId, displayName, round(avgScore), attempts);
                })
                .sorted(Comparator.comparingDouble(TopPerformerResponse::averageScore).reversed())
                .limit(limit)
                .collect(Collectors.toList());
    }

    @Override
    public List<TopCourseResponse> getTopCourses(int limit) {
        Map<UUID, List<ExamResult>> byExam = examResultRepository.findAll().stream()
                .collect(Collectors.groupingBy(ExamResult::getExamId));

        return byExam.entrySet().stream()
                .map(entry -> {
                    UUID courseId = entry.getKey();
                    List<ExamResult> examResults = entry.getValue();
                    double avgScore = examResults.stream().mapToDouble(ExamResult::getScore).average().orElse(0.0);

                    String title = "Khóa học " + courseId;
                    ApiResponse<CourseSummaryDto> courseResponse = courseServiceClient.getCourseById(courseId);
                    if (courseResponse != null && courseResponse.isSuccess() && courseResponse.getData() != null) {
                        title = courseResponse.getData().title();
                    }

                    return new TopCourseResponse(courseId, title, examResults.size(), round(avgScore));
                })
                .sorted(Comparator.comparingLong(TopCourseResponse::enrollmentCount).reversed())
                .limit(limit)
                .collect(Collectors.toList());
    }

    private List<UserSummaryDto> fetchUsers() {
        ApiResponse<List<UserSummaryDto>> response = identityServiceClient.getAllUsers();
        if (response == null || !response.isSuccess() || response.getData() == null) {
            return List.of();
        }
        return response.getData();
    }

    private long fetchTotalCourses() {
        ApiResponse<PageResponse<CourseSummaryDto>> response = courseServiceClient.getCourses(0, 1);
        if (response == null || !response.isSuccess() || response.getData() == null) {
            return 0;
        }
        return response.getData().getTotalElements();
    }

    private double calculateChangePercentage(double previous, double current) {
        if (previous <= 0) {
            return current > 0 ? 100.0 : 0.0;
        }
        return round(((current - previous) / previous) * 100.0);
    }

    private String determineTrend(double value, double baseline) {
        if (value > baseline) {
            return "up";
        }
        if (value < baseline) {
            return "down";
        }
        return "stable";
    }

    private double round(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    private double averageScoreForRange(LocalDate startInclusive, LocalDate endExclusive) {
        List<ExamResult> results = examResultRepository.findByCreatedAtBetween(startInclusive.atStartOfDay(), endExclusive.atStartOfDay());
        return results.stream().mapToDouble(ExamResult::getScore).average().orElse(0.0);
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
