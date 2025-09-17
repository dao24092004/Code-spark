package com.dao.identity_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CreatePermissionRequest {

    @NotBlank(message = "Permission name is required")
    @Size(min = 2, max = 100, message = "Permission name must be between 2 and 100 characters")
    private String name;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    @NotBlank(message = "Resource is required")
    @Size(min = 2, max = 50, message = "Resource must be between 2 and 50 characters")
    private String resource;

    @NotBlank(message = "Action is required")
    @Size(min = 2, max = 50, message = "Action must be between 2 and 50 characters")
    private String action;
}