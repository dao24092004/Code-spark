package com.dao.examservice.client.dto;

import java.util.UUID;

/**
 * DTO cho đáp án của câu hỏi từ cm_question_options.
 */
public class CmQuestionOptionResponse {

    private UUID id;
    private String content;
    private Boolean isCorrect;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Boolean getIsCorrect() {
        return isCorrect;
    }

    public void setIsCorrect(Boolean isCorrect) {
        this.isCorrect = isCorrect;
    }
}
