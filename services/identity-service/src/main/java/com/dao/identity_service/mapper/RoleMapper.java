package com.dao.identity_service.mapper;

import com.dao.identity_service.dto.CreateRoleRequest;
import com.dao.identity_service.dto.RoleDto;
import com.dao.identity_service.entity.Role;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class RoleMapper {

    private final PermissionMapper permissionMapper;

    public RoleMapper(PermissionMapper permissionMapper) {
        this.permissionMapper = permissionMapper;
    }

    public RoleDto toDto(Role role) {
        if (role == null) {
            return null;
        }

        return RoleDto.builder()
                .id(role.getId())
                .name(role.getName())
                .description(role.getDescription())
                .permissions(role.getPermissions().stream()
                        .map(permissionMapper::toDto)
                        .collect(Collectors.toSet()))
                .createdAt(role.getCreatedAt())
                .updatedAt(role.getUpdatedAt())
                .build();
    }

    public Role toEntity(CreateRoleRequest request) {
        if (request == null) {
            return null;
        }

        return Role.builder()
                .name(request.getName())
                .description(request.getDescription())
                .build();
    }

    public Role updateEntity(Role existing, CreateRoleRequest request) {
        if (request == null || existing == null) {
            return existing;
        }

        existing.setName(request.getName());
        existing.setDescription(request.getDescription());
        return existing;
    }
}