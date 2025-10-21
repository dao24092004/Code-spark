package com.dao.courseservice.mapper;

import com.dao.courseservice.entity.Reward;
import com.dao.courseservice.response.RewardResponse;
import org.springframework.stereotype.Component;

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
                .relatedId(reward.getRelatedId())
                .awardedAt(reward.getAwardedAt())
                .build();
    }
}