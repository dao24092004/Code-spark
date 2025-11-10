package com.dao.courseservice.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * DTO chứa dữ liệu để cấp thưởng thủ công cho học sinh.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class GrantRewardRequest {

    @NotNull(message = "Student ID is required")
    private Long studentId;

    @NotNull(message = "Tokens is required")
    @Min(value = 1, message = "Tokens must be at least 1")
    private Integer tokens;

    @NotBlank(message = "Reason code is required")
    @Size(max = 50, message = "Reason code must not exceed 50 characters")
    private String reasonCode; // Ví dụ: "MANUAL_REWARD", "BONUS", "REFERRAL"

    private UUID relatedId; // Optional: ID của đối tượng liên quan (quiz_submission_id, course_id, etc.)
}

