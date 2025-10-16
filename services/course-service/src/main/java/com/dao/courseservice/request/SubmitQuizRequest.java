package com.dao.courseservice.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * DTO chứa các câu trả lời của học sinh khi họ nộp bài quiz (UC31).
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class SubmitQuizRequest {

    @NotNull(message = "Student ID is required")
    private Long studentId;
    
    /**
     * Cấu trúc lưu câu trả lời:
     * - Key: ID của câu hỏi (Question ID).
     * - Value: Danh sách ID của các lựa chọn đã chọn (Option ID).
     */
    private Map<UUID, List<UUID>> answers; 
}