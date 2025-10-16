package com.dao.examservice.dto.Response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamCreationResponse {
    private Long id;
    private String title;
    private String status;
    private String message;
    private LocalDateTime createdAt;
}