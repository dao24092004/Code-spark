package com.dao.examservice.dto.response;

import java.time.Instant;
import java.util.Set;
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

    public Integer totalQuestions;
    public Integer assignedQuestionCount;
    public UUID createdBy;

    public String status;
    public Instant createdAt;
    public Set<String> tags;
}

