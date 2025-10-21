package com.dao.courseservice.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO trả về kết quả sau khi học sinh nộp bài quiz (UC31).
 * Cung cấp thông tin về điểm số và các câu trả lời đã nộp.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class QuizSubmissionResultResponse {
    private UUID id;
    private Long studentId;
    private UUID quizId;
    private Integer score;
    private LocalDateTime submittedAt;
    private Object answers; // Trả về câu trả lời của học sinh để review
}