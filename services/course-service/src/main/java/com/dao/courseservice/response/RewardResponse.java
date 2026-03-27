package com.dao.courseservice.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RewardResponse {
    private UUID id;
    private UUID studentId;
    private UUID courseId;
    private Integer tokensAwarded;
    private String reasonCode;
    private String relatedId;
    private String transactionType;
    private LocalDateTime awardedAt;
}
