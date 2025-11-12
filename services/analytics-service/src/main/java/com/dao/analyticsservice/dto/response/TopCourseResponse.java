package com.dao.analyticsservice.dto.response;

import java.util.UUID;

public record TopCourseResponse(
        UUID courseId,
        String title,
        long enrollmentCount,
        double averageScore
) {
}

