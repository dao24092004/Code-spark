package com.dao.courseservice.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

@Data
public class CreateQuestionRequest {
    @NotBlank(message = "Question content cannot be blank")
    private String content;

    @NotBlank(message = "Question type cannot be blank")
    private String type; // Ví dụ: "SINGLE_CHOICE", "MULTIPLE_CHOICE"
    
    @NotNull(message = "Display order cannot be null")
    private Integer displayOrder;

    @Valid
    @NotEmpty(message = "A question must have at least one option")
    private List<CreateOptionRequest> options;
}