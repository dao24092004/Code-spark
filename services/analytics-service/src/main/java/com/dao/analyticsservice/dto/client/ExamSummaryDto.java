package com.dao.analyticsservice.dto.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ExamSummaryDto(
        UUID id,
        String orgId,
        UUID courseId,
        String title,
        String description,
        Instant startAt,
        Instant endAt,
        Integer durationMinutes,
        Double passScore,
        Integer maxAttempts,
        Integer totalQuestions,
        String status,
        List<String> tags,
        Instant createdAt
) {
}
