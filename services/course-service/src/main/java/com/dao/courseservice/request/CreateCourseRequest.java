package com.dao.courseservice.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO chứa dữ liệu để tạo một khóa học mới (UC29).
 * Các annotation validation đảm bảo dữ liệu đầu vào là hợp lệ.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CreateCourseRequest {

    @NotBlank(message = "Title is required")
    @Size(min = 3, max = 255, message = "Title must be between 3 and 255 characters")
    private String title;

    private Long instructorId;

    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    private String description;

    private String thumbnailUrl;
    private String visibility;
}