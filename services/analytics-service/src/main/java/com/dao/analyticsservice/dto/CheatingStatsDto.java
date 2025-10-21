package com.dao.analyticsservice.dto;

import lombok.Data;

@Data
public class CheatingStatsDto {
    private String studentId;
    private String examId;
    private int proctoringEventCount;
}
