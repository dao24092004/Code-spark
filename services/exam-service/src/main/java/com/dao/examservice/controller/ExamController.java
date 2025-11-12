package com.dao.examservice.controller;

import com.dao.examservice.dto.request.ExamConfigRequest;
import com.dao.examservice.dto.request.ExamCreationRequest;
import com.dao.examservice.dto.request.ExamScheduleRequest;
import com.dao.examservice.dto.request.ExamStatusUpdateRequest;
import com.dao.examservice.dto.request.ExamUpdateRequest;
import com.dao.examservice.dto.response.EnumOptionResponse;
import com.dao.examservice.dto.response.ExamResponse;
import com.dao.examservice.dto.response.GeneratedQuestionsResponse;
import com.dao.examservice.dto.response.QuestionResponse;
import com.dao.examservice.dto.request.QuestionSearchRequest;
import com.dao.examservice.entity.Exam;
import com.dao.examservice.entity.ExamRegistration;
import com.dao.examservice.service.ExamService;
import com.dao.examservice.service.QuestionService;
import com.dao.examservice.repository.ExamQuestionRepository;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/exams")
public class ExamController {

    private final ExamService examService;
    private final QuestionService questionService;
    private final ExamQuestionRepository examQuestionRepository;

    public ExamController(ExamService examService, QuestionService questionService, ExamQuestionRepository examQuestionRepository) {
        this.examService = examService;
        this.questionService = questionService;
        this.examQuestionRepository = examQuestionRepository;
    }

    // POST /exams: create exam
    @PostMapping
    public ResponseEntity<ExamResponse> create(@RequestBody ExamCreationRequest request) {
        Exam exam = examService.createExam(request);
        return ResponseEntity.ok(toResponse(exam));
    }

    // PUT /exams/{id}/config: update config
    @PutMapping("/{id}/config")
    public ResponseEntity<ExamResponse> config(@PathVariable UUID id, @RequestBody ExamConfigRequest request) {
        Exam exam = examService.updateConfig(id, request);
        return ResponseEntity.ok(toResponse(exam));
    }

    // PUT /exams/{id}: update exam basic info
    @PutMapping("/{id}")
    public ResponseEntity<ExamResponse> update(@PathVariable UUID id, @RequestBody ExamUpdateRequest request) {
        Exam exam = examService.updateExam(id, request);
        return ResponseEntity.ok(toResponse(exam));
    }

    // GET /exams/{id}: get exam
    @GetMapping("/{id}")
    public ResponseEntity<ExamResponse> get(@PathVariable UUID id) {
        Exam exam = examService.get(id);
        return ResponseEntity.ok(toResponse(exam));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        examService.delete(id);
        return ResponseEntity.ok().build();
    }

    // PUT /exams/{id}/status: update exam status (publish/unpublish)
    @PutMapping("/{id}/status")
    public ResponseEntity<ExamResponse> updateStatus(@PathVariable UUID id, @RequestBody ExamStatusUpdateRequest request) {
        Exam exam = examService.updateStatus(id, request.status);
        return ResponseEntity.ok(toResponse(exam));
    }

    // POST /exams/{id}/schedule: schedule & register
    @PostMapping("/{id}/schedule")
    public ResponseEntity<ExamResponse> schedule(@PathVariable UUID id, @RequestBody ExamScheduleRequest request) {
        Exam exam = examService.scheduleAndRegister(id, request);
        return ResponseEntity.ok(toResponse(exam));
    }

    // POST /exams/{id}/generate-questions: generate and SAVE random questions to exam
    @PostMapping("/{id}/generate-questions")
    public ResponseEntity<GeneratedQuestionsResponse> generate(@PathVariable UUID id, @RequestBody com.dao.examservice.dto.request.GenerateQuestionsRequest request) {
        // ✨ FIXED: Now saves questions to exam_questions table instead of just returning IDs
        List<UUID> questionIds = examService.generateAndSaveQuestions(id, request);
        
        GeneratedQuestionsResponse r = new GeneratedQuestionsResponse();
        r.questionIds = new ArrayList<>(questionIds);
        return ResponseEntity.ok(r);
    }

    // GET /exams/{id}/questions: get all questions for an exam
    @GetMapping("/{id}/questions")
    public ResponseEntity<List<QuestionResponse>> getExamQuestions(@PathVariable UUID id) {
        List<com.dao.examservice.entity.ExamQuestion> examQuestions = examService.getExamQuestions(id);
        
        // Map to QuestionResponse
        List<QuestionResponse> responses = examQuestions.stream()
                .map(eq -> toQuestionResponse(eq.getQuestion()))
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(responses);
    }

    // Helper method to convert Question entity to QuestionResponse
    private QuestionResponse toQuestionResponse(com.dao.examservice.entity.Question q) {
        QuestionResponse r = new QuestionResponse();
        r.id = q.getId();
        r.type = q.getType();
        r.content = q.getContent();
        r.difficulty = q.getDifficulty();
        r.explanation = q.getExplanation();
        r.score = q.getScore();
        r.text = q.getText();
        r.tags = q.getTags();
        r.createdAt = q.getCreatedAt();
        r.updatedAt = q.getUpdatedAt();
        return r;
    }

    // GET /exams/schedules: list exams in time window
    @GetMapping("/schedules")
    public ResponseEntity<List<ExamResponse>> schedules(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant end) {
        List<Exam> list = examService.getSchedules(start, end);
        return ResponseEntity.ok(list.stream().map(this::toResponse).collect(Collectors.toList()));
    }

    // GET /exams/subjects: get all unique subjects/tags from questions
    @GetMapping("/subjects")
    public ResponseEntity<List<String>> getAllSubjects() {
        List<String> subjects = questionService.getAllSubjects();
        return ResponseEntity.ok(subjects);
    }

    // ==================== Enum/Lookup Endpoints ====================

    // GET /exams/types: get all exam types (practice, quiz, midterm, etc.)
    @GetMapping("/types")
    public ResponseEntity<List<EnumOptionResponse>> getAllExamTypes() {
        List<EnumOptionResponse> types = examService.getAllExamTypes();
        return ResponseEntity.ok(types);
    }

    // GET /exams/difficulties: get all exam difficulties (easy, medium, hard)
    @GetMapping("/difficulties")
    public ResponseEntity<List<EnumOptionResponse>> getAllExamDifficulties() {
        List<EnumOptionResponse> difficulties = examService.getAllExamDifficulties();
        return ResponseEntity.ok(difficulties);
    }

    // GET /exams/statuses: get all exam statuses (draft, published, etc.)
    @GetMapping("/statuses")
    public ResponseEntity<List<EnumOptionResponse>> getAllExamStatuses() {
        List<EnumOptionResponse> statuses = examService.getAllExamStatuses();
        return ResponseEntity.ok(statuses);
    }

    private ExamResponse toResponse(Exam e) {
        ExamResponse r = new ExamResponse();
        r.id = e.getId();
        r.courseId = e.getCourseId();
        r.title = e.getTitle();
        r.description = e.getDescription();
        r.startAt = e.getStartAt();
        r.endAt = e.getEndAt();
        r.durationMinutes = e.getDurationMinutes();
        r.passScore = e.getPassScore();
        r.maxAttempts = e.getMaxAttempts();
        r.totalQuestions = e.getTotalQuestions();
        r.createdBy = e.getCreatedBy();
        r.status = e.getStatus().name();
        r.createdAt = e.getCreatedAt();
        r.tags = e.getTags();
        long count = examQuestionRepository.countByExamId(e.getId());
        r.assignedQuestionCount = Math.toIntExact(count);
        return r;
    }
}
