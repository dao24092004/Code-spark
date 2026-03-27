package com.dao.profileservice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Hồ sơ người dùng mở rộng.
 * Theo ERD: profiles table với các bảng con:
 * - profile_certificates, profile_badges,
 * - profile_completed_courses, profile_skills
 *
 * NOTE: Không dùng @Builder ở class-level vì sẽ xung đột với
 * @NoArgsConstructor + @AllArgsConstructor trong JPA/Hibernate.
 * Chỉ dùng @Builder ở constructor-level.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "profiles", indexes = {
        @Index(name = "idx_profiles_user_id", columnList = "user_id", unique = true)
})
public class Profile extends BaseEntity {

    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    @Column(name = "first_name", length = 100)
    private String firstName;

    @Column(name = "last_name", length = 100)
    private String lastName;

    @Column(name = "email", nullable = false, length = 255)
    private String email;

    @Column(name = "bio", columnDefinition = "TEXT")
    private String bio;

    @Column(name = "avatar_url", columnDefinition = "TEXT")
    private String avatarUrl;

    @Column(name = "total_points", nullable = false)
    private Integer totalPoints = 0;

    @Column(name = "courses_completed", nullable = false)
    private Integer coursesCompleted = 0;

    @Column(name = "exams_passed", nullable = false)
    private Integer examsPassed = 0;

    @OneToMany(mappedBy = "profile", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<ProfileCertificate> certificates = new ArrayList<>();

    @OneToMany(mappedBy = "profile", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<ProfileBadge> badges = new ArrayList<>();

    @OneToMany(mappedBy = "profile", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<ProfileCompletedCourse> completedCourses = new ArrayList<>();

    @OneToMany(mappedBy = "profile", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<ProfileSkill> skills = new ArrayList<>();

    /**
     * Constructor với @Builder - KHÔNG conflict với @NoArgsConstructor
     * vì đây là constructor có tham số, JPA dùng NoArgsConstructor.
     */
    @Builder
    public Profile(UUID userId, String firstName, String lastName, String email,
                   String bio, String avatarUrl, Integer totalPoints,
                   Integer coursesCompleted, Integer examsPassed,
                   List<ProfileCertificate> certificates, List<ProfileBadge> badges,
                   List<ProfileCompletedCourse> completedCourses, List<ProfileSkill> skills) {
        this.userId = userId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.bio = bio;
        this.avatarUrl = avatarUrl;
        this.totalPoints = totalPoints != null ? totalPoints : 0;
        this.coursesCompleted = coursesCompleted != null ? coursesCompleted : 0;
        this.examsPassed = examsPassed != null ? examsPassed : 0;
        this.certificates = certificates != null ? certificates : new ArrayList<>();
        this.badges = badges != null ? badges : new ArrayList<>();
        this.completedCourses = completedCourses != null ? completedCourses : new ArrayList<>();
        this.skills = skills != null ? skills : new ArrayList<>();
    }

    // ===== Helper methods cho bidirectional relationship =====

    public void addCertificate(ProfileCertificate certificate) {
        certificates.add(certificate);
        certificate.setProfile(this);
    }

    public void removeCertificate(ProfileCertificate certificate) {
        certificates.remove(certificate);
        certificate.setProfile(null);
    }

    public void addBadge(ProfileBadge badge) {
        badges.add(badge);
        badge.setProfile(this);
    }

    public void removeBadge(ProfileBadge badge) {
        badges.remove(badge);
        badge.setProfile(null);
    }

    public void addCompletedCourse(ProfileCompletedCourse course) {
        completedCourses.add(course);
        course.setProfile(this);
    }

    public void removeCompletedCourse(ProfileCompletedCourse course) {
        completedCourses.remove(course);
        course.setProfile(null);
    }

    public void addSkill(ProfileSkill skill) {
        skills.add(skill);
        skill.setProfile(this);
    }

    public void removeSkill(ProfileSkill skill) {
        skills.remove(skill);
        skill.setProfile(null);
    }
}
