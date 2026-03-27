package com.dao.profileservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO cho create/update profile.
 * Lưu ý: userId là Long (theo identity-service contract), được convert sang UUID khi lưu vào DB.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileDto {
    /** userId dùng khi tạo profile. Lấy từ JWT hoặc request body. */
    private Long userId;

    private String firstName;
    private String lastName;
    private String email;
    private String bio;
    private String avatarUrl;
    private BigDecimal tokenBalance;
}
