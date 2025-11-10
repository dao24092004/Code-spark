package com.dao.analyticsservice.dto.response;

import java.util.UUID;

public record TopPerformerResponse(
        UUID userId,
        String fullName,
        double averageScore,
        long attempts
) {
}

