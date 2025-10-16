package com.dao.courseservice.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO trả về thông tin tiến độ học tập của học sinh trong một khóa học (UC33).
 * Dùng cho dashboard của cả học sinh và giảng viên.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProgressResponse {
    private Long id;
    private Long studentId;
    private UUID courseId;
    private Integer percentComplete;
    private UUID lastMaterialId;
    private LocalDateTime updatedAt;
}