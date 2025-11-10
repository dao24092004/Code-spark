package com.dao.examservice.dto.request;

import java.time.Instant;
import java.util.Set;

public class ExamUpdateRequest {
    public String title;
    public String description;
    public Instant startAt;
    public Instant endAt;
    public Integer durationMinutes;
    public Integer passScore;
    public Integer maxAttempts;
    public Integer totalQuestions;
    public Set<String> tags;
}


