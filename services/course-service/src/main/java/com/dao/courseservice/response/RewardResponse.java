package com.dao.courseservice.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO trả về thông tin một phần thưởng token đã được trao.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RewardResponse {
    private Long id;
    private Long studentId;
    private Integer tokensAwarded;
    private String reasonCode;
    private UUID relatedId;
    private LocalDateTime awardedAt;
}