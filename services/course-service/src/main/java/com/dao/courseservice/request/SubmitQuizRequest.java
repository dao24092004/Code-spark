package com.dao.courseservice.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SubmitQuizRequest {

    @NotNull(message = "Student ID is required")
    private UUID studentId;

    private Map<UUID, List<UUID>> answers;
}
