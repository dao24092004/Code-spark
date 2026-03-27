package com.dao.examservice.dto.request;

import jakarta.validation.constraints.*;
import java.time.Instant;

public class ExamUpdateRequest {

    @Size(min = 3, max = 200, message = "Title must be between 3 and 200 characters")
    public String title;

    @Size(max = 2000, message = "Description cannot exceed 2000 characters")
    public String description;

    public Instant startAt;

    public Instant endAt;

    @Min(value = 1, message = "Duration must be at least 1 minute")
    @Max(value = 480, message = "Duration cannot exceed 480 minutes (8 hours)")
    public Integer durationMinutes;

    @Min(value = 0, message = "Pass score must be at least 0")
    @Max(value = 100, message = "Pass score cannot exceed 100")
    public Integer passScore;

    @Min(value = 1, message = "Max attempts must be at least 1")
    @Max(value = 100, message = "Max attempts cannot exceed 100")
    public Integer maxAttempts;

    @Min(value = 1, message = "Total questions must be at least 1")
    @Max(value = 500, message = "Total questions cannot exceed 500")
    public Integer totalQuestions;
}
