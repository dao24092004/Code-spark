package com.dao.user_service.dto;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;
import java.util.Set;

@Value
@Builder
public class UserResponse {
    Long id;
    String username;
    String email;
    String firstName;
    String lastName;
    String phoneNumber;
    String avatarUrl;
    Boolean enabled;
    Boolean accountNonExpired;
    Boolean accountNonLocked;
    Boolean credentialsNonExpired;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
    LocalDateTime lastLoginAt;
    Set<String> roles;
}
