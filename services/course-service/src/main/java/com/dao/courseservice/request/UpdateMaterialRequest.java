package com.dao.courseservice.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO chứa dữ liệu để cập nhật một học liệu.
 * Các trường là optional, chỉ những trường được gửi sẽ được cập nhật.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UpdateMaterialRequest {

    @Size(max = 255, message = "Title must not exceed 255 characters")
    private String title;

    @Size(max = 50, message = "Type must not exceed 50 characters")
    private String type; // Ví dụ: "pdf", "text", "quiz"

    private String storageKey;
    private String content;
    private Integer displayOrder;
}

