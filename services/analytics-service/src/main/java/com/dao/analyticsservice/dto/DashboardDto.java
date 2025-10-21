package com.dao.analyticsservice.dto;

import lombok.Data;

@Data
public class DashboardDto {
    private String userId;
    private String dashboardType;
    // Add more fields as needed for aggregated data
}
