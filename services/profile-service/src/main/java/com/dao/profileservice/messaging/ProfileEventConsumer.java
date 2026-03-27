package com.dao.profileservice.messaging;

import com.dao.profileservice.dto.ProfileDto;
import com.dao.profileservice.messaging.dto.CertificateIssuedEvent;
import com.dao.profileservice.messaging.dto.CourseCompletedEvent;
import com.dao.profileservice.messaging.dto.ExamPassedEvent;
import com.dao.profileservice.messaging.dto.UserRegisteredEvent;
import com.dao.profileservice.service.ProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ProfileEventConsumer {

    private final ProfileService profileService;

    // ============================================================
    // Topic: user.registered
    // Tạo profile mới khi user đăng ký
    // ============================================================
    @KafkaListener(topics = "user.registered", groupId = "profile-service-group")
    public void handleUserRegistered(@Payload UserRegisteredEvent event,
                                     @Header(KafkaHeaders.RECEIVED_KEY) String key) {
        log.info("[Kafka] Received user.registered key={}, userId={}", key, event.getUserId());
        try {
            ProfileDto dto = new ProfileDto();
            dto.setUserId(event.getUserId());  // Long - từ identity-service
            dto.setFirstName(event.getFirstName());
            dto.setLastName(event.getLastName());
            dto.setEmail(event.getEmail());
            profileService.createProfile(dto);
            log.info("[Kafka] Profile created for userId={}", event.getUserId());
        } catch (Exception e) {
            log.error("[Kafka] Failed to create profile for userId={}: {}",
                    event.getUserId(), e.getMessage(), e);
        }
    }

    // ============================================================
    // Topic: certificate.issued
    // Sync certificate, badges và skills vào profile_db
    // ============================================================
    @KafkaListener(topics = "certificate.issued", groupId = "profile-service-group")
    public void handleCertificateIssued(@Payload CertificateIssuedEvent event,
                                         @Header(KafkaHeaders.RECEIVED_KEY) String key) {
        log.info("[Kafka] Received certificate.issued key={}, certId={}, userId={}",
                key, event.getCertificateId(), event.getUserId());
        try {
            profileService.syncCertificate(event);
            log.info("[Kafka] Certificate synced for userId={}", event.getUserId());
        } catch (Exception e) {
            log.error("[Kafka] Failed to sync certificate certId={}, userId={}: {}",
                    event.getCertificateId(), event.getUserId(), e.getMessage(), e);
        }
    }

    // ============================================================
    // Topic: course.completed
    // Sync completed course vào profile_completed_courses
    // ============================================================
    @KafkaListener(topics = "course.completed", groupId = "profile-service-group")
    public void handleCourseCompleted(@Payload CourseCompletedEvent event,
                                       @Header(KafkaHeaders.RECEIVED_KEY) String key) {
        log.info("[Kafka] Received course.completed key={}, courseId={}, userId={}",
                key, event.getCourseId(), event.getUserId());
        try {
            profileService.syncCourseCompletion(event);
            log.info("[Kafka] Course completion synced for userId={}", event.getUserId());
        } catch (Exception e) {
            log.error("[Kafka] Failed to sync course completion courseId={}, userId={}: {}",
                    event.getCourseId(), event.getUserId(), e.getMessage(), e);
        }
    }

    // ============================================================
    // Topic: exam.passed
    // Cộng điểm exams_passed vào profile
    // ============================================================
    @KafkaListener(topics = "exam.passed", groupId = "profile-service-group")
    public void handleExamPassed(@Payload ExamPassedEvent event,
                                 @Header(KafkaHeaders.RECEIVED_KEY) String key) {
        log.info("[Kafka] Received exam.passed key={}, examId={}, userId={}",
                key, event.getExamId(), event.getUserId());
        try {
            profileService.syncExamPassed(event);
            log.info("[Kafka] Exam passed synced for userId={}", event.getUserId());
        } catch (Exception e) {
            log.error("[Kafka] Failed to sync exam passed examId={}, userId={}: {}",
                    event.getExamId(), event.getUserId(), e.getMessage(), e);
        }
    }

    // ============================================================
    // Topic: user.updated
    // ============================================================
    @KafkaListener(topics = "user.updated", groupId = "profile-service-group")
    public void handleUserUpdated(@Payload Object event,
                                  @Header(KafkaHeaders.RECEIVED_KEY) String key) {
        log.info("[Kafka] Received user.updated key={}", key);
    }

    // ============================================================
    // Topic: file.processed
    // ============================================================
    @KafkaListener(topics = "file.processed", groupId = "profile-service-group")
    public void handleFileProcessed(@Payload Object event,
                                    @Header(KafkaHeaders.RECEIVED_KEY) String key) {
        log.info("[Kafka] Received file.processed key={}", key);
    }
}
