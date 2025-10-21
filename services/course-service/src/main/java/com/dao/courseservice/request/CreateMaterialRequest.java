package com.dao.courseservice.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO chứa dữ liệu để tạo một học liệu mới (UC30).
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CreateMaterialRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must not exceed 255 characters")
    private String title;

    @NotBlank(message = "Type is required")
    @Size(max = 50, message = "Type must not exceed 50 characters")
    private String type; // Ví dụ: "pdf", "text", "quiz"

    private String storageKey;
    private String content;
    private Integer displayOrder;
}