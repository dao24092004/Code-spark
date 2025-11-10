package com.dao.analyticsservice.dto.client;

import java.time.LocalDateTime;
import java.util.UUID;

public record CourseSummaryDto(
        UUID id,
        Long instructorId,
        String title,
        String slug,
        String description,
        String thumbnailUrl,
        String visibility,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}

