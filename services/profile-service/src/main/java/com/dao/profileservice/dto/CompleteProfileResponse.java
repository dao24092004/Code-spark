package com.dao.profileservice.dto;

import com.dao.profileservice.entity.Profile;
import com.dao.profileservice.entity.ProfileBadge;
import com.dao.profileservice.entity.ProfileCertificate;
import com.dao.profileservice.entity.ProfileCompletedCourse;
import com.dao.profileservice.entity.ProfileSkill;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO response cho profile đầy đủ.
 * Bao gồm dữ liệu từ 5 bảng: profiles, profile_certificates,
 * profile_badges, profile_completed_courses, profile_skills.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompleteProfileResponse {

    // === Dữ liệu từ bảng profiles ===
    private Profile profile;

    // === Dữ liệu từ bảng profile_certificates ===
    private List<ProfileCertificate> certificates;

    // === Dữ liệu từ bảng profile_badges ===
    private List<ProfileBadge> badges;

    // === Dữ liệu từ bảng profile_completed_courses ===
    private List<ProfileCompletedCourse> completedCourses;

    // === Dữ liệu từ bảng profile_skills ===
    private List<ProfileSkill> skills;

    // === Thông tin từ identity-service ===
    private UserDto user;

    // === Token balance từ crypto-service ===
    private BigDecimal tokenBalance;

    // === Computed fields (từ Profile entity) ===
    public Integer getTotalPoints() {
        return profile != null ? profile.getTotalPoints() : 0;
    }

    public Integer getCoursesCompleted() {
        return profile != null ? profile.getCoursesCompleted() : 0;
    }

    public Integer getExamsPassed() {
        return profile != null ? profile.getExamsPassed() : 0;
    }

    public Integer getTotalBadges() {
        return badges != null ? badges.size() : 0;
    }

    public Integer getTotalCertificates() {
        return certificates != null ? certificates.size() : 0;
    }

    public Integer getTotalSkills() {
        return skills != null ? skills.size() : 0;
    }
}
