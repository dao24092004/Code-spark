package com.dao.examservice.controller;

import com.dao.common.dto.ApiResponse;
import com.dao.examservice.dto.request.ExamConfigRequest;
import com.dao.examservice.dto.request.ExamCreationRequest;
import com.dao.examservice.dto.request.ExamScheduleRequest;
import com.dao.examservice.dto.request.ExamStatusUpdateRequest;
import com.dao.examservice.dto.request.ExamUpdateRequest;
import com.dao.examservice.dto.response.EnumOptionResponse;
import com.dao.examservice.dto.response.ExamResponse;
import com.dao.examservice.dto.response.GeneratedQuestionsResponse;
import com.dao.examservice.dto.response.QuestionResponse;
import com.dao.examservice.entity.Exam;
import com.dao.examservice.service.ExamService;
import com.dao.examservice.service.QuestionService;
import com.dao.examservice.repository.ExamQuestionRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;


@RestController
@RequestMapping("/api/v1/exams")
@RequiredArgsConstructor
@Slf4j
public class ExamController {

    private final ExamService examService;
    private final QuestionService questionService;
    private final ExamQuestionRepository examQuestionRepository;

    @PostMapping
    public ResponseEntity<ApiResponse<ExamResponse>> create(@Valid @RequestBody ExamCreationRequest request) {
        log.info("Creating exam: {}", request.title);
        Exam exam = examService.createExam(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Exam created successfully", toResponse(exam)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ExamResponse>>> getAllExams(Pageable pageable) {
        // pageable lúc này đã chứa page=0, size=10... từ URL
        Page<Exam> examPage = examService.searchExams(null, null, pageable); 
        return ResponseEntity.ok(ApiResponse.success(examPage.map(this::toResponse)));
    }
    
    @PutMapping("/{id}/config")
    public ResponseEntity<ApiResponse<ExamResponse>> config(@PathVariable UUID id, @Valid @RequestBody ExamConfigRequest request) {
        log.info("Updating exam config: {}", id);
        Exam exam = examService.updateConfig(id, request);
        return ResponseEntity.ok(ApiResponse.success("Exam config updated successfully", toResponse(exam)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ExamResponse>> update(@PathVariable UUID id, @Valid @RequestBody ExamUpdateRequest request) {
        log.info("Updating exam: {}", id);
        Exam exam = examService.updateExam(id, request);
        return ResponseEntity.ok(ApiResponse.success("Exam updated successfully", toResponse(exam)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ExamResponse>> get(@PathVariable UUID id) {
        Exam exam = examService.get(id);
        return ResponseEntity.ok(ApiResponse.success(toResponse(exam)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        log.info("Soft deleting exam: {}", id);
        examService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Exam deleted successfully"));
    }

    @DeleteMapping("/{id}/hard")
    public ResponseEntity<ApiResponse<Void>> hardDelete(@PathVariable UUID id) {
        log.warn("Hard deleting exam: {}", id);
        examService.hardDelete(id);
        return ResponseEntity.ok(ApiResponse.success("Exam hard deleted successfully"));
    }

    @PostMapping("/{id}/restore")
    public ResponseEntity<ApiResponse<ExamResponse>> restore(@PathVariable UUID id) {
        log.info("Restoring exam: {}", id);
        Exam exam = examService.restore(id);
        return ResponseEntity.ok(ApiResponse.success("Exam restored successfully", toResponse(exam)));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<ExamResponse>> updateStatus(@PathVariable UUID id, @RequestBody ExamStatusUpdateRequest request) {
        log.info("Updating exam status: {} to {}", id, request.status);
        Exam exam = examService.updateStatus(id, request.status);
        return ResponseEntity.ok(ApiResponse.success("Exam status updated successfully", toResponse(exam)));
    }

    @PostMapping("/{id}/schedule")
    public ResponseEntity<ApiResponse<ExamResponse>> schedule(@PathVariable UUID id, @RequestBody ExamScheduleRequest request) {
        log.info("Scheduling exam: {}", id);
        Exam exam = examService.scheduleAndRegister(id, request);
        return ResponseEntity.ok(ApiResponse.success("Exam scheduled successfully", toResponse(exam)));
    }

    @PostMapping("/{id}/generate-questions")
    public ResponseEntity<ApiResponse<GeneratedQuestionsResponse>> generate(@PathVariable UUID id, @RequestBody com.dao.examservice.dto.request.GenerateQuestionsRequest request) {
        log.info("Generating questions for exam: {}", id);
        List<UUID> questionIds = examService.generateAndSaveQuestions(id, request);

        GeneratedQuestionsResponse r = new GeneratedQuestionsResponse();
        r.questionIds = new ArrayList<>(questionIds);
        return ResponseEntity.ok(ApiResponse.success("Questions generated successfully", r));
    }

    @GetMapping("/{id}/questions")
    public ResponseEntity<ApiResponse<List<QuestionResponse>>> getExamQuestions(@PathVariable UUID id) {
        List<com.dao.examservice.entity.ExamQuestion> examQuestions = examService.getExamQuestions(id);

        List<QuestionResponse> responses = examQuestions.stream()
                .map(eq -> toQuestionResponse(eq.getQuestion()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/schedules")
    public ResponseEntity<ApiResponse<List<ExamResponse>>> schedules(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant end) {
        List<Exam> list = examService.getSchedules(start, end);
        return ResponseEntity.ok(ApiResponse.success(list.stream().map(this::toResponse).collect(Collectors.toList())));
    }

    @GetMapping("/schedules/paged")
    public ResponseEntity<ApiResponse<Page<ExamResponse>>> schedulesPaged(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant end,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "startAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Exam> examPage = examService.getSchedules(start, end, pageable);
        Page<ExamResponse> responsePage = examPage.map(this::toResponse);

        return ResponseEntity.ok(ApiResponse.success(responsePage));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<ExamResponse>>> search(
            @RequestParam(required = false) Exam.ExamStatus status,
            @RequestParam(required = false) String title,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Exam> examPage = examService.searchExams(status, title, pageable);
        Page<ExamResponse> responsePage = examPage.map(this::toResponse);

        return ResponseEntity.ok(ApiResponse.success(responsePage));
    }

    @GetMapping("/subjects")
    public ResponseEntity<ApiResponse<List<String>>> getAllSubjects() {
        List<String> subjects = questionService.getAllSubjects();
        return ResponseEntity.ok(ApiResponse.success(subjects));
    }

    // ==================== Enum/Lookup Endpoints ====================

    @GetMapping("/types")
    public ResponseEntity<ApiResponse<List<EnumOptionResponse>>> getAllExamTypes() {
        List<EnumOptionResponse> types = examService.getAllExamTypes();
        return ResponseEntity.ok(ApiResponse.success(types));
    }

    @GetMapping("/difficulties")
    public ResponseEntity<ApiResponse<List<EnumOptionResponse>>> getAllExamDifficulties() {
        List<EnumOptionResponse> difficulties = examService.getAllExamDifficulties();
        return ResponseEntity.ok(ApiResponse.success(difficulties));
    }

    @GetMapping("/statuses")
    public ResponseEntity<ApiResponse<List<EnumOptionResponse>>> getAllExamStatuses() {
        List<EnumOptionResponse> statuses = examService.getAllExamStatuses();
        return ResponseEntity.ok(ApiResponse.success(statuses));
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
        r.updatedAt = e.getUpdatedAt();
        // orgId, examType, difficulty removed per ERD schema
        // Use optimized count query instead of N+1
        r.assignedQuestionCount = Math.toIntExact(examQuestionRepository.countByExamId(e.getId()));
        return r;
    }

    private QuestionResponse toQuestionResponse(com.dao.examservice.entity.Question q) {
        QuestionResponse r = new QuestionResponse();
        r.id = q.getId();
        r.type = q.getType();
        r.content = q.getContent();
        r.difficulty = q.getDifficulty();
        r.explanation = q.getExplanation();
        r.score = q.getScore();
        r.text = q.getText();
        r.createdAt = q.getCreatedAt();
        r.updatedAt = q.getUpdatedAt();
        return r;
    }
}
