package com.dao.courseservice.response;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data
@Builder
public class QuestionOptionAdminResponse {
    private UUID id;
    private String content;
    private boolean isCorrect; // Hiển thị đáp án đúng
}