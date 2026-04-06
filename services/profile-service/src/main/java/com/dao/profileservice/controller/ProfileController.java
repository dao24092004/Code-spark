package com.dao.profileservice.controller;

import com.dao.common.dto.ApiResponse;
import com.dao.profileservice.dto.CompleteProfileResponse;
import com.dao.profileservice.dto.ProfileDto;
import com.dao.profileservice.entity.Profile;
import com.dao.profileservice.entity.ProfileBadge;
import com.dao.profileservice.entity.ProfileCertificate;
import com.dao.profileservice.entity.ProfileCompletedCourse;
import com.dao.profileservice.entity.ProfileSkill;
import com.dao.profileservice.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/profiles")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    // ============================================================
    // Public endpoints
    // ============================================================

    /**
     * Lấy hồ sơ công khai của một user.
     */
    @GetMapping("/{userId}/public")
    public ResponseEntity<ApiResponse<CompleteProfileResponse>> getPublicProfile(
            @PathVariable Long userId) {
        CompleteProfileResponse profile = profileService.getCompleteProfile(userId);
        return ResponseEntity.ok(ApiResponse.success("Public profile retrieved", profile));
    }

    // ============================================================
    // Authenticated user endpoints
    // ============================================================

    /**
     * Lấy hồ sơ của người dùng hiện tại.
     */
    @GetMapping("/me")
    @PreAuthorize("hasAuthority('PROFILE_USER')")
    public ResponseEntity<ApiResponse<Profile>> getCurrentUserProfile(@AuthenticationPrincipal Jwt jwt) {
        Long userId = extractUserId(jwt);
        Profile profile = profileService.getProfileByUserId(userId);
        return ResponseEntity.ok(ApiResponse.success("Profile retrieved successfully", profile));
    }

    /**
     * Cập nhật hồ sơ người dùng hiện tại.
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

    /**
     * Lấy hồ sơ đầy đủ của người dùng hiện tại (bao gồm certificates, badges, skills...).
     */
    @GetMapping("/me/complete")
    @PreAuthorize("hasAuthority('PROFILE_USER')")
    public ResponseEntity<ApiResponse<CompleteProfileResponse>> getCompleteProfile(
            @AuthenticationPrincipal Jwt jwt) {
        Long userId = extractUserId(jwt);
        CompleteProfileResponse completeProfile = profileService.getCompleteProfile(userId);
        return ResponseEntity.ok(ApiResponse.success("Complete profile retrieved", completeProfile));
    }

    // ============================================================
    // Skills endpoints
    // ============================================================

    /**
     * Lấy danh sách kỹ năng của một profile.
     * GET /api/v1/profiles/{id}/skills
     */
    @GetMapping("/{userId}/skills")
    public ResponseEntity<ApiResponse<List<ProfileSkill>>> getProfileSkills(
            @PathVariable Long userId) {
        CompleteProfileResponse full = profileService.getCompleteProfile(userId);
        return ResponseEntity.ok(ApiResponse.success("Skills retrieved", full.getSkills()));
    }

    // ============================================================
    // Certificates endpoints
    // ============================================================

    /**
     * Lấy danh sách chứng chỉ của một profile.
     * GET /api/v1/profiles/{id}/certificates
     */
    @GetMapping("/{userId}/certificates")
    public ResponseEntity<ApiResponse<List<ProfileCertificate>>> getProfileCertificates(
            @PathVariable Long userId) {
        CompleteProfileResponse full = profileService.getCompleteProfile(userId);
        return ResponseEntity.ok(ApiResponse.success("Certificates retrieved", full.getCertificates()));
    }

    // ============================================================
    // Badges endpoints
    // ============================================================

    /**
     * Lấy danh sách huy hiệu của một profile.
     * GET /api/v1/profiles/{id}/badges
     */
    @GetMapping("/{userId}/badges")
    public ResponseEntity<ApiResponse<List<ProfileBadge>>> getProfileBadges(
            @PathVariable Long userId) {
        CompleteProfileResponse full = profileService.getCompleteProfile(userId);
        return ResponseEntity.ok(ApiResponse.success("Badges retrieved", full.getBadges()));
    }

    // ============================================================
    // Completed courses endpoints
    // ============================================================

    /**
     * Lấy danh sách khóa học đã hoàn thành của một profile.
     * GET /api/v1/profiles/{id}/completed-courses
     */
    @GetMapping("/{userId}/completed-courses")
    public ResponseEntity<ApiResponse<List<ProfileCompletedCourse>>> getProfileCompletedCourses(
            @PathVariable Long userId) {
        CompleteProfileResponse full = profileService.getCompleteProfile(userId);
        return ResponseEntity.ok(ApiResponse.success("Completed courses retrieved", full.getCompletedCourses()));
    }

    // ============================================================
    // Admin / Inter-service endpoints
    // ============================================================

    /**
     * Tạo một hồ sơ mới (admin only).
     */
    @PostMapping
    @PreAuthorize("hasAuthority('PROFILE_ADMIN')")
    public ResponseEntity<ApiResponse<Profile>> createProfile(
            @Valid @RequestBody ProfileDto profileDto) {
        Profile profile = profileService.createProfile(profileDto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Profile created successfully", profile));
    }

    /**
     * Lấy hồ sơ theo userId (admin hoặc inter-service).
     */
    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyAuthority('PROFILE_ADMIN', 'PROFILE_USER')")
    public ResponseEntity<ApiResponse<Profile>> getProfileByUserId(@PathVariable Long userId) {
        Profile profile = profileService.getProfileByUserId(userId);
        return ResponseEntity.ok(ApiResponse.success("Profile retrieved", profile));
    }

    /**
     * Cập nhật hồ sơ theo userId (admin only).
     */
    @PutMapping("/user/{userId}")
    @PreAuthorize("hasAuthority('PROFILE_ADMIN')")
    public ResponseEntity<ApiResponse<Profile>> updateProfileByUserId(
            @PathVariable Long userId,
            @Valid @RequestBody ProfileDto profileDto) {
        Profile profile = profileService.updateProfile(userId, profileDto);
        return ResponseEntity.ok(ApiResponse.success("Profile updated", profile));
    }

    /**
     * Xóa hồ sơ theo userId (admin only).
     */
    @DeleteMapping("/user/{userId}")
    @PreAuthorize("hasAuthority('PROFILE_ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteProfile(@PathVariable Long userId) {
        profileService.deleteProfile(userId);
        return ResponseEntity.ok(ApiResponse.success("Profile deleted successfully"));
    }

    // ============================================================
    // Helpers
    // ============================================================

    private Long extractUserId(Jwt token) {
        Object claim = token.getClaim("userId");
        if (claim == null) {
            String sub = token.getSubject();
            try {
                return Long.valueOf(sub);
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException("Missing 'userId' claim in token");
            }
        }
        if (claim instanceof Integer) return ((Integer) claim).longValue();
        if (claim instanceof Long) return (Long) claim;
        if (claim instanceof String) return Long.valueOf((String) claim);
        throw new IllegalArgumentException("Invalid 'userId' claim type: " + claim.getClass());
    }
}
