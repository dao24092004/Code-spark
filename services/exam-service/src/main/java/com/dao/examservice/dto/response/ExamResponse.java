package com.dao.examservice.dto.response;

import java.time.Instant;
import java.util.UUID;

public class ExamResponse {
    public UUID id;
    public UUID courseId;
    public String title;
    public String description;
    public Instant startAt;
    public Instant endAt;
    public Integer durationMinutes;
    public Integer passScore;
    public Integer maxAttempts;
    public Long createdBy;
    public String status;
    public Instant createdAt;
}

