package com.dao.examservice.dto.request;

import java.time.Instant;
import java.util.UUID;

public class ExamCreationRequest {
    public UUID orgId;
    public String title;
    public String description;
    public Instant startAt;
    public Instant endAt;
    public Integer durationMinutes;
    public Integer passScore;
    public Integer maxAttempts;
    public UUID createdBy;
}


