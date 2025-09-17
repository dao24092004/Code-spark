package com.dao.identity_service.mapper;

import com.dao.identity_service.dto.RegisterRequest;
import com.dao.identity_service.dto.UpdateUserRequest;
import com.dao.identity_service.dto.UserDto;
import com.dao.identity_service.entity.User;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class UserMapper {

    public UserDto toDto(User user) {
        if (user == null) {
            return null;
        }

        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phoneNumber(user.getPhoneNumber())
                .avatarUrl(user.getAvatarUrl())
                .enabled(user.getEnabled())
                .accountNonExpired(user.getAccountNonExpired())
                .accountNonLocked(user.getAccountNonLocked())
                .credentialsNonExpired(user.getCredentialsNonExpired())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .lastLoginAt(user.getLastLoginAt())
                .roles(user.getRoles().stream()
                        .map(role -> role.getName())
                        .collect(Collectors.toSet()))
                .permissions(user.getAuthorities().stream()
                        .map(authority -> authority.getAuthority())
                        .collect(Collectors.toSet()))
                .build();
    }

    public User toEntity(RegisterRequest request) {
        if (request == null) {
            return null;
        }

        return User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(request.getPassword()) // Will be encoded in service
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phoneNumber(request.getPhoneNumber())
                .build();
    }

    public User updateEntity(User existing, UpdateUserRequest request) {
        if (request == null || existing == null) {
            return existing;
        }

        if (request.getFirstName() != null) {
            existing.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            existing.setLastName(request.getLastName());
        }
        if (request.getEmail() != null) {
            existing.setEmail(request.getEmail());
        }
        if (request.getPhoneNumber() != null) {
            existing.setPhoneNumber(request.getPhoneNumber());
        }
        if (request.getAvatarUrl() != null) {
            existing.setAvatarUrl(request.getAvatarUrl());
        }

        return existing;
    }
}