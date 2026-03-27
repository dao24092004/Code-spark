package com.dao.courseservice.request;

import java.util.UUID;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class TokenGrantRequest {
    UUID studentId;
    Integer amount;
    String reasonCode;
    UUID relatedId;
    UUID courseId;
}
