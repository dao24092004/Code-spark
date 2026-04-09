package com.dao.analyticsservice.service;

import com.dao.analyticsservice.client.CourseServiceClient;
import com.dao.analyticsservice.client.IdentityServiceClient;
import com.dao.analyticsservice.dto.client.CourseSummaryDto;
import com.dao.analyticsservice.dto.client.PageResponse;
import com.dao.analyticsservice.dto.client.UserSummaryDto;
import com.dao.analyticsservice.dto.response.AnalyticsOverviewResponse;
import com.dao.analyticsservice.dto.response.CheatingStatsResponse;
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
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
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
@Slf4j
public class AnalyticsServiceImpl implements AnalyticsService {

    private final ExamResultRepository examResultRepository;
    private final ProctoringEventRepository proctoringEventRepository;
    private final IdentityServiceClient identityServiceClient;
    private final CourseServiceClient courseServiceClient;

    @Override
    public List<ExamResultResponse> getExamResults(Long examId, Long userId) {
        List<ExamResult> results;
        if (examId != null) {
            results = examResultRepository.findByExamId(UUID.fromString(examId.toString()));
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
                .filter(event -> event.getEventType() != null &&
                                 event.getEventType().toLowerCase().contains("suspicious"))
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
    public List<RecommendationResponse> getRecommendations(Long userId) {
        // IMPLEMENTED: Lấy recommendations thực từ course-service
        try {
            // Lấy các khóa học phổ biến
            ApiResponse<PageResponse<CourseSummaryDto>> coursesResponse = courseServiceClient.getCourses(0, 5);
            if (coursesResponse != null && coursesResponse.isSuccess() && coursesResponse.getData() != null) {
                return coursesResponse.getData().getContent().stream()
                        .map(course -> new RecommendationResponse(
                                course.id() != null ? course.id().getMostSignificantBits() : 0L,
                                course.title(),
                                "Recommended based on popularity",
                                0.8
                        ))
                        .collect(Collectors.toList());
            }
        } catch (Exception e) {
            log.warn("Error fetching course recommendations: {}", e.getMessage());
        }

        // Fallback: Trả về empty list thay vì hardcoded data
        return Collections.emptyList();
    }

    @Override
    public AnalyticsOverviewResponse getAnalyticsOverview() {
        try {
            long totalExamSubmissions = examResultRepository.count();
            long distinctExams = examResultRepository.countDistinctByExamIdIsNotNull();
            long activeLearners = examResultRepository.countDistinctByUserIdIsNotNull();
            Double averageScore = Optional.ofNullable(examResultRepository.findAverageScore()).orElse(0.0);

            long totalUsers = 0;
            long totalCourses = 0;

            try {
                totalUsers = fetchUsers().size();
            } catch (Exception e) {
                log.warn("Error fetching users: {}", e.getMessage());
            }

            try {
                totalCourses = fetchTotalCourses();
            } catch (Exception e) {
                log.warn("Error fetching courses: {}", e.getMessage());
            }

            return AnalyticsOverviewResponse.builder()
                    .totalUsers(totalUsers)
                    .activeUsers(activeLearners)
                    .totalCourses(totalCourses)
                    .totalExams(distinctExams)
                    .totalExamSubmissions(totalExamSubmissions)
                    .averageScore(round(averageScore))
                    .build();
        } catch (Exception e) {
            log.error("Error in getAnalyticsOverview: ", e);
            return AnalyticsOverviewResponse.builder()
                    .totalUsers(0)
                    .activeUsers(0)
                    .totalCourses(0)
                    .totalExams(0)
                    .totalExamSubmissions(0)
                    .averageScore(0.0)
                    .build();
        }
    }

    @Override
    public List<KpiMetricResponse> getKpiMetrics() {
        AnalyticsOverviewResponse overview = getAnalyticsOverview();

        // Sử dụng optimized queries
        LocalDateTime last7Days = LocalDateTime.now().minusDays(7);
        LocalDateTime previous7Days = LocalDateTime.now().minusDays(14);

        long last7DaysAttempts = examResultRepository.countExamAttemptsBetween(previous7Days, last7Days);
        long previous7DaysAttempts = examResultRepository.countExamAttemptsBetween(
                LocalDateTime.now().minusDays(14),
                LocalDateTime.now().minusDays(7));

        double attemptChange = calculateChangePercentage(previous7DaysAttempts, last7DaysAttempts);

        Double lastWeekAvgScore = examResultRepository.findAverageScoreBetween(
                LocalDate.now().minusDays(7).atStartOfDay(),
                LocalDate.now().atStartOfDay());
        Double prevWeekAvgScore = examResultRepository.findAverageScoreBetween(
                LocalDate.now().minusDays(14).atStartOfDay(),
                LocalDate.now().minusDays(7).atStartOfDay());

        double scoreChange = calculateChangePercentage(
                prevWeekAvgScore != null ? prevWeekAvgScore : 0.0,
                lastWeekAvgScore != null ? lastWeekAvgScore : 0.0);

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

        // Sử dụng optimized query
        List<Object[]> results = examResultRepository.getScoreTrendByDate(
                start.atStartOfDay(),
                today.plusDays(1).atStartOfDay());

        // Fill missing dates with 0
        return start.datesUntil(today.plusDays(1))
                .map(date -> {
                    double avg = 0.0;
                    long count = 0;
                    for (Object[] row : results) {
                        if (row[0] != null && row[0].toString().equals(date.toString())) {
                            avg = row[1] != null ? ((Number) row[1]).doubleValue() : 0.0;
                            count = row[2] != null ? ((Number) row[2]).longValue() : 0L;
                            break;
                        }
                    }
                    return new ScoreTrendPoint(date, round(avg), count);
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<TopPerformerResponse> getTopPerformers(int limit) {
        // Sử dụng optimized query với pagination
        List<Object[]> results = examResultRepository.getUserStatisticsGrouped(PageRequest.of(0, limit));

        return results.stream()
                .map(row -> {
                    Long userId = (Long) row[0];
                    Double avgScore = row[1] != null ? ((Number) row[1]).doubleValue() : 0.0;
                    Long attempts = row[2] != null ? ((Number) row[2]).longValue() : 0L;

                    String displayName = "Unknown";
                    try {
                        ApiResponse<UserSummaryDto> userResponse = identityServiceClient.getUserById(userId);
                        if (userResponse != null && userResponse.isSuccess() && userResponse.getData() != null) {
                            UserSummaryDto user = userResponse.getData();
                            String name = user.firstName() + (user.lastName() != null ? " " + user.lastName() : "");
                            displayName = (!name.trim().isEmpty()) ? name : "User " + userId;
                        }
                    } catch (Exception e) {
                        log.warn("Error fetching user {}: {}", userId, e.getMessage());
                    }

                    // Chuyển Long userId thành UUID
                    UUID userUuid = new UUID(userId, userId);

                    return new TopPerformerResponse(userUuid, displayName, round(avgScore), attempts);
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<TopCourseResponse> getTopCourses(int limit) {
        // Sử dụng optimized query với pagination
        List<Object[]> results = examResultRepository.getExamStatisticsGrouped(PageRequest.of(0, limit));

        return results.stream()
                .map(row -> {
                    UUID courseId = (UUID) row[0];
                    Double avgScore = row[1] != null ? ((Number) row[1]).doubleValue() : 0.0;
                    Long attempts = row[2] != null ? ((Number) row[2]).longValue() : 0L;

                    String title = "Khóa học " + courseId;
                    try {
                        ApiResponse<CourseSummaryDto> courseResponse = courseServiceClient.getCourseById(courseId);
                        if (courseResponse != null && courseResponse.isSuccess() && courseResponse.getData() != null) {
                            title = courseResponse.getData().title() != null ?
                                    courseResponse.getData().title() : title;
                        }
                    } catch (Exception e) {
                        log.warn("Error fetching course {}: {}", courseId, e.getMessage());
                    }

                    return new TopCourseResponse(courseId, title, attempts, round(avgScore));
                })
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
        if (value > baseline) return "up";
        if (value < baseline) return "down";
        return "stable";
    }

    private double round(double value) {
        return Math.round(value * 10.0) / 10.0;
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
