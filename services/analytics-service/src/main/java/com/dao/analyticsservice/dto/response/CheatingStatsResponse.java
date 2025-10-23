package com.dao.analyticsservice.dto.response;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.Map;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CheatingStatsResponse {
    private UUID examId;
    private Long totalSubmissions;
    private Long suspiciousEventsCount;
    private Map<String, Long> eventTypeDistribution;
    private Double cheatingRiskScore;
}
