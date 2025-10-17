package com.dao.examservice.dto.Request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionCreationRequest {
    private String text;
    private String type;
    private String content; // JSON content for question data
    private Integer score;
    private Integer difficulty;
    private List<String> tags;
    private String explanation;
    private Long examId;
}
