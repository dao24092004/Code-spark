package com.dao.courseservice.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;
import java.util.List;

@Data
public class CreateQuizRequest {
    @NotBlank(message = "Quiz title cannot be blank")
    private String title;
    
    private String description;
    
    private Integer timeLimitMinutes;

    @Valid
    @NotEmpty(message = "A quiz must have at least one question")
    private List<CreateQuestionRequest> questions;
}