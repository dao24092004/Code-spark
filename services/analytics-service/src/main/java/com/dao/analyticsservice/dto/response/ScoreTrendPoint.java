package com.dao.analyticsservice.dto.response;

import java.time.LocalDate;

public record ScoreTrendPoint(LocalDate date, double averageScore, long submissionCount) {
}

