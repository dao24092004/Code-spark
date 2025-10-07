package com.dao.identity_service.controller;

import com.dao.common.dto.ApiResponse;
import com.dao.identity_service.dto.CreatePermissionRequest;
import com.dao.identity_service.dto.PermissionDto;
import com.dao.identity_service.service.PermissionService;
import lombok.RequiredArgsConstructor;
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
@RequestMapping("/api/v1/permissions")
@RequiredArgsConstructor
public class PermissionController {

    private final PermissionService permissionService;

    /**
     * Lấy tất cả các quyền
     */
    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_READ')")
    public ResponseEntity<ApiResponse<List<PermissionDto>>> getAllPermissions() {
        List<PermissionDto> permissions = permissionService.findAllPermissions();
        return ResponseEntity.ok(ApiResponse.success("Permissions retrieved successfully", permissions));
    }

    /**
     * Lấy danh sách quyền có phân trang
     */
    @GetMapping("/page")
    @PreAuthorize("hasAuthority('ROLE_READ')")
    public ResponseEntity<ApiResponse<Page<PermissionDto>>> getAllPermissionsPaged(
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<PermissionDto> permissions = permissionService.findAllPermissions(pageable);
        return ResponseEntity.ok(ApiResponse.success("Permissions retrieved successfully", permissions));
    }

    /**
     * Lấy thông tin quyền theo ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_READ')")
    public ResponseEntity<ApiResponse<PermissionDto>> getPermissionById(@PathVariable Long id) {
        PermissionDto permission = permissionService.findPermissionById(id);
        return ResponseEntity.ok(ApiResponse.success("Permission retrieved successfully", permission));
    }

    /**
     * Lấy thông tin quyền theo tên
     */
    @GetMapping("/name/{name}")
    @PreAuthorize("hasAuthority('ROLE_READ')")
    public ResponseEntity<ApiResponse<PermissionDto>> getPermissionByName(@PathVariable String name) {
        PermissionDto permission = permissionService.findPermissionByName(name);
        return ResponseEntity.ok(ApiResponse.success("Permission retrieved successfully", permission));
    }

    /**
     * Lấy danh sách quyền theo tài nguyên
     */
    @GetMapping("/resource/{resource}")
    @PreAuthorize("hasAuthority('ROLE_READ')")
    public ResponseEntity<ApiResponse<List<PermissionDto>>> getPermissionsByResource(@PathVariable String resource) {
        List<PermissionDto> permissions = permissionService.findPermissionsByResource(resource);
        return ResponseEntity.ok(ApiResponse.success("Permissions retrieved successfully", permissions));
    }

    /**
     * Lấy danh sách quyền theo tài nguyên và hành động
     */
    @GetMapping("/resource/{resource}/action/{action}")
    @PreAuthorize("hasAuthority('ROLE_READ')")
    public ResponseEntity<ApiResponse<List<PermissionDto>>> getPermissionsByResourceAndAction(
            @PathVariable String resource,
            @PathVariable String action
    ) {
        List<PermissionDto> permissions = permissionService.findPermissionsByResourceAndAction(resource, action);
        return ResponseEntity.ok(ApiResponse.success("Permissions retrieved successfully", permissions));
    }

    /**
     * Lấy danh sách quyền theo danh sách ID
     */
    @PostMapping("/by-ids")
    @PreAuthorize("hasAuthority('ROLE_READ')")
    public ResponseEntity<ApiResponse<List<PermissionDto>>> getPermissionsByIds(@RequestBody Set<Long> ids) {
        List<PermissionDto> permissions = permissionService.findPermissionsByIds(ids);
        return ResponseEntity.ok(ApiResponse.success("Permissions retrieved successfully", permissions));
    }

    /**
     * Tạo mới một quyền
     */
    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_WRITE')")
    public ResponseEntity<ApiResponse<PermissionDto>> createPermission(@Valid @RequestBody CreatePermissionRequest request) {
        PermissionDto createdPermission = permissionService.createPermission(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Permission created successfully", createdPermission));
    }

    /**
     * Cập nhật thông tin quyền
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_WRITE')")
    public ResponseEntity<ApiResponse<PermissionDto>> updatePermission(
            @PathVariable Long id,
            @Valid @RequestBody CreatePermissionRequest request
    ) {
        PermissionDto updatedPermission = permissionService.updatePermission(id, request);
        return ResponseEntity.ok(ApiResponse.success("Permission updated successfully", updatedPermission));
    }

    /**
     * Xóa quyền
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_DELETE')")
    public ResponseEntity<ApiResponse<String>> deletePermission(@PathVariable Long id) {
        permissionService.deletePermission(id);
        return ResponseEntity.ok(ApiResponse.success("Permission deleted successfully"));
    }

    /**
     * Kiểm tra quyền có tồn tại không
     */
    @GetMapping("/{name}/exists")
    @PreAuthorize("hasAuthority('ROLE_READ')")
    public ResponseEntity<ApiResponse<Boolean>> checkPermissionExists(@PathVariable String name) {
        boolean exists = permissionService.existsByName(name);
        return ResponseEntity.ok(ApiResponse.success("Permission existence checked", exists));
    }
}