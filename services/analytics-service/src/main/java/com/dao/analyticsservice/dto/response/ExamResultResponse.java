package com.dao.analyticsservice.dto.response;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamResultResponse {
    private Long id;
    private UUID examId;
    private UUID submissionId;
    private UUID userId;
    private double score;
    private LocalDateTime createdAt;
}
