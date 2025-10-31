package com.dao.courseservice.response;

import lombok.Builder;
import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class QuestionAdminResponse {
    private UUID id;
    private String content;
    private String type;
    private Integer displayOrder;
    private List<QuestionOptionAdminResponse> options;
}