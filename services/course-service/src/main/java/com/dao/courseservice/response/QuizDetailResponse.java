package com.dao.courseservice.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * DTO phức hợp, trả về thông tin chi tiết của một bài quiz.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class QuizDetailResponse {
    private UUID id;
    private String title;
    private String description;
    private Integer timeLimitMinutes;
    private LocalDateTime createdAt;
    private List<QuestionResponse> questions;
}