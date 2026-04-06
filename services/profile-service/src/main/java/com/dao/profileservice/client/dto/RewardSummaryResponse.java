package com.dao.profileservice.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RewardSummaryResponse {
    private Integer totalPoints;
    private Integer coursesCompleted;
    private Integer examsPassed;
    private List<BadgeInfo> badges;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BadgeInfo {
        private UUID id;
        private String name;
        private String description;
        private String iconUrl;
    }
}
