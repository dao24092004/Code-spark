package com.dao.examservice.service;

import com.dao.examservice.client.CourseServiceClient;
import com.dao.examservice.dto.request.ExamConfigRequest;
import com.dao.examservice.dto.request.ExamCreationRequest;
import com.dao.examservice.dto.request.ExamScheduleRequest;
import com.dao.examservice.dto.request.ExamUpdateRequest;
import com.dao.examservice.dto.request.GenerateQuestionsRequest;
import com.dao.examservice.dto.request.UpdateProgressRequest;
import com.dao.examservice.dto.response.EnumOptionResponse;
import com.dao.examservice.entity.Exam;
import com.dao.examservice.entity.ExamQuestion;
import com.dao.examservice.entity.ExamRegistration;
import com.dao.examservice.entity.Question;
import com.dao.examservice.exception.ResourceNotFoundException;
import com.dao.examservice.exception.ValidationException;
import com.dao.examservice.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExamService {

    private final ExamRepository examRepository;
    private final ExamRegistrationRepository registrationRepository;
    private final ExamQuestionRepository examQuestionRepository;
    private final QuestionRepository questionRepository;
    private final QuestionService questionService;
    private final CourseServiceClient courseServiceClient;
    private final NotificationService notificationService;

    @Transactional
    public Exam createExam(ExamCreationRequest request) {
        validateExamDates(request.startAt, request.endAt);
        validateExamConfig(request.durationMinutes, request.passScore, request.maxAttempts);

        Exam exam = new Exam();
        exam.setCourseId(request.courseId);
        exam.setTitle(request.title);
        exam.setDescription(request.description);
        exam.setStartAt(request.startAt);
        exam.setEndAt(request.endAt);
        exam.setDurationMinutes(request.durationMinutes);
        exam.setPassScore(request.passScore);
        exam.setMaxAttempts(request.maxAttempts);
        exam.setTotalQuestions(request.totalQuestions);
        exam.setCreatedBy(request.createdBy);

        if (request.examStatus != null) {
            exam.setStatus(request.examStatus);
        }
        if (request.randomizeQuestionOrder != null) {
            exam.setRandomizeQuestionOrder(request.randomizeQuestionOrder);
        }
        if (request.randomizeOptionOrder != null) {
            exam.setRandomizeOptionOrder(request.randomizeOptionOrder);
        }
        if (request.showCorrectAnswers != null) {
            exam.setShowCorrectAnswers(request.showCorrectAnswers);
        }
        if (request.partialScoringEnabled != null) {
            exam.setPartialScoringEnabled(request.partialScoringEnabled);
        }

        return examRepository.save(exam);
    }

    @Transactional
    public Exam updateConfig(UUID id, ExamConfigRequest request) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Exam not found with id: " + id));

        if (request.durationMinutes != null) {
            validateDuration(request.durationMinutes);
            exam.setDurationMinutes(request.durationMinutes);
        }
        if (request.passScore != null) {
            validatePassScore(request.passScore);
            exam.setPassScore(request.passScore);
        }
        if (request.maxAttempts != null) {
            validateMaxAttempts(request.maxAttempts);
            exam.setMaxAttempts(request.maxAttempts);
        }

        exam.setUpdatedAt(Instant.now());
        return examRepository.save(exam);
    }

    @Transactional
    public Exam updateExam(UUID id, ExamUpdateRequest request) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Exam not found with id: " + id));

        if (request.title != null) {
            exam.setTitle(request.title);
        }
        if (request.description != null) {
            exam.setDescription(request.description);
        }
        if (request.startAt != null || request.endAt != null) {
            validateExamDates(
                    request.startAt != null ? request.startAt : exam.getStartAt(),
                    request.endAt != null ? request.endAt : exam.getEndAt()
            );
            if (request.startAt != null) {
                exam.setStartAt(request.startAt);
            }
            if (request.endAt != null) {
                exam.setEndAt(request.endAt);
            }
        }
        if (request.durationMinutes != null) {
            validateDuration(request.durationMinutes);
            exam.setDurationMinutes(request.durationMinutes);
        }
        if (request.passScore != null) {
            validatePassScore(request.passScore);
            exam.setPassScore(request.passScore);
        }
        if (request.maxAttempts != null) {
            validateMaxAttempts(request.maxAttempts);
            exam.setMaxAttempts(request.maxAttempts);
        }
        if (request.totalQuestions != null) {
            exam.setTotalQuestions(request.totalQuestions);
        }

        exam.setUpdatedAt(Instant.now());
        return examRepository.save(exam);
    }

    @Transactional(readOnly = true)
    public Exam get(UUID id) {
        return examRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Exam not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public Exam getWithQuestions(UUID id) {
        return examRepository.findByIdWithQuestions(id)
                .orElseThrow(() -> new ResourceNotFoundException("Exam not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public Exam getActive(UUID id) {
        return examRepository.findActiveById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Exam not found with id: " + id));
    }

    @Transactional
    public Exam scheduleAndRegister(UUID examId, ExamScheduleRequest request) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Exam not found with id: " + examId));

        if (request.startAt != null && request.endAt != null) {
            validateExamDates(request.startAt, request.endAt);
            exam.setStartAt(request.startAt);
            exam.setEndAt(request.endAt);
        } else if (request.startAt != null) {
            exam.setStartAt(request.startAt);
        } else if (request.endAt != null) {
            exam.setEndAt(request.endAt);
        }

        if (request.candidateIds != null && !request.candidateIds.isEmpty()) {
            List<ExamRegistration> registrations = new ArrayList<>();
            for (UUID candidateId : request.candidateIds) {
                ExamRegistration reg = new ExamRegistration();
                reg.setExam(exam);
                reg.setUserId(candidateId);
                registrations.add(reg);

                if (exam.getCourseId() != null) {
                    notificationService.sendExamScheduledNotification(
                        candidateId,
                        exam.getTitle(),
                        exam.getStartAt() != null ? exam.getStartAt().toString() : "N/A"
                    );
                }
            }
            registrationRepository.saveAll(registrations);
        }

        exam.setUpdatedAt(Instant.now());
        return exam;
    }

    @Transactional(readOnly = true)
    public List<Exam> getSchedules(Instant start, Instant end) {
        if (start != null && end != null) {
            return examRepository.findByStartAtGreaterThanEqualAndEndAtLessThanEqual(start, end);
        } else if (start != null) {
            return examRepository.findByStartAtGreaterThanEqual(start);
        } else if (end != null) {
            return examRepository.findByEndAtLessThanEqual(end);
        } else {
            return examRepository.findAllActive();
        }
    }

    @Transactional(readOnly = true)
    public Page<Exam> getSchedules(Instant start, Instant end, Pageable pageable) {
        if (start != null && end != null) {
            return examRepository.findByStartAtGreaterThanEqualAndEndAtLessThanEqual(start, end, pageable);
        } else if (start != null) {
            return examRepository.findByStartAtGreaterThanEqual(start, pageable);
        } else if (end != null) {
            return examRepository.findByEndAtLessThanEqual(end, pageable);
        } else {
            return examRepository.findByDeletedAtIsNull(pageable);
        }
    }

    @Transactional(readOnly = true)
    public Page<Exam> searchExams(Exam.ExamStatus status, String title, Pageable pageable) {
        return examRepository.searchExams(status, title, pageable);
    }

    @Transactional
    public void delete(UUID id) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Exam not found with id: " + id));
        exam.softDelete();
        examRepository.save(exam);
    }

    @Transactional
    public void hardDelete(UUID id) {
        examRepository.deleteById(id);
    }

    @Transactional
    public Exam restore(UUID id) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Exam not found with id: " + id));
        exam.restore();
        return examRepository.save(exam);
    }

    @Transactional
    public Exam updateStatus(UUID id, String statusString) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Exam not found with id: " + id));

        try {
            String normalized = statusString.toUpperCase();
            // Backward: PUBLISHED → OPEN
            if ("PUBLISHED".equals(normalized)) {
                normalized = "OPEN";
            }
            Exam.ExamStatus newStatus = Exam.ExamStatus.valueOf(normalized);

            if ((newStatus == Exam.ExamStatus.OPEN || "PUBLISHED".equals(statusString.toUpperCase()))
                    && exam.getPublishedAt() == null) {
                exam.setPublishedAt(Instant.now());
            }

            exam.setStatus(newStatus);
            exam.setUpdatedAt(Instant.now());
            return examRepository.save(exam);
        } catch (IllegalArgumentException e) {
            throw new ValidationException("Invalid status: " + statusString + ". Valid values: DRAFT, SCHEDULED, OPEN, PUBLISHED, CLOSED, CANCELLED");
        }
    }

    @Transactional
    public List<UUID> generateAndSaveQuestions(UUID examId, GenerateQuestionsRequest request) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Exam not found with id: " + examId));

        List<UUID> questionIds = questionService.generateRandomIds(request);

        if (questionIds.isEmpty()) {
            throw new ValidationException(
                "No questions found matching criteria: tags=" + request.tags +
                ", difficulty=" + request.minDifficulty + "-" + request.maxDifficulty
            );
        }

        examQuestionRepository.deleteByExamId(examId);

        List<ExamQuestion> examQuestions = new ArrayList<>();
        for (int i = 0; i < questionIds.size(); i++) {
            UUID questionId = questionIds.get(i);
            Question question = questionRepository.findById(questionId)
                    .orElseThrow(() -> new ResourceNotFoundException("Question not found with id: " + questionId));

            ExamQuestion examQuestion = new ExamQuestion(exam, question, i + 1);
            examQuestions.add(examQuestion);
        }

        examQuestionRepository.saveAll(examQuestions);

        exam.setTotalQuestions(questionIds.size());
        exam.setUpdatedAt(Instant.now());
        examRepository.save(exam);

        return questionIds;
    }

    @Transactional(readOnly = true)
    public List<ExamQuestion> getExamQuestions(UUID examId) {
        examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Exam not found with id: " + examId));

        return examQuestionRepository.findByExamIdOrderByDisplayOrder(examId);
    }

    @Transactional(readOnly = true)
    public long getQuestionCount(UUID examId) {
        return examQuestionRepository.countByExamId(examId);
    }

    /**
     * Xử lý khi hoàn thành bài thi - cập nhật progress và gửi notification.
     */
    @Transactional
    public void onExamCompleted(UUID examId, UUID userId, int score) {
        Exam exam = examRepository.findByIdWithQuestionsAndRegistrations(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Exam not found with id: " + examId));

        boolean passed = exam.getPassScore() != null && score >= exam.getPassScore();

        if (exam.getCourseId() != null) {
            try {
                UpdateProgressRequest progressRequest = new UpdateProgressRequest();
                progressRequest.setScore(score);
                progressRequest.setCompleted(passed);
                progressRequest.setExamId(examId.toString());

                courseServiceClient.updateCourseProgress(exam.getCourseId(), userId, progressRequest);
                log.info("Updated course progress for user {} in course {}", userId, exam.getCourseId());
            } catch (Exception e) {
                log.warn("Failed to update course progress for user {} in course {}: {}", userId, exam.getCourseId(), e.getMessage());
            }
        }

        notificationService.sendExamResultNotification(userId, exam.getTitle(), score, passed);
    }

    // ==================== Enum Lookup Methods ====================

    @Transactional(readOnly = true)
    public List<EnumOptionResponse> getAllExamTypes() {
        return List.of(
            new EnumOptionResponse("PRACTICE", "Practice", "Luyện tập", "Practice exam for learning", 1),
            new EnumOptionResponse("QUIZ", "Quiz", "Bài kiểm tra", "Short quiz exam", 2),
            new EnumOptionResponse("MIDTERM", "Midterm", "Giữa kỳ", "Midterm exam", 3),
            new EnumOptionResponse("FINAL", "Final", "Cuối kỳ", "Final exam", 4),
            new EnumOptionResponse("MOCK", "Mock", "Thi thử", "Mock exam", 5)
        );
    }

    @Transactional(readOnly = true)
    public List<EnumOptionResponse> getAllExamDifficulties() {
        return List.of(
            new EnumOptionResponse("EASY", "Easy", "Dễ", "Easy difficulty", 1),
            new EnumOptionResponse("MEDIUM", "Medium", "Trung bình", "Medium difficulty", 2),
            new EnumOptionResponse("HARD", "Hard", "Khó", "Hard difficulty", 3)
        );
    }

    @Transactional(readOnly = true)
    public List<EnumOptionResponse> getAllExamStatuses() {
        return List.of(
            new EnumOptionResponse("DRAFT", "Draft", "Nháp", "Exam is being prepared", 1),
            new EnumOptionResponse("SCHEDULED", "Scheduled", "Đã lên lịch", "Exam is scheduled", 2),
            new EnumOptionResponse("OPEN", "Open", "Mở đăng ký", "Exam is open for registration", 3),
            new EnumOptionResponse("CLOSED", "Closed", "Đóng đăng ký", "Exam registration closed", 4),
            new EnumOptionResponse("CANCELLED", "Cancelled", "Đã hủy", "Exam is cancelled", 5)
        );
    }

    // ==================== Validation Methods ====================

    private void validateExamDates(Instant startAt, Instant endAt) {
        if (startAt != null && endAt != null && endAt.isBefore(startAt)) {
            throw new ValidationException("End time must be after start time");
        }
    }

    private void validateExamConfig(Integer durationMinutes, Integer passScore, Integer maxAttempts) {
        validateDuration(durationMinutes);
        validatePassScore(passScore);
        validateMaxAttempts(maxAttempts);
    }

    private void validateDuration(Integer duration) {
        if (duration != null && duration <= 0) {
            throw new ValidationException("Duration must be greater than 0");
        }
        if (duration != null && duration > 480) {
            throw new ValidationException("Duration cannot exceed 480 minutes (8 hours)");
        }
    }

    private void validatePassScore(Integer passScore) {
        if (passScore != null && (passScore < 0 || passScore > 100)) {
            throw new ValidationException("Pass score must be between 0 and 100");
        }
    }

    private void validateMaxAttempts(Integer maxAttempts) {
        if (maxAttempts != null && maxAttempts < 1) {
            throw new ValidationException("Max attempts must be at least 1");
        }
        if (maxAttempts != null && maxAttempts > 100) {
            throw new ValidationException("Max attempts cannot exceed 100");
        }
    }
}


