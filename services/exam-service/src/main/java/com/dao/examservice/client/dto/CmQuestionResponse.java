package com.dao.examservice.client.dto;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * DTO phản hồi từ course-service cho câu hỏi từ bảng cm_questions.
 */
public class CmQuestionResponse {

    private UUID id;
    private String content;
    private String type;
    private Integer displayOrder;
    private Map<String, Object> metadata;
    private List<CmQuestionOptionResponse> options;

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

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }

    public List<CmQuestionOptionResponse> getOptions() {
        return options;
    }

    public void setOptions(List<CmQuestionOptionResponse> options) {
        this.options = options;
    }
}
