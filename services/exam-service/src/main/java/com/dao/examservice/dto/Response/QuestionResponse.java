package com.dao.examservice.dto.Response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionResponse {
    private Long id;
    private String text;
    private Integer score;
    private Long examId;
    private Integer difficulty;
    private String type;
    private String explanation;
}
