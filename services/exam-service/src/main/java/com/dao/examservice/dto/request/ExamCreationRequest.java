package com.dao.examservice.dto.request;

import jakarta.validation.constraints.*;
import java.time.Instant;
import java.util.UUID;

import com.dao.examservice.entity.Exam;

public class ExamCreationRequest {

    public UUID courseId;

    public UUID orgId;

    @NotBlank(message = "Title is required")
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

    @NotNull(message = "createdBy is required")
    public UUID createdBy;

    public String examType;

    @Min(value = 1, message = "Difficulty must be at least 1")
    @Max(value = 10, message = "Difficulty cannot exceed 10")
    public Integer difficulty;

    public Exam.ExamStatus examStatus;

    public Boolean randomizeQuestionOrder;

    public Boolean randomizeOptionOrder;

    public Boolean showCorrectAnswers;

    public Boolean partialScoringEnabled;
}