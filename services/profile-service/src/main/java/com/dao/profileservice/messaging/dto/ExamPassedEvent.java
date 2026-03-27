package com.dao.profileservice.messaging.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Event được gửi khi Exam Service xác nhận đỗ kỳ thi.
 * Topic: exam.passed
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamPassedEvent {
    private UUID examId;
    private Long userId;                    // Long từ identity-service
    private UUID courseId;
    private String examTitle;
    private Integer score;
    private Long timestamp;
}
