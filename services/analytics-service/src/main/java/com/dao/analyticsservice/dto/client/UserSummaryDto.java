package com.dao.analyticsservice.dto.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDateTime;

@JsonIgnoreProperties(ignoreUnknown = true)
public record UserSummaryDto(
        Long id,
        String username,
        String email,
        String firstName,
        String lastName,
        boolean enabled,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public String fullName() {
        if (firstName != null && lastName != null) {
            return firstName + " " + lastName;
        }
        return username;
    }
    
    public String avatarUrl() {
        return null; // Can be added later if needed
    }
}

