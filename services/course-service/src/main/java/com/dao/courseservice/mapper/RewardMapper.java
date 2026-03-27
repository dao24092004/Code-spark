package com.dao.courseservice.mapper;

import com.dao.courseservice.entity.Reward;
import com.dao.courseservice.response.RewardResponse;
import org.springframework.stereotype.Component;

@Component
public class RewardMapper {

    public RewardResponse toRewardResponse(Reward reward) {
        if (reward == null) {
            return null;
        }
        return RewardResponse.builder()
                .id(reward.getId())
                .studentId(reward.getStudentId())
                .courseId(reward.getCourseId())
                .tokensAwarded(reward.getTokensAwarded())
                .reasonCode(reward.getReasonCode())
                .relatedId(reward.getRelatedId())
                .transactionType(reward.getTransactionType())
                .awardedAt(reward.getAwardedAt())
                .build();
    }
}
