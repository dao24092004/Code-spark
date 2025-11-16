package com.dao.analyticsservice.dto.request;

import lombok.Data;

import java.util.UUID;

@Data
public class ExamResultsRequest {
    private UUID examId;
    private UUID userId;
}
