package com.dao.identity_service.mapper;

import com.dao.identity_service.dto.CreatePermissionRequest;
import com.dao.identity_service.dto.PermissionDto;
import com.dao.identity_service.entity.Permission;
import org.springframework.stereotype.Component;

@Component
public class PermissionMapper {

    public PermissionDto toDto(Permission permission) {
        if (permission == null) {
            return null;
        }

        return PermissionDto.builder()
                .id(permission.getId())
                .name(permission.getName())
                .description(permission.getDescription())
                .resource(permission.getResource())
                .action(permission.getAction())
                .createdAt(permission.getCreatedAt())
                .updatedAt(permission.getUpdatedAt())
                .build();
    }

    public Permission toEntity(CreatePermissionRequest request) {
        if (request == null) {
            return null;
        }

        return Permission.builder()
                .name(request.getName())
                .description(request.getDescription())
                .resource(request.getResource())
                .action(request.getAction())
                .build();
    }

    public Permission updateEntity(Permission existing, CreatePermissionRequest request) {
        if (request == null || existing == null) {
            return existing;
        }

        existing.setName(request.getName());
        existing.setDescription(request.getDescription());
        existing.setResource(request.getResource());
        existing.setAction(request.getAction());
        return existing;
    }
}