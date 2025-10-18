package com.dao.examservice.controller;

import com.dao.examservice.dto.request.ExamConfigRequest;
import com.dao.examservice.dto.request.ExamCreationRequest;
import com.dao.examservice.dto.request.ExamScheduleRequest;
import com.dao.examservice.dto.response.ExamResponse;
import com.dao.examservice.dto.response.GeneratedQuestionsResponse;
import com.dao.examservice.dto.request.QuestionSearchRequest;
import com.dao.examservice.entity.Exam;
import com.dao.examservice.entity.ExamRegistration;
import com.dao.examservice.service.ExamService;
import com.dao.examservice.service.QuestionService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/exams")
public class ExamController {

    private final ExamService examService;
    private final QuestionService questionService;

    public ExamController(ExamService examService, QuestionService questionService) {
        this.examService = examService;
        this.questionService = questionService;
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

    // POST /exams/{id}/schedule: schedule & register
    @PostMapping("/{id}/schedule")
    public ResponseEntity<ExamResponse> schedule(@PathVariable UUID id, @RequestBody ExamScheduleRequest request) {
        ExamRegistration reg = examService.scheduleAndRegister(id, request);
        return ResponseEntity.ok(toResponse(reg.getExam()));
    }

    // POST /exams/{id}/generate-questions: generate random question IDs (simple shuffle)
    @PostMapping("/{id}/generate-questions")
    public ResponseEntity<GeneratedQuestionsResponse> generate(@PathVariable UUID id, @RequestParam(defaultValue = "10") int count) {
        // For now, ignore exam id and return random IDs from filtered pool (can enhance to use requiredTags)
        QuestionSearchRequest filter = new QuestionSearchRequest();
        GeneratedQuestionsResponse r = new GeneratedQuestionsResponse();
        r.questionIds = questionService.generateRandomIds(count, filter);
        return ResponseEntity.ok(r);
    }

    // GET /exams/schedules: list exams in time window
    @GetMapping("/schedules")
    public ResponseEntity<List<ExamResponse>> schedules(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant end) {
        List<Exam> list = examService.getSchedules(start, end);
        return ResponseEntity.ok(list.stream().map(this::toResponse).collect(Collectors.toList()));
    }

    private ExamResponse toResponse(Exam e) {
        ExamResponse r = new ExamResponse();
        r.id = e.getId();
        r.orgId = e.getOrgId();
        r.title = e.getTitle();
        r.description = e.getDescription();
        r.startAt = e.getStartAt();
        r.endAt = e.getEndAt();
        r.durationMinutes = e.getDurationMinutes();
        r.passScore = e.getPassScore();
        r.maxAttempts = e.getMaxAttempts();
        r.createdBy = e.getCreatedBy();
        r.status = e.getStatus().name();
        r.createdAt = e.getCreatedAt();
        return r;
    }
}
