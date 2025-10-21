package com.dao.analyticsservice.dto;

import lombok.Data;

@Data
public class ExamResultDto {
    private String studentId;
    private String examId;
    private double score;
}
