package com.dao.examservice.controller;

import com.dao.examservice.dto.Request.ExamCreationRequest;
import com.dao.examservice.dto.Request.ExamScheduleRequest;
import com.dao.examservice.dto.Response.ExamCreationResponse;
import com.dao.examservice.dto.Response.ExamResponse;
import com.dao.examservice.entity.Exam;
import com.dao.examservice.entity.ExamRegistration;
import com.dao.examservice.mapper.ExamMapper;
import com.dao.examservice.service.ExamService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/exams")
public class ExamController {

	@Autowired
	private ExamService examService;

	@Autowired
	private ExamMapper examMapper;

	// POST /exams: Tạo kỳ thi
	@PostMapping
	public ResponseEntity<ExamCreationResponse> createExam(@RequestBody ExamCreationRequest request) {
		Exam exam = examService.createExam(request);
		ExamCreationResponse response = examMapper.toCreationResponse(exam);
		return ResponseEntity.ok(response);
	}

	// PUT /exams/{id}/config: Cấu hình kỳ thi (thời gian, passScore, maxAttempts)
	@PutMapping("/{id}/config")
	public ResponseEntity<ExamResponse> updateExamConfig(@PathVariable Long id, @RequestBody ExamCreationRequest request) {
		Optional<Exam> examOpt = examService.updateExamConfig(id, request);
		return examOpt.map(exam -> {
			ExamResponse response = examMapper.toResponse(exam);
			return ResponseEntity.ok(response);
		}).orElseGet(() -> ResponseEntity.notFound().build());
	}

	// GET /exams/{id}: Xem kỳ thi
	@GetMapping("/{id}")
	public ResponseEntity<ExamResponse> getExam(@PathVariable Long id) {
		Optional<Exam> examOpt = examService.getExam(id);
		return examOpt.map(exam -> {
			ExamResponse response = examMapper.toResponse(exam);
			return ResponseEntity.ok(response);
		}).orElseGet(() -> ResponseEntity.notFound().build());
	}

	// GET /exams/schedules: Lấy lịch thi
	@GetMapping("/schedules")
	public ResponseEntity<List<ExamResponse>> getExamSchedules(
			@RequestParam LocalDateTime startAt, 
			@RequestParam LocalDateTime endAt) {
		List<Exam> exams = examService.getExamSchedules(startAt, endAt);
		List<ExamResponse> responses = exams.stream()
				.map(examMapper::toResponse)
				.toList();
		return ResponseEntity.ok(responses);
	}

	// POST /exams/{id}/generate-questions: Sinh đề ngẫu nhiên (shuffle)
	@PostMapping("/{id}/generate-questions")
	public ResponseEntity<List<Long>> generateRandomQuestions(
			@PathVariable Long id, 
			@RequestParam int count,
			@RequestParam(required = false) Integer difficulty) {
		List<Long> questionIds = examService.generateRandomQuestions(id, count, difficulty);
		return ResponseEntity.ok(questionIds);
	}

	// POST /exams/{id}/schedule: Lập lịch thi & đăng ký
	@PostMapping("/{id}/schedule")
	public ResponseEntity<ExamRegistration> scheduleExam(
			@PathVariable Long id, 
			@RequestBody ExamScheduleRequest request) {
		Optional<ExamRegistration> registration = examService.scheduleExam(id, request);
		return registration.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
	}
}
