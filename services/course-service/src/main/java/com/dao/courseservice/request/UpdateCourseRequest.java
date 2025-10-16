package com.dao.courseservice.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO chứa dữ liệu để cập nhật một khóa học (UC29).
 * Các trường là optional, chỉ những trường được gửi sẽ được cập nhật.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UpdateCourseRequest {

    @Size(min = 3, max = 255, message = "Title must be between 3 and 255 characters")
    private String title;

    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    private String description;

    private String thumbnailUrl;
    private String visibility;
}