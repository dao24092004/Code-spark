package com.dao.examservice.dto.request;

import jakarta.validation.constraints.*;

public class ExamConfigRequest {

    @Min(value = 1, message = "Duration must be at least 1 minute")
    @Max(value = 480, message = "Duration cannot exceed 480 minutes (8 hours)")
    public Integer durationMinutes;

    @Min(value = 0, message = "Pass score must be at least 0")
    @Max(value = 100, message = "Pass score cannot exceed 100")
    public Integer passScore;

    @Min(value = 1, message = "Max attempts must be at least 1")
    @Max(value = 100, message = "Max attempts cannot exceed 100")
    public Integer maxAttempts;
}
