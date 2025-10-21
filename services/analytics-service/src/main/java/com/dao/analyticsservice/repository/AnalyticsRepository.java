package com.dao.analyticsservice.repository;

import com.dao.analyticsservice.entity.AnalyticsEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnalyticsRepository extends JpaRepository<AnalyticsEntity, Long> {
    // Add custom query methods here if needed
}
