package com.dao.identity_service.controller;

import com.dao.common.dto.ApiResponse;
import com.dao.common.exception.AppException;
import com.dao.identity_service.dto.*;
import com.dao.identity_service.entity.User;
import com.dao.identity_service.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * Lấy thông tin người dùng hiện tại
     */
    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserDto>> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User user = userService.findByUsername(username)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));
        UserDto userDto = userService.findUserById(user.getId());
        return ResponseEntity.ok(ApiResponse.success("User profile retrieved successfully", userDto));
    }

    /**
     * Lấy thông tin người dùng theo ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_READ') or @userService.findById(#id).orElse(new com.dao.identity_service.entity.User()).username == authentication.name")
    public ResponseEntity<ApiResponse<UserDto>> getUserById(@PathVariable Long id) {
        UserDto user = userService.findUserById(id);
        return ResponseEntity.ok(ApiResponse.success("User retrieved successfully", user));
    }

    /**
     * Lấy danh sách tất cả người dùng
     */
    @GetMapping
    @PreAuthorize("hasAuthority('USER_READ')")
    public ResponseEntity<ApiResponse<List<UserDto>>> getAllUsers() {
        List<UserDto> users = userService.findAllUsers();
        return ResponseEntity.ok(ApiResponse.success("Users retrieved successfully", users));
    }

    /**
     * Lấy danh sách người dùng có phân trang
     */
    @GetMapping("/page")
    @PreAuthorize("hasAuthority('USER_READ')")
    public ResponseEntity<ApiResponse<Page<UserDto>>> getAllUsersPaged(
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<UserDto> users = userService.findAllUsers(pageable);
        return ResponseEntity.ok(ApiResponse.success("Users retrieved successfully", users));
    }

    /**
     * Cập nhật thông tin người dùng
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_WRITE') or @userService.findById(#id).orElse(new com.dao.identity_service.entity.User()).username == authentication.name")
    public ResponseEntity<ApiResponse<UserDto>> updateUser(
            @PathVariable Long id, 
            @Valid @RequestBody UpdateUserRequest request
    ) {
        UserDto updatedUser = userService.updateUser(id, request);
        return ResponseEntity.ok(ApiResponse.success("User updated successfully", updatedUser));
    }

    /**
     * Gán vai trò cho người dùng
     */
    @PutMapping("/{id}/roles")
    @PreAuthorize("hasAuthority('USER_WRITE')")
    public ResponseEntity<ApiResponse<UserDto>> assignRoles(
            @PathVariable Long id, 
            @RequestBody Set<String> roleNames
    ) {
        UserDto user = userService.assignRoles(id, roleNames);
        return ResponseEntity.ok(ApiResponse.success("Roles assigned successfully", user));
    }

    /**
     * Kích hoạt tài khoản người dùng
     */
    @PutMapping("/{id}/enable")
    @PreAuthorize("hasAuthority('USER_WRITE')")
    public ResponseEntity<ApiResponse<UserDto>> enableUser(@PathVariable Long id) {
        UserDto user = userService.enableUser(id);
        return ResponseEntity.ok(ApiResponse.success("User enabled successfully", user));
    }

    /**
     * Vô hiệu hóa tài khoản người dùng
     */
    @PutMapping("/{id}/disable")
    @PreAuthorize("hasAuthority('USER_WRITE')")
    public ResponseEntity<ApiResponse<UserDto>> disableUser(@PathVariable Long id) {
        UserDto user = userService.disableUser(id);
        return ResponseEntity.ok(ApiResponse.success("User disabled successfully", user));
    }

    /**
     * Xóa người dùng
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_DELETE')")
    public ResponseEntity<ApiResponse<String>> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success("User deleted successfully"));
    }

    /**
     * Đổi mật khẩu người dùng hiện tại
     */
    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<String>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        
        userService.changePassword(username, request.getCurrentPassword(), request.getNewPassword());
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully"));
    }
}