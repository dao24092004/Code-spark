package com.dao.analyticsservice.dto.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDateTime;
import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ProctoringEventDto(
        UUID id,
        UUID examId,
        UUID userId,
        String eventType,
        String severity,
        String description,
        LocalDateTime timestamp
) {
}
