package com.dao.user_service.controller;

import com.dao.common.dto.ApiResponse;
import com.dao.user_service.dto.CreateUserRequest;
import com.dao.user_service.dto.UpdateUserRequest;
import com.dao.user_service.dto.UserResponse;
import com.dao.user_service.service.UserCrudService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserCrudService userCrudService;

    /**
     * Lấy thông tin người dùng hiện tại đã được xác thực.
     */
    @GetMapping("/me")
    @PreAuthorize("hasAuthority('USER_READ')")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(@AuthenticationPrincipal Jwt jwt) {
        Long userId = extractUserId(jwt);
        UserResponse response = userCrudService.getUser(userId);
        return ResponseEntity.ok(ApiResponse.success("User profile retrieved successfully", response));
    }

    /**
     * Cập nhật thông tin người dùng hiện tại đã được xác thực.
     */
    @PutMapping("/me")
    @PreAuthorize("hasAuthority('USER_WRITE')")
    public ResponseEntity<ApiResponse<UserResponse>> updateCurrentUser(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody UpdateUserRequest request) {
        Long userId = extractUserId(jwt);
        UserResponse response = userCrudService.updateUser(userId, request);
        return ResponseEntity.ok(ApiResponse.success("User updated successfully", response));
    }

    // --- Admin endpoints ---

    /**
     * Tạo người dùng mới (chỉ admin).
     */
    @PostMapping
    @PreAuthorize("hasAuthority('USER_WRITE')")
    public ResponseEntity<ApiResponse<UserResponse>> createUser(@Valid @RequestBody CreateUserRequest request) {
        UserResponse response = userCrudService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("User created successfully", response));
    }

    /**
     * Lấy danh sách người dùng (chỉ admin).
     */
    @GetMapping
    @PreAuthorize("hasAuthority('USER_READ')")
    public ResponseEntity<ApiResponse<Page<UserResponse>>> getUsers(Pageable pageable) {
        Page<UserResponse> response = userCrudService.getUsers(pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Lấy thông tin người dùng theo ID (yêu cầu quyền USER_READ).
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_READ')")
    public ResponseEntity<ApiResponse<UserResponse>> getUser(@PathVariable Long id) {
        UserResponse response = userCrudService.getUser(id);
        return ResponseEntity.ok(ApiResponse.success("User retrieved successfully", response));
    }

    /**
     * Cập nhật thông tin người dùng theo ID (chỉ admin).
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_WRITE')")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(@PathVariable Long id,
                                                                 @Valid @RequestBody UpdateUserRequest request) {
        UserResponse response = userCrudService.updateUser(id, request);
        return ResponseEntity.ok(ApiResponse.success("User updated successfully", response));
    }

    /**
     * Xóa người dùng (chỉ admin).
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_DELETE')")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        userCrudService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success("User deleted successfully"));
    }

    /**
     * Trích xuất userId từ JWT token.
     */
    private Long extractUserId(Jwt token) {
        Object claim = token.getClaim("userId");
        if (claim == null) {
            // fallback: try standard sub if numeric
            String sub = token.getSubject();
            try {
                return Long.valueOf(sub);
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException("Missing 'userId' claim in token");
            }
        }
        if (claim instanceof Integer) {
            return ((Integer) claim).longValue();
        }
        if (claim instanceof Long) {
            return (Long) claim;
        }
        if (claim instanceof String) {
            return Long.valueOf((String) claim);
        }
        throw new IllegalArgumentException("Invalid 'userId' claim type: " + claim.getClass());
    }
}
