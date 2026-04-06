package com.dao.courseservice.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class QuizSubmissionResultResponse {
    private UUID id;
    private UUID studentId;
    private UUID quizId;
    private Integer score;
    private LocalDateTime submittedAt;
    private Object answers;
}
