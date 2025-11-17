package com.dao.analyticsservice.dto.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDateTime;
import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
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
    public Long enrollmentCount() {
        return 0L; // Default value, can be updated if API provides this
    }
}

