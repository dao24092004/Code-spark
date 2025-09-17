package com.dao.identity_service.controller;

import com.dao.identity_service.dto.ApiResponse;
import com.dao.identity_service.dto.CreateRoleRequest;
import com.dao.identity_service.dto.RoleDto;
import com.dao.identity_service.service.RoleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/v1/roles")
@RequiredArgsConstructor
@Slf4j
public class RoleController {

    private final RoleService roleService;

    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_READ')")
    public ResponseEntity<ApiResponse<List<RoleDto>>> getAllRoles() {
        try {
            List<RoleDto> roles = roleService.findAllRoles();
            return ResponseEntity.ok(ApiResponse.success("Roles retrieved successfully", roles));
        } catch (Exception e) {
            log.error("Error getting all roles: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error retrieving roles"));
        }
    }

    @GetMapping("/page")
    @PreAuthorize("hasAuthority('ROLE_READ')")
    public ResponseEntity<ApiResponse<Page<RoleDto>>> getAllRolesPaged(
            @PageableDefault(size = 20) Pageable pageable
    ) {
        try {
            Page<RoleDto> roles = roleService.findAllRoles(pageable);
            return ResponseEntity.ok(ApiResponse.success("Roles retrieved successfully", roles));
        } catch (Exception e) {
            log.error("Error getting paged roles: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error retrieving roles"));
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_READ')")
    public ResponseEntity<ApiResponse<RoleDto>> getRoleById(@PathVariable Long id) {
        RoleDto role = roleService.findRoleById(id);
        return ResponseEntity.ok(ApiResponse.success("Role retrieved successfully", role));
    }

    @GetMapping("/name/{name}")
    @PreAuthorize("hasAuthority('ROLE_READ')")
    public ResponseEntity<ApiResponse<RoleDto>> getRoleByName(@PathVariable String name) {
        RoleDto role = roleService.findRoleByName(name);
        return ResponseEntity.ok(ApiResponse.success("Role retrieved successfully", role));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_WRITE')")
    public ResponseEntity<ApiResponse<RoleDto>> createRole(@Valid @RequestBody CreateRoleRequest request) {
        RoleDto createdRole = roleService.createRole(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Role created successfully", createdRole));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_WRITE')")
    public ResponseEntity<ApiResponse<RoleDto>> updateRole(
            @PathVariable Long id,
            @Valid @RequestBody CreateRoleRequest request
    ) {
        RoleDto updatedRole = roleService.updateRole(id, request);
        return ResponseEntity.ok(ApiResponse.success("Role updated successfully", updatedRole));
    }

    @PutMapping("/{id}/permissions")
    @PreAuthorize("hasAuthority('ROLE_WRITE')")
    public ResponseEntity<ApiResponse<RoleDto>> assignPermissions(
            @PathVariable Long id,
            @RequestBody Set<Long> permissionIds
    ) {
        RoleDto updatedRole = roleService.assignPermissions(id, permissionIds);
        return ResponseEntity.ok(ApiResponse.success("Permissions assigned successfully", updatedRole));
    }

    @DeleteMapping("/{id}/permissions")
    @PreAuthorize("hasAuthority('ROLE_WRITE')")
    public ResponseEntity<ApiResponse<RoleDto>> removePermissions(
            @PathVariable Long id,
            @RequestBody Set<Long> permissionIds
    ) {
        RoleDto updatedRole = roleService.removePermissions(id, permissionIds);
        return ResponseEntity.ok(ApiResponse.success("Permissions removed successfully", updatedRole));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_DELETE')")
    public ResponseEntity<ApiResponse<String>> deleteRole(@PathVariable Long id) {
        roleService.deleteRole(id);
        return ResponseEntity.ok(ApiResponse.success("Role deleted successfully"));
    }

    
    @GetMapping("/{name}/exists")
    @PreAuthorize("hasAuthority('ROLE_READ')")
    public ResponseEntity<ApiResponse<Boolean>> checkRoleExists(@PathVariable String name) {
        boolean exists = roleService.existsByName(name);
        return ResponseEntity.ok(ApiResponse.success("Role existence checked", exists));
    }
}