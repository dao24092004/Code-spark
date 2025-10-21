package com.dao.courseservice.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * DTO chứa thông tin một câu hỏi và các lựa chọn trả lời.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class QuestionResponse {
    private UUID id;
    private String content;
    private String type;
    private List<QuestionOptionResponse> options;
}