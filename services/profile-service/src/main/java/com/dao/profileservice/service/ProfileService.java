package com.dao.profileservice.service;

import com.dao.profileservice.dto.CompleteProfileResponse;
import com.dao.profileservice.dto.ProfileDto;
import com.dao.profileservice.entity.Profile;
import com.dao.profileservice.messaging.dto.CertificateIssuedEvent;
import com.dao.profileservice.messaging.dto.CourseCompletedEvent;
import com.dao.profileservice.messaging.dto.ExamPassedEvent;

import java.util.UUID;

public interface ProfileService {

    Profile createProfile(ProfileDto profileDto);

    Profile getProfileByUserId(Long userId);

    Profile updateProfile(Long userId, ProfileDto profileDto);

    void deleteProfile(Long userId);

    CompleteProfileResponse getCompleteProfile(Long userId);

    /**
     * Sync chứng chỉ từ Certificate Service vào profile_db.
     * Xử lý: profile_certificates, profile_badges, profile_skills
     *
     * @param event CertificateIssuedEvent từ topic certificate.issued
     */
    void syncCertificate(CertificateIssuedEvent event);

    /**
     * Sync khóa học hoàn thành từ Course Service vào profile_db.
     * Xử lý: profile_completed_courses + cập nhật coursesCompleted counter
     *
     * @param event CourseCompletedEvent từ topic course.completed
     */
    void syncCourseCompletion(CourseCompletedEvent event);

    /**
     * Sync kỳ thi đỗ từ Exam Service vào profile_db.
     * Xử lý: cập nhật examsPassed counter
     *
     * @param event ExamPassedEvent từ topic exam.passed
     */
    void syncExamPassed(ExamPassedEvent event);
}
