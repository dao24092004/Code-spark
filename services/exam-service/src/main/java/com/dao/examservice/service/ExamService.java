package com.dao.examservice.service;

import com.dao.examservice.dto.request.ExamConfigRequest;
import com.dao.examservice.dto.request.ExamCreationRequest;
import com.dao.examservice.dto.request.ExamScheduleRequest;
import com.dao.examservice.dto.request.ExamUpdateRequest;
import com.dao.examservice.dto.request.GenerateQuestionsRequest;
import com.dao.examservice.dto.response.EnumOptionResponse;
import com.dao.examservice.entity.Exam;
import com.dao.examservice.entity.ExamDifficulty;
import com.dao.examservice.entity.ExamQuestion;
import com.dao.examservice.entity.ExamRegistration;
import com.dao.examservice.entity.ExamStatus;
import com.dao.examservice.entity.ExamType;
import com.dao.examservice.entity.Question;
import com.dao.examservice.exception.ResourceNotFoundException;
import com.dao.examservice.repository.ExamDifficultyRepository;
import com.dao.examservice.repository.ExamQuestionRepository;
import com.dao.examservice.repository.ExamRegistrationRepository;
import com.dao.examservice.repository.ExamRepository;
import com.dao.examservice.repository.ExamStatusRepository;
import com.dao.examservice.repository.ExamTypeRepository;
import com.dao.examservice.repository.QuestionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ExamService {

    private final ExamRepository examRepository;
    private final ExamRegistrationRepository registrationRepository;
    private final ExamQuestionRepository examQuestionRepository;
    private final QuestionRepository questionRepository;
    private final ExamTypeRepository examTypeRepository;
    private final ExamDifficultyRepository examDifficultyRepository;
    private final ExamStatusRepository examStatusRepository;
    private final QuestionService questionService;

    public ExamService(
            ExamRepository examRepository, 
            ExamRegistrationRepository registrationRepository,
            ExamQuestionRepository examQuestionRepository,
            QuestionRepository questionRepository,
            ExamTypeRepository examTypeRepository,
            ExamDifficultyRepository examDifficultyRepository,
            ExamStatusRepository examStatusRepository,
            QuestionService questionService
    ) {
        this.examRepository = examRepository;
        this.registrationRepository = registrationRepository;
        this.examQuestionRepository = examQuestionRepository;
        this.questionRepository = questionRepository;
        this.examTypeRepository = examTypeRepository;
        this.examDifficultyRepository = examDifficultyRepository;
        this.examStatusRepository = examStatusRepository;
        this.questionService = questionService;
    }

    @Transactional
    public Exam createExam(ExamCreationRequest request) {
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
        if (request.tags != null) {
            exam.setTags(request.tags);  // ✨ Save tags
        }
        return examRepository.save(exam);
    }

    @Transactional
    public Exam updateConfig(UUID id, ExamConfigRequest request) {
        Exam exam = examRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Exam not found"));
        exam.setDurationMinutes(request.durationMinutes);
        exam.setPassScore(request.passScore);
        exam.setMaxAttempts(request.maxAttempts);
        return examRepository.save(exam);
    }

    @Transactional
    public Exam updateExam(UUID id, ExamUpdateRequest request) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Exam not found"));

        if (request.title != null) {
            exam.setTitle(request.title);
        }
        if (request.description != null) {
            exam.setDescription(request.description);
        }
        if (request.startAt != null) {
            exam.setStartAt(request.startAt);
        }
        if (request.endAt != null) {
            exam.setEndAt(request.endAt);
        }
        if (request.durationMinutes != null) {
            exam.setDurationMinutes(request.durationMinutes);
        }
        if (request.passScore != null) {
            exam.setPassScore(request.passScore);
        }
        if (request.maxAttempts != null) {
            exam.setMaxAttempts(request.maxAttempts);
        }
        if (request.totalQuestions != null) {
            exam.setTotalQuestions(request.totalQuestions);
        }
        if (request.tags != null) {
            exam.setTags(new HashSet<>(request.tags));
        }

        return examRepository.save(exam);
    }

    @Transactional(readOnly = true)
    public Exam get(UUID id) {
        return examRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Exam not found"));
    }

    @Transactional
    public Exam scheduleAndRegister(UUID examId, ExamScheduleRequest request) {
        Exam exam = examRepository.findById(examId).orElseThrow(() -> new ResourceNotFoundException("Exam not found"));
        if (request.startAt != null) {
            exam.setStartAt(request.startAt);
        }
        if (request.endAt != null) {
            exam.setEndAt(request.endAt);
        }

        if (request.candidateIds != null && !request.candidateIds.isEmpty()) {
            List<ExamRegistration> registrations = new java.util.ArrayList<>();
            for (Long candidateId : request.candidateIds) {
                ExamRegistration reg = new ExamRegistration();
                reg.setExam(exam);
                reg.setUserId(candidateId);
                registrations.add(reg);
            }
            registrationRepository.saveAll(registrations);
        }

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
            return examRepository.findAll();
        }
    }

    @Transactional
    public void delete(UUID id) {
        examRepository.deleteById(id);
    }

    /**
     * Update exam status (e.g., DRAFT -> SCHEDULED for publishing)
     */
    @Transactional
    public Exam updateStatus(UUID id, String statusString) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Exam not found"));
        
        try {
            Exam.ExamStatus newStatus = Exam.ExamStatus.valueOf(statusString);
            exam.setStatus(newStatus);
            return examRepository.save(exam);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid status: " + statusString);
        }
    }

    /**
     * Generate and save random questions to an exam.
     * This method:
     * 1. Generates random question IDs based on filter criteria
     * 2. Deletes existing exam questions (if any)
     * 3. Saves new ExamQuestion records to link exam with questions
     * 4. Updates exam's totalQuestions field
     * 
     * @param examId The exam to add questions to
     * @param request Filter criteria (tags, difficulty range, count)
     * @return List of generated question IDs
     */
    @Transactional
    public List<UUID> generateAndSaveQuestions(UUID examId, GenerateQuestionsRequest request) {
        // 1. Validate exam exists
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Exam not found with id: " + examId));

        // 2. Generate random question IDs using QuestionService
        List<UUID> questionIds = questionService.generateRandomIds(request);

        if (questionIds.isEmpty()) {
            throw new IllegalArgumentException(
                "No questions found matching criteria: tags=" + request.tags + 
                ", difficulty=" + request.minDifficulty + "-" + request.maxDifficulty
            );
        }

        // 3. Delete existing exam questions (if regenerating)
        examQuestionRepository.deleteByExamId(examId);

        // 4. Create ExamQuestion records for each question
        List<ExamQuestion> examQuestions = new ArrayList<>();
        for (int i = 0; i < questionIds.size(); i++) {
            UUID questionId = questionIds.get(i);
            Question question = questionRepository.findById(questionId)
                    .orElseThrow(() -> new ResourceNotFoundException("Question not found with id: " + questionId));

            ExamQuestion examQuestion = new ExamQuestion(exam, question, i + 1); // displayOrder is 1-indexed
            examQuestions.add(examQuestion);
        }

        // 5. Save all ExamQuestion records
        examQuestionRepository.saveAll(examQuestions);

        // 6. Update exam's totalQuestions field
        exam.setTotalQuestions(questionIds.size());
        examRepository.save(exam);

        return questionIds;
    }

    /**
     * Get all questions for an exam, ordered by displayOrder.
     * Used when displaying exam details or when student takes the exam.
     * 
     * @param examId The exam ID
     * @return List of ExamQuestion records with full question data
     */
    @Transactional(readOnly = true)
    public List<ExamQuestion> getExamQuestions(UUID examId) {
        // Validate exam exists
        examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Exam not found with id: " + examId));

        return examQuestionRepository.findByExamIdOrderByDisplayOrder(examId);
    }

    // ==================== Enum Lookup Methods ====================

    /**
     * Get all exam types from database
     */
    @Transactional(readOnly = true)
    public List<EnumOptionResponse> getAllExamTypes() {
        return examTypeRepository.findAllActiveOrderByDisplayOrder()
                .stream()
                .map(this::toEnumOptionResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get all exam difficulties from database
     */
    @Transactional(readOnly = true)
    public List<EnumOptionResponse> getAllExamDifficulties() {
        return examDifficultyRepository.findAllActiveOrderByDisplayOrder()
                .stream()
                .map(this::toEnumOptionResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get all exam statuses from database
     */
    @Transactional(readOnly = true)
    public List<EnumOptionResponse> getAllExamStatuses() {
        return examStatusRepository.findAllActiveOrderByDisplayOrder()
                .stream()
                .map(this::toEnumOptionResponse)
                .collect(Collectors.toList());
    }

    // Helper methods to convert entities to DTOs
    private EnumOptionResponse toEnumOptionResponse(ExamType type) {
        return new EnumOptionResponse(
                type.getCode(),
                type.getLabel(),
                type.getLabelVi(),
                type.getDescription(),
                type.getDisplayOrder()
        );
    }

    private EnumOptionResponse toEnumOptionResponse(ExamDifficulty difficulty) {
        return new EnumOptionResponse(
                difficulty.getCode(),
                difficulty.getLabel(),
                difficulty.getLabelVi(),
                difficulty.getDescription(),
                difficulty.getDisplayOrder()
        );
    }

    private EnumOptionResponse toEnumOptionResponse(ExamStatus status) {
        return new EnumOptionResponse(
                status.getCode(),
                status.getLabel(),
                status.getLabelVi(),
                status.getDescription(),
                status.getDisplayOrder()
        );
    }
}


