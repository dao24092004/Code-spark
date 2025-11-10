package com.dao.courseservice.mapper;

import com.dao.courseservice.entity.Reward;
import com.dao.courseservice.response.RewardResponse;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Lớp này chịu trách nhiệm chuyển đổi dữ liệu cho entity Reward.
 */
@Component
public class RewardMapper {

    /**
     * Chuyển từ Reward (entity) sang RewardResponse (DTO).
     */
    public RewardResponse toRewardResponse(Reward reward) {
        if (reward == null) {
            return null;
        }
        return RewardResponse.builder()
                .id(reward.getId())
                .studentId(reward.getStudentId())
                .tokensAwarded(reward.getTokensAwarded())
                .reasonCode(reward.getReasonCode())
                .relatedId(parseRelatedId(reward.getRelatedId()))
                .awardedAt(reward.getAwardedAt())
                .build();
    }

    private UUID parseRelatedId(String relatedId) {
        if (relatedId == null || relatedId.isBlank()) {
            return null;
        }
        try {
            return UUID.fromString(relatedId);
        } catch (IllegalArgumentException ex) {
            // Nếu dữ liệu trong DB không phải UUID hợp lệ, trả về null để tránh crash
            return null;
        }
    }
}