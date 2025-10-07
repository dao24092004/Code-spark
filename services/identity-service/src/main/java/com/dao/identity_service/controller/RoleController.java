package com.dao.identity_service.controller;

import com.dao.common.dto.ApiResponse;
import com.dao.identity_service.dto.CreateRoleRequest;
import com.dao.identity_service.dto.RoleDto;
import com.dao.identity_service.service.RoleService;
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
@RequestMapping("/api/v1/roles")
@RequiredArgsConstructor
public class RoleController {

    private final RoleService roleService;

    /**
     * Lấy tất cả các vai trò.
     */
    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_READ')")
    public ResponseEntity<ApiResponse<List<RoleDto>>> getAllRoles() {
        List<RoleDto> roles = roleService.findAllRoles();
        return ResponseEntity.ok(ApiResponse.success("Roles retrieved successfully", roles));
    }

    /**
     * Lấy tất cả các vai trò với phân trang.
     */
    @GetMapping("/page")
    @PreAuthorize("hasAuthority('ROLE_READ')")
    public ResponseEntity<ApiResponse<Page<RoleDto>>> getAllRolesPaged(
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<RoleDto> roles = roleService.findAllRoles(pageable);
        return ResponseEntity.ok(ApiResponse.success("Roles retrieved successfully", roles));
    }

    /**
     * Lấy vai trò theo ID.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_READ')")
    public ResponseEntity<ApiResponse<RoleDto>> getRoleById(@PathVariable Long id) {
        RoleDto role = roleService.findRoleById(id);
        return ResponseEntity.ok(ApiResponse.success("Role retrieved successfully", role));
    }

    /**
     * Lấy vai trò theo tên.
     */
    @GetMapping("/name/{name}")
    @PreAuthorize("hasAuthority('ROLE_READ')")
    public ResponseEntity<ApiResponse<RoleDto>> getRoleByName(@PathVariable String name) {
        RoleDto role = roleService.findRoleByName(name);
        return ResponseEntity.ok(ApiResponse.success("Role retrieved successfully", role));
    }

    /**
     * Tạo một vai trò mới.
     */
    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_WRITE')")
    public ResponseEntity<ApiResponse<RoleDto>> createRole(@Valid @RequestBody CreateRoleRequest request) {
        RoleDto createdRole = roleService.createRole(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Role created successfully", createdRole));
    }

    /**
     * Cập nhật một vai trò đã có theo ID.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_WRITE')")
    public ResponseEntity<ApiResponse<RoleDto>> updateRole(
            @PathVariable Long id,
            @Valid @RequestBody CreateRoleRequest request
    ) {
        RoleDto updatedRole = roleService.updateRole(id, request);
        return ResponseEntity.ok(ApiResponse.success("Role updated successfully", updatedRole));
    }

    /**
     * Thêm permissions vào role (giữ nguyên các permissions hiện có)
     */
    @PutMapping("/{id}/permissions")
    @PreAuthorize("hasAuthority('ROLE_WRITE')")
    public ResponseEntity<ApiResponse<RoleDto>> addPermissionsToRole(
            @PathVariable Long id,
            @RequestBody Set<Long> permissionIds
    ) {
        RoleDto updatedRole = roleService.addPermissions(id, permissionIds);
        return ResponseEntity.ok(ApiResponse.success("Permissions added successfully", updatedRole));
    }
    
    /**
     * Cập nhật toàn bộ permissions của role (xóa hết cũ và thêm mới)
     */
    @PutMapping("/{id}/permissions/replace")
    @PreAuthorize("hasAuthority('ROLE_WRITE')")
    public ResponseEntity<ApiResponse<RoleDto>> replaceRolePermissions(
            @PathVariable Long id,
            @RequestBody Set<Long> permissionIds
    ) {
        RoleDto updatedRole = roleService.replacePermissions(id, permissionIds);
        return ResponseEntity.ok(ApiResponse.success("Permissions replaced successfully", updatedRole));
    }

    /**
     * Xóa quyền khỏi một vai trò.
     */
    @DeleteMapping("/{id}/permissions")
    @PreAuthorize("hasAuthority('ROLE_WRITE')")
    public ResponseEntity<ApiResponse<RoleDto>> removePermissions(
            @PathVariable Long id,
            @RequestBody Set<Long> permissionIds
    ) {
        RoleDto updatedRole = roleService.removePermissions(id, permissionIds);
        return ResponseEntity.ok(ApiResponse.success("Permissions removed successfully", updatedRole));
    }

    /**
     * Xóa một vai trò theo ID.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_DELETE')")
    public ResponseEntity<ApiResponse<String>> deleteRole(@PathVariable Long id) {
        roleService.deleteRole(id);
        return ResponseEntity.ok(ApiResponse.success("Role deleted successfully"));
    }

    
    /**
     * Kiểm tra xem một vai trò với tên đã cho có tồn tại hay không.
     */
    @GetMapping("/{name}/exists")
    @PreAuthorize("hasAuthority('ROLE_READ')")
    public ResponseEntity<ApiResponse<Boolean>> checkRoleExists(@PathVariable String name) {
        boolean exists = roleService.existsByName(name);
        return ResponseEntity.ok(ApiResponse.success("Role existence checked", exists));
    }
}