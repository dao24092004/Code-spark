package com.dao.courseservice.request;

import java.util.UUID;

import lombok.Builder;
import lombok.Value;

/**
 * Payload gửi sang token-reward-service khi muốn cấp token cho học viên.
 */
@Value
@Builder
public class TokenGrantRequest {
    Long studentId;
    Integer amount;
    String reasonCode;
    UUID relatedId;
}
