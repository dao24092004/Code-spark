package com.dao.analyticsservice.dto.client;

import java.time.Instant;
import java.util.UUID;

public record ExamSummaryDto(
        UUID id,
        UUID courseId,
        String title,
        String description,
        Instant startAt,
        Instant endAt,
        Integer durationMinutes,
        Integer passScore,
        Integer maxAttempts,
        Long createdBy,
        String status,
        Instant createdAt
) {
}

