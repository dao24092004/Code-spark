package com.dao.analyticsservice.dto.client;

import java.time.LocalDateTime;

public record UserSummaryDto(
        Long id,
        String username,
        String email,
        String firstName,
        String lastName,
        boolean enabled,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}

