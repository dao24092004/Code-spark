package com.dao.courseservice.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO để định hình dữ liệu khóa học trả về cho client.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CourseResponse {
    private UUID id;
    private Long instructorId;
    private String title;
    private String slug;
    private String description;
    private String thumbnailUrl;
    private String visibility;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}