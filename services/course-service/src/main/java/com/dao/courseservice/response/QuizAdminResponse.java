package com.dao.courseservice.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class QuizAdminResponse {
    private UUID id;
    private String title;
    private String description;
    private Integer timeLimitMinutes;
    private LocalDateTime createdAt;
    private List<QuestionAdminResponse> questions;
}