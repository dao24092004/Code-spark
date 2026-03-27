package com.dao.profileservice.service.impl;

import com.dao.common.dto.ApiResponse;
import com.dao.common.exception.AppException;
import com.dao.profileservice.client.CertificateServiceClient;
import com.dao.profileservice.client.CourseServiceClient;
import com.dao.profileservice.client.FileServiceClient;
import com.dao.profileservice.client.IdentityServiceClient;
import com.dao.profileservice.client.RewardServiceClient;
import com.dao.profileservice.client.TokenRewardServiceClient;
import com.dao.profileservice.client.dto.CertificateInfoResponse;
import com.dao.profileservice.client.dto.CourseInfoResponse;
import com.dao.profileservice.client.dto.RewardSummaryResponse;
import com.dao.profileservice.dto.CompleteProfileResponse;
import com.dao.profileservice.dto.FileDto;
import com.dao.profileservice.dto.ProfileDto;
import com.dao.profileservice.dto.UserDto;
import com.dao.profileservice.entity.Profile;
import com.dao.profileservice.entity.ProfileBadge;
import com.dao.profileservice.entity.ProfileCertificate;
import com.dao.profileservice.entity.ProfileCompletedCourse;
import com.dao.profileservice.entity.ProfileSkill;
import com.dao.profileservice.entity.ProficiencyLevel;
import com.dao.profileservice.messaging.ProfileEventProducer;
import com.dao.profileservice.messaging.dto.CertificateIssuedEvent;
import com.dao.profileservice.messaging.dto.CourseCompletedEvent;
import com.dao.profileservice.messaging.dto.ExamPassedEvent;
import com.dao.profileservice.repository.ProfileBadgeRepository;
import com.dao.profileservice.repository.ProfileCertificateRepository;
import com.dao.profileservice.repository.ProfileCompletedCourseRepository;
import com.dao.profileservice.repository.ProfileRepository;
import com.dao.profileservice.repository.ProfileSkillRepository;
import com.dao.profileservice.service.ProfileService;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ProfileServiceImpl implements ProfileService {

    private final ProfileRepository profileRepository;
    private final ProfileCertificateRepository certificateRepository;
    private final ProfileBadgeRepository badgeRepository;
    private final ProfileCompletedCourseRepository completedCourseRepository;
    private final ProfileSkillRepository skillRepository;

    private final IdentityServiceClient identityServiceClient;
    private final FileServiceClient fileServiceClient;
    private final ProfileEventProducer profileEventProducer;
    private final TokenRewardServiceClient tokenRewardServiceClient;
    private final CourseServiceClient courseServiceClient;
    private final CertificateServiceClient certificateServiceClient;
    private final RewardServiceClient rewardServiceClient;

    // ============================================================
    // Long userId → UUID (deterministic)
    // Giữ Long userId trong Kafka/Feign contracts, chỉ dùng UUID trong DB
    // ============================================================
    private UUID longToUuid(Long userId) {
        return UUID.nameUUIDFromBytes(("user-" + userId).getBytes());
    }

    // ============================================================
    // CRUD cơ bản
    // ============================================================

    @Override
    public Profile createProfile(ProfileDto profileDto) {
        Long rawUserId = profileDto.getUserId();
        UUID userId = longToUuid(rawUserId);

        // Check if user exists in identity-service
        try {
            identityServiceClient.getUserById(rawUserId);
        } catch (FeignException.NotFound e) {
            throw new AppException("User not found with id: " + rawUserId, HttpStatus.NOT_FOUND);
        }

        if (profileRepository.existsByUserId(userId)) {
            throw new AppException("Profile already exists for user: " + rawUserId, HttpStatus.CONFLICT);
        }

        Profile profile = Profile.builder()
                .userId(userId)
                .firstName(profileDto.getFirstName())
                .lastName(profileDto.getLastName())
                .email(profileDto.getEmail())
                .bio(profileDto.getBio())
                .avatarUrl(profileDto.getAvatarUrl())
                .totalPoints(0)
                .coursesCompleted(0)
                .examsPassed(0)
                .build();

        profile = profileRepository.save(profile);

        profileEventProducer.sendProfileCreatedEvent(rawUserId, profile.getId());
        log.info("Created profile {} for user: {}", profile.getId(), rawUserId);

        return profile;
    }

    @Override
    public Profile getProfileByUserId(Long userId) {
        UUID uuid = longToUuid(userId);
        Profile profile = profileRepository.findByUserId(uuid)
                .orElseThrow(() -> new AppException(
                        "Profile not found for user: " + userId, HttpStatus.NOT_FOUND));

        return profile;
    }

    @Override
    public Profile updateProfile(Long userId, ProfileDto profileDto) {
        UUID uuid = longToUuid(userId);
        Profile existingProfile = profileRepository.findByUserId(uuid)
                .orElseThrow(() -> new AppException(
                        "Profile not found for user: " + userId, HttpStatus.NOT_FOUND));

        if (profileDto.getFirstName() != null) {
            existingProfile.setFirstName(profileDto.getFirstName());
        }
        if (profileDto.getLastName() != null) {
            existingProfile.setLastName(profileDto.getLastName());
        }
        if (profileDto.getEmail() != null) {
            existingProfile.setEmail(profileDto.getEmail());
        }
        if (profileDto.getBio() != null) {
            existingProfile.setBio(profileDto.getBio());
        }
        if (profileDto.getAvatarUrl() != null) {
            existingProfile.setAvatarUrl(profileDto.getAvatarUrl());
        }

        Profile updatedProfile = profileRepository.save(existingProfile);
        profileEventProducer.sendProfileUpdatedEvent(userId, updatedProfile.getId());
        log.info("Updated profile {} for user: {}", updatedProfile.getId(), userId);

        return updatedProfile;
    }

    @Override
    public void deleteProfile(Long userId) {
        UUID uuid = longToUuid(userId);
        Profile profile = profileRepository.findByUserId(uuid)
                .orElseThrow(() -> new AppException(
                        "Profile not found for user: " + userId, HttpStatus.NOT_FOUND));
        profileRepository.delete(profile);
        log.info("Deleted profile for user: {}", userId);
    }

    // ============================================================
    // Sync từ Kafka events
    // ============================================================

    @Override
    public void syncCertificate(CertificateIssuedEvent event) {
        Long rawUserId = event.getUserId();
        UUID userId = longToUuid(rawUserId);

        Profile profile = profileRepository.findByUserId(userId).orElse(null);
        if (profile == null) {
            log.warn("Profile not found for userId={}, skipping certificate sync", rawUserId);
            return;
        }

        UUID certId = event.getCertificateId();

        // --- 1. ProfileCertificate ---
        if (!certificateRepository.existsByProfileIdAndCertificateId(profile.getId(), certId)) {
            ProfileCertificate certificate = ProfileCertificate.builder()
                    .profile(profile)
                    .certificateId(certId)
                    .title(event.getTitle())
                    .issuer(event.getIssuer())
                    .issuedAt(event.getIssuedAt() != null ? event.getIssuedAt() : LocalDateTime.now())
                    .credentialUrl(event.getCredentialUrl())
                    .build();
            certificateRepository.save(certificate);
            log.info("Saved certificate {} for profile {}", certId, profile.getId());
        }

        // --- 2. ProfileBadge ---
        String badgeName = "Certificate: " + (event.getTitle() != null ? event.getTitle() : certId.toString());
        if (!badgeRepository.existsByProfileIdAndBadgeName(profile.getId(), badgeName)) {
            ProfileBadge badge = ProfileBadge.builder()
                    .profile(profile)
                    .badgeName(badgeName)
                    .badgeIcon("certificate-" + certId.toString().substring(0, 8))
                    .description("Chứng chỉ hoàn thành khóa học: " + event.getCourseName())
                    .earnedAt(event.getIssuedAt() != null ? event.getIssuedAt() : LocalDateTime.now())
                    .certificateId(certId)
                    .courseId(event.getCourseId())
                    .build();
            badgeRepository.save(badge);
            log.info("Saved badge '{}' for profile {}", badgeName, profile.getId());
        }

        // --- 3. ProfileSkill (từ cm_certificate_skills) ---
        if (event.getSkills() != null && !event.getSkills().isEmpty()) {
            for (CertificateIssuedEvent.CertificateSkill skill : event.getSkills()) {
                String skillName = skill.getSkillName();
                if (skillName == null || skillName.isBlank()) continue;

                ProfileSkill existingSkill = skillRepository
                        .findByProfileIdAndSkillName(profile.getId(), skillName).orElse(null);

                ProficiencyLevel newLevel = parseLevel(skill.getProficiencyLevel());
                ProficiencyLevel bestLevel = ProficiencyLevel.EXPERT;

                if (existingSkill != null) {
                    // Upsert: nâng cấp level nếu cao hơn
                    if (newLevel != null && newLevel.ordinal() > existingSkill.getProficiencyLevel().ordinal()) {
                        existingSkill.setProficiencyLevel(newLevel);
                        existingSkill.setCertificateId(certId);
                        skillRepository.save(existingSkill);
                        log.info("Upgraded skill '{}' to {} for profile {}",
                                skillName, newLevel, profile.getId());
                    }
                } else {
                    // Tạo mới
                    ProfileSkill newSkill = ProfileSkill.builder()
                            .profile(profile)
                            .skillName(skillName)
                            .proficiencyLevel(newLevel != null ? newLevel : ProficiencyLevel.BEGINNER)
                            .certificateId(certId)
                            .earnedAt(event.getIssuedAt() != null ? event.getIssuedAt() : LocalDateTime.now())
                            .build();
                    skillRepository.save(newSkill);
                    log.info("Saved skill '{}' ({}) for profile {}",
                            skillName, newLevel, profile.getId());
                }
            }
        }

        // --- 4. Tăng totalPoints ---
        profile.setTotalPoints(profile.getTotalPoints() + 50);
        profileRepository.save(profile);
    }

    @Override
    public void syncCourseCompletion(CourseCompletedEvent event) {
        Long rawUserId = event.getUserId();
        UUID userId = longToUuid(rawUserId);

        Profile profile = profileRepository.findByUserId(userId).orElse(null);
        if (profile == null) {
            log.warn("Profile not found for userId={}, skipping course completion sync", rawUserId);
            return;
        }

        UUID courseId = event.getCourseId();

        // Upsert: nếu đã hoàn thành thì cập nhật điểm
        ProfileCompletedCourse existing = completedCourseRepository
                .findByProfileIdAndCourseId(profile.getId(), courseId).orElse(null);

        if (existing != null) {
            existing.setFinalScore(event.getFinalScore());
            completedCourseRepository.save(existing);
            log.info("Updated completed course {} for profile {}", courseId, profile.getId());
        } else {
            ProfileCompletedCourse completed = ProfileCompletedCourse.builder()
                    .profile(profile)
                    .courseId(courseId)
                    .completedAt(event.getCompletedAt() != null
                            ? event.getCompletedAt() : LocalDateTime.now())
                    .finalScore(event.getFinalScore())
                    .build();
            completedCourseRepository.save(completed);
            log.info("Saved completed course {} for profile {}", courseId, profile.getId());

            // Tăng counter
            profile.setCoursesCompleted(profile.getCoursesCompleted() + 1);
            profile.setTotalPoints(profile.getTotalPoints() + 100);
            profileRepository.save(profile);
        }
    }

    @Override
    public void syncExamPassed(ExamPassedEvent event) {
        Long rawUserId = event.getUserId();
        UUID userId = longToUuid(rawUserId);

        Profile profile = profileRepository.findByUserId(userId).orElse(null);
        if (profile == null) {
            log.warn("Profile not found for userId={}, skipping exam passed sync", rawUserId);
            return;
        }

        profile.setExamsPassed(profile.getExamsPassed() + 1);
        // Cộng điểm: base 100 + bonus từ điểm thi
        int bonus = event.getScore() != null ? event.getScore() / 10 : 0;
        profile.setTotalPoints(profile.getTotalPoints() + 100 + bonus);
        profileRepository.save(profile);

        log.info("Synced exam passed for userId={}: examsPassed={}, totalPoints={}",
                rawUserId, profile.getExamsPassed(), profile.getTotalPoints());
    }

    // ============================================================
    // Profile đầy đủ
    // ============================================================

    @Override
    public CompleteProfileResponse getCompleteProfile(Long userId) {
        log.info("Fetching complete profile for user: {}", userId);

        UUID uuid = longToUuid(userId);
        Profile profile = profileRepository.findByUserId(uuid)
                .orElseThrow(() -> new AppException(
                        "Profile not found for user: " + userId, HttpStatus.NOT_FOUND));

        // Fetch chi tiết từ 5 bảng con
        List<ProfileCertificate> certs = certificateRepository.findByProfileId(profile.getId());
        List<ProfileBadge> badges = badgeRepository.findByProfileId(profile.getId());
        List<ProfileCompletedCourse> completedCourses = completedCourseRepository.findByProfileId(profile.getId());
        List<ProfileSkill> skills = skillRepository.findByProfileId(profile.getId());

        // Thông tin từ identity-service
        UserDto user = null;
        try {
            user = identityServiceClient.getUserById(userId);
        } catch (AppException e) {
            log.warn("Could not fetch user data: {}", e.getMessage());
        }

        // Token balance
        BigDecimal tokenBalance = BigDecimal.ZERO;
        try {
            var resp = tokenRewardServiceClient.getTokenBalance(userId);
            if (resp != null && resp.isSuccess()) {
                tokenBalance = resp.getBalance();
            }
        } catch (Exception e) {
            log.warn("Could not fetch token balance: {}", e.getMessage());
        }

        return CompleteProfileResponse.builder()
                .profile(profile)
                .user(user)
                .certificates(certs)
                .badges(badges)
                .completedCourses(completedCourses)
                .skills(skills)
                .tokenBalance(tokenBalance)
                .build();
    }

    // ============================================================
    // Helper
    // ============================================================

    private ProficiencyLevel parseLevel(String level) {
        if (level == null) return null;
        try {
            return ProficiencyLevel.valueOf(level.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ProficiencyLevel.BEGINNER;
        }
    }

    public UserDto getUserFromIdentityService(Long userId) {
        try {
            log.info("Fetching user data via OpenFeign for user: {}", userId);
            return identityServiceClient.getUserById(userId);
        } catch (FeignException e) {
            log.error("Failed to fetch user data: {}", e.getMessage());
            throw new AppException("Error fetching user data", HttpStatus.SERVICE_UNAVAILABLE);
        }
    }

    public List<FileDto> getUserFiles(Long userId) {
        try {
            return fileServiceClient.getUserFiles(userId);
        } catch (FeignException e) {
            log.error("Failed to fetch user files: {}", e.getMessage());
            return List.of();
        }
    }
}
