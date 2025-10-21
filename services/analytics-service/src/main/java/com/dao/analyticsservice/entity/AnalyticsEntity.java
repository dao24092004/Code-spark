package com.dao.analyticsservice.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.Data;

@Entity
@Data
public class AnalyticsEntity {
    @Id
    private Long id;
    // Add fields for analytics data
}
