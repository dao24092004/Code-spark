package com.dao.profileservice.controller;

import com.dao.common.dto.ApiResponse;
import com.dao.profileservice.dto.ProfileDto;
import com.dao.profileservice.entity.Profile;
import com.dao.profileservice.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;

@RestController
@RequestMapping("/api/v1/profiles")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    /**
     * Lấy hồ sơ của người dùng hiện tại đã được xác thực.
     */
    @GetMapping("/me")
    @PreAuthorize("hasAuthority('PROFILE_USER')")
    public ResponseEntity<ApiResponse<Profile>> getCurrentUserProfile(@AuthenticationPrincipal Jwt jwt) {
        Long userId = extractUserId(jwt);
        Profile profile = profileService.getProfileByUserId(userId);
        return ResponseEntity.ok(ApiResponse.success("Profile retrieved successfully", profile));
    }

    /**
     * Cập nhật hồ sơ của người dùng hiện tại đã được xác thực.
     */
    @PutMapping("/me")
    @PreAuthorize("hasAuthority('PROFILE_USER')")
    public ResponseEntity<ApiResponse<Profile>> updateCurrentUserProfile(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody ProfileDto profileDto) {
        Long userId = extractUserId(jwt);
        Profile updatedProfile = profileService.updateProfile(userId, profileDto);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", updatedProfile));
    }

    // --- Admin or Inter-service endpoints ---

    /**
     * Tạo một hồ sơ mới.
     */
    @PostMapping
    @PreAuthorize("hasAuthority('PROFILE_ADMIN')")
    public ResponseEntity<ApiResponse<Profile>> createProfile(@Valid @RequestBody ProfileDto profileDto) {
        Profile profile = profileService.createProfile(profileDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Profile created successfully", profile));
    }

    /**
     * Lấy hồ sơ theo ID người dùng.
     */
    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyAuthority('PROFILE_ADMIN', 'PROFILE_USER')")
    public ResponseEntity<ApiResponse<Profile>> getProfileByUserId(@PathVariable Long userId) {
        Profile profile = profileService.getProfileByUserId(userId);
        return ResponseEntity.ok(ApiResponse.success("Profile retrieved successfully", profile));
    }

    /**
     * Cập nhật hồ sơ theo ID người dùng.
     */
    @PutMapping("/user/{userId}")
    @PreAuthorize("hasAuthority('PROFILE_ADMIN')")
    public ResponseEntity<ApiResponse<Profile>> updateProfileByUserId(
            @PathVariable Long userId,
            @Valid @RequestBody ProfileDto profileDto) {
        Profile profile = profileService.updateProfile(userId, profileDto);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", profile));
    }

    /**
     * Xóa hồ sơ theo ID người dùng.
     */
    @DeleteMapping("/user/{userId}")
    @PreAuthorize("hasAuthority('PROFILE_ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteProfile(@PathVariable Long userId) {
        profileService.deleteProfile(userId);
        return ResponseEntity.ok(ApiResponse.success("Profile deleted successfully"));
    }

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