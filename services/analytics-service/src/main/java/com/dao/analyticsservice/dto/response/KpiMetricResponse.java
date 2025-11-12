package com.dao.analyticsservice.dto.response;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class KpiMetricResponse {
    String id;
    String title;
    double value;
    String unit;
    double changePercentage;
    String trend;
}

