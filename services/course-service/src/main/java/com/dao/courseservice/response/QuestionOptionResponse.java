package com.dao.courseservice.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * DTO chứa thông tin một lựa chọn trả lời.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class QuestionOptionResponse {
    private UUID id;
    private String content;
    private boolean isCorrect;
}