package com.dao.analyticsservice.service;

import com.dao.analyticsservice.client.CourseServiceClient;
import com.dao.analyticsservice.client.ExamServiceClient;
import com.dao.analyticsservice.client.IdentityServiceClient;
import com.dao.analyticsservice.client.ProctoringServiceClient;
import com.dao.analyticsservice.dto.client.CourseSummaryDto;
import com.dao.analyticsservice.dto.client.ExamSummaryDto;
import com.dao.analyticsservice.dto.client.PageResponse;
import com.dao.analyticsservice.dto.client.UserSummaryDto;
import com.dao.analyticsservice.dto.response.*;
import com.dao.analyticsservice.entity.ExamResult;
import com.dao.analyticsservice.entity.ProctoringEvent;
import com.dao.analyticsservice.repository.ExamResultRepository;
import com.dao.analyticsservice.repository.ProctoringEventRepository;
import com.dao.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsServiceImpl implements AnalyticsService {

    private final ExamResultRepository examResultRepository;
    private final ProctoringEventRepository proctoringEventRepository;
    private final IdentityServiceClient identityServiceClient;
    private final CourseServiceClient courseServiceClient;
    private final ExamServiceClient examServiceClient;
    private final ProctoringServiceClient proctoringServiceClient;

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
    @Transactional(readOnly = true)
    public AnalyticsOverviewResponse getAnalyticsOverview() {
        long totalUsers = getTotalUsersFromIdentityService();
        long totalCourses = getTotalCoursesFromCourseService();
        long activeLearners = examResultRepository.countDistinctByUserIdIsNotNull();
        long distinctExams = examResultRepository.countDistinctByExamIdIsNotNull();
        long totalExamSubmissions = examResultRepository.count();
        Double averageScore = Optional.ofNullable(examResultRepository.findAverageScore()).orElse(0.0);

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

        long last7DaysAttempts = examResultRepository.countByCreatedAtBetween(
                LocalDateTime.now().minusDays(7), LocalDateTime.now());
        long previous7DaysAttempts = examResultRepository.countByCreatedAtBetween(
                LocalDateTime.now().minusDays(14), LocalDateTime.now().minusDays(7));

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
        List<ExamResult> results = examResultRepository.findByCreatedAtBetween(
                start.atStartOfDay(), today.plusDays(1).atStartOfDay());

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
    @Transactional(readOnly = true)
    public List<TopPerformerResponse> getTopPerformers(int limit) {
        Map<UUID, List<ExamResult>> byUser = examResultRepository.findAll().stream()
                .collect(Collectors.groupingBy(ExamResult::getUserId));

        return byUser.entrySet().stream()
                .map(entry -> {
                    UUID userId = entry.getKey();
                    String displayName = getUserDisplayName(userId);

                    List<ExamResult> userResults = entry.getValue();
                    double avgScore = userResults.stream().mapToDouble(ExamResult::getScore).average().orElse(0.0);
                    long attempts = userResults.size();
                    return new TopPerformerResponse(userId, displayName, round(avgScore), attempts);
                })
                .sorted(Comparator.comparingDouble(TopPerformerResponse::averageScore).reversed())
                .limit(limit)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TopCourseResponse> getTopCourses(int limit) {
        Map<UUID, List<ExamResult>> byExam = examResultRepository.findAll().stream()
                .collect(Collectors.groupingBy(ExamResult::getExamId));

        return byExam.entrySet().stream()
                .map(entry -> {
                    UUID examId = entry.getKey();
                    String title = getExamTitle(examId);

                    List<ExamResult> examResults = entry.getValue();
                    double avgScore = examResults.stream().mapToDouble(ExamResult::getScore).average().orElse(0.0);

                    return new TopCourseResponse(examId, title, examResults.size(), round(avgScore));
                })
                .sorted(Comparator.comparingLong(TopCourseResponse::enrollmentCount).reversed())
                .limit(limit)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ExamAnalyticsResponse getExamAnalytics(UUID examId) {
        ExamSummaryDto examDto = getExamDetails(examId);
        String examTitle = examDto != null ? examDto.title() : "Unknown Exam";
        Double passScore = examDto != null ? examDto.passScore() : 50.0;

        List<ExamResult> results = examResultRepository.findByExamId(examId);
        
        long totalAttempts = results.size();
        double averageScore = results.stream().mapToDouble(ExamResult::getScore).average().orElse(0.0);
        long passedCount = results.stream().filter(r -> r.getScore() >= passScore).count();
        double passRate = totalAttempts > 0 ? (double) passedCount / totalAttempts * 100 : 0.0;
        long totalParticipants = results.stream().map(ExamResult::getUserId).distinct().count();

        List<ExamAnalyticsResponse.ScoreDistribution> distribution = calculateScoreDistribution(results);
        CheatingStatsResponse cheatingStats = getCheatingStats(examId);

        return ExamAnalyticsResponse.builder()
                .examId(examId)
                .examTitle(examTitle)
                .totalAttempts(totalAttempts)
                .averageScore(round(averageScore))
                .passRate(round(passRate))
                .totalParticipants(totalParticipants)
                .scoreDistribution(distribution)
                .cheatingStats(cheatingStats)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public CourseAnalyticsResponse getCourseAnalytics(UUID courseId) {
        CourseSummaryDto courseDto = getCourseDetails(courseId);
        String courseTitle = courseDto != null ? courseDto.title() : "Unknown Course";
        Long enrollmentCount = courseDto != null ? courseDto.enrollmentCount() : 0L;

        List<ExamResult> allResults = examResultRepository.findAll();
        
        long activeStudents = allResults.stream()
                .map(ExamResult::getUserId)
                .distinct()
                .count();

        double averageScore = allResults.stream()
                .mapToDouble(ExamResult::getScore)
                .average()
                .orElse(0.0);

        double completionRate = enrollmentCount > 0 ? (double) activeStudents / enrollmentCount * 100 : 0.0;

        Map<UUID, List<ExamResult>> byExam = allResults.stream()
                .collect(Collectors.groupingBy(ExamResult::getExamId));

        List<CourseAnalyticsResponse.ExamPerformance> examPerformances = 
            byExam.entrySet().stream()
                .map(entry -> {
                    UUID examId = entry.getKey();
                    List<ExamResult> examResults = entry.getValue();
                    String examTitle = getExamTitle(examId);

                    double avgScore = examResults.stream()
                            .mapToDouble(ExamResult::getScore)
                            .average()
                            .orElse(0.0);

                    return CourseAnalyticsResponse.ExamPerformance.builder()
                            .examId(examId)
                            .examTitle(examTitle)
                            .attempts((long) examResults.size())
                            .averageScore(round(avgScore))
                            .build();
                })
                .sorted(Comparator.comparingLong(CourseAnalyticsResponse.ExamPerformance::getAttempts).reversed())
                .limit(10)
                .collect(Collectors.toList());

        return CourseAnalyticsResponse.builder()
                .courseId(courseId)
                .courseTitle(courseTitle)
                .totalEnrollments(enrollmentCount)
                .activeStudents(activeStudents)
                .completionRate(round(completionRate))
                .averageScore(round(averageScore))
                .examPerformances(examPerformances)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public UserPerformanceResponse getUserPerformance(Long userId) {
        UserSummaryDto userDto = getUserDetails(UUID.fromString(userId.toString()));
        String username = userDto != null ? userDto.username() : "Unknown";
        String fullName = userDto != null ? userDto.fullName() : "Unknown User";

        List<ExamResult> results = examResultRepository.findByUserId(UUID.fromString(userId.toString()));
        
        long totalExamsTaken = results.size();
        double averageScore = results.stream().mapToDouble(ExamResult::getScore).average().orElse(0.0);
        
        long passedExams = results.stream().filter(r -> r.getScore() >= 50.0).count();
        long failedExams = totalExamsTaken - passedExams;
        double passRate = totalExamsTaken > 0 ? (double) passedExams / totalExamsTaken * 100 : 0.0;

        List<UserPerformanceResponse.ExamAttempt> recentAttempts = 
            results.stream()
                .sorted(Comparator.comparing(ExamResult::getCreatedAt).reversed())
                .limit(10)
                .map(result -> {
                    String examTitle = getExamTitle(result.getExamId());

                    return UserPerformanceResponse.ExamAttempt.builder()
                            .examId(result.getExamId())
                            .examTitle(examTitle)
                            .score(round(result.getScore()))
                            .passed(result.getScore() >= 50.0)
                            .attemptedAt(result.getCreatedAt())
                            .build();
                })
                .collect(Collectors.toList());

        List<String> strengths = new ArrayList<>();
        List<String> weaknesses = new ArrayList<>();
        
        if (averageScore >= 80) {
            strengths.add("Excellent overall performance");
        } else if (averageScore >= 60) {
            strengths.add("Good understanding of concepts");
        }
        
        if (passRate < 50) {
            weaknesses.add("Low pass rate - needs improvement");
        }
        if (averageScore < 60) {
            weaknesses.add("Below average scores");
        }

        return UserPerformanceResponse.builder()
                .userId(userId)
                .username(username)
                .fullName(fullName)
                .totalExamsTaken(totalExamsTaken)
                .averageScore(round(averageScore))
                .passedExams(passedExams)
                .failedExams(failedExams)
                .passRate(round(passRate))
                .recentAttempts(recentAttempts)
                .strengths(strengths)
                .weaknesses(weaknesses)
                .build();
    }

    // ==================== Helper Methods ====================

    private long getTotalUsersFromIdentityService() {
        try {
            ApiResponse<com.dao.analyticsservice.dto.client.PageResponse<UserSummaryDto>> response = 
                identityServiceClient.getAllUsers();
            if (response != null && response.isSuccess() && response.getData() != null) {
                return response.getData().getTotalElements();
            }
        } catch (Exception e) {
            log.error("Failed to fetch users from identity-service: {}", e.getMessage());
        }
        return 0;
    }

    private long getTotalCoursesFromCourseService() {
        try {
            ApiResponse<PageResponse<CourseSummaryDto>> response = courseServiceClient.getCourses(0, 1000);
            if (response != null && response.isSuccess() && response.getData() != null) {
                return response.getData().getTotalElements();
            }
        } catch (Exception e) {
            log.error("Failed to fetch courses from course-service: {}", e.getMessage());
        }
        return 0;
    }

    private UserSummaryDto getUserDetails(UUID userId) {
        try {
            // Note: Identity service uses Long ID, but we have UUID in exam_results
            // This is a data model mismatch that needs to be resolved
            // For now, we'll return null and show "Unknown User"
            log.warn("Cannot fetch user details: UUID {} cannot be converted to Long ID", userId);
            return null;
        } catch (Exception e) {
            log.error("Failed to fetch user details for ID {}: {}", userId, e.getMessage());
        }
        return null;
    }
    
    private UserSummaryDto getUserDetailsByLongId(Long userId) {
        try {
            ApiResponse<UserSummaryDto> response = identityServiceClient.getUserById(userId);
            if (response != null && response.isSuccess() && response.getData() != null) {
                return response.getData();
            }
        } catch (Exception e) {
            log.error("Failed to fetch user details for ID {}: {}", userId, e.getMessage());
        }
        return null;
    }

    private CourseSummaryDto getCourseDetails(UUID courseId) {
        try {
            ApiResponse<CourseSummaryDto> response = courseServiceClient.getCourseById(courseId);
            if (response != null && response.isSuccess() && response.getData() != null) {
                return response.getData();
            }
        } catch (Exception e) {
            log.error("Failed to fetch course details for ID {}: {}", courseId, e.getMessage());
        }
        return null;
    }

    private ExamSummaryDto getExamDetails(UUID examId) {
        try {
            ApiResponse<ExamSummaryDto> response = examServiceClient.getExamById(examId);
            if (response != null && response.isSuccess() && response.getData() != null) {
                return response.getData();
            }
        } catch (Exception e) {
            log.error("Failed to fetch exam details for ID {}: {}", examId, e.getMessage());
        }
        return null;
    }

    private String getUserDisplayName(UUID userId) {
        UserSummaryDto userDto = getUserDetails(userId);
        return userDto != null ? userDto.fullName() : "Unknown User";
    }

    private String getExamTitle(UUID examId) {
        ExamSummaryDto examDto = getExamDetails(examId);
        return examDto != null ? examDto.title() : "Exam " + examId.toString().substring(0, 8);
    }

    private List<ExamAnalyticsResponse.ScoreDistribution> calculateScoreDistribution(List<ExamResult> results) {
        if (results.isEmpty()) {
            return Collections.emptyList();
        }

        long total = results.size();
        Map<String, Long> distribution = new LinkedHashMap<>();
        distribution.put("0-20", results.stream().filter(r -> r.getScore() < 20).count());
        distribution.put("20-40", results.stream().filter(r -> r.getScore() >= 20 && r.getScore() < 40).count());
        distribution.put("40-60", results.stream().filter(r -> r.getScore() >= 40 && r.getScore() < 60).count());
        distribution.put("60-80", results.stream().filter(r -> r.getScore() >= 60 && r.getScore() < 80).count());
        distribution.put("80-100", results.stream().filter(r -> r.getScore() >= 80).count());

        return distribution.entrySet().stream()
                .map(entry -> ExamAnalyticsResponse.ScoreDistribution.builder()
                        .range(entry.getKey())
                        .count(entry.getValue())
                        .percentage(round((double) entry.getValue() / total * 100))
                        .build())
                .collect(Collectors.toList());
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
        List<ExamResult> results = examResultRepository.findByCreatedAtBetween(
                startInclusive.atStartOfDay(), endExclusive.atStartOfDay());
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
