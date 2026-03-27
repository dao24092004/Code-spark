package com.dao.profileservice.messaging.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Event được gửi khi Course Service xác nhận hoàn thành khóa học.
 * Topic: course.completed
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseCompletedEvent {
    private UUID courseId;
    private Long userId;                    // Long từ identity-service
    private String courseName;
    private Integer finalScore;
    private LocalDateTime completedAt;
    private Long timestamp;
}
