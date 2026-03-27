package com.dao.profileservice.messaging.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Event được gửi khi Certificate Service cấp chứng chỉ.
 * Topic: certificate.issued
 *
 * Các trường từ cm_certificate:
 * - id, user_id, course_id, issued_at, credential_url
 * Các trường từ cm_course:
 * - course_name, issuer
 * Các trường từ cm_certificate_skills:
 * - skills (list of {skill_name, proficiency_level})
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CertificateIssuedEvent {
    private UUID certificateId;
    private Long userId;                    // Long từ identity-service
    private UUID courseId;
    private String courseName;
    private String title;                  // certificate title (thường = course_name)
    private String issuer;                 // thường = "CodeSpark Academy"
    private String credentialUrl;
    private LocalDateTime issuedAt;

    // Skills extracted from cm_certificate_skills
    private List<CertificateSkill> skills;

    private Long timestamp;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CertificateSkill {
        private String skillName;
        private String proficiencyLevel;    // BEGINNER, INTERMEDIATE, ADVANCED, EXPERT
    }
}
