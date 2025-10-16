package com.dao.examservice.controller;

import com.dao.examservice.dto.Resquest.ExamCreationRequest;
import com.dao.examservice.dto.Response.ExamCreationResponse;
import com.dao.examservice.entity.Exam;
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

	// PUT /exams/{id}/config: Cấu hình kỳ thi
	@PutMapping("/{id}/config")
	public ResponseEntity<Exam> updateExamConfig(@PathVariable Long id, @RequestBody ExamCreationRequest request) {
		Optional<Exam> examOpt = examService.updateExamConfig(id, request);
		return examOpt.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
	}

	// GET /exams/{id}: Xem kỳ thi
	@GetMapping("/{id}")
	public ResponseEntity<Exam> getExam(@PathVariable Long id) {
		Optional<Exam> examOpt = examService.getExam(id);
		return examOpt.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
	}

	// GET /exams/schedules: Lấy lịch thi
	@GetMapping("/schedules")
	public ResponseEntity<List<Exam>> getExamSchedules(@RequestParam LocalDateTime startAt, @RequestParam LocalDateTime endAt) {
		List<Exam> exams = examService.getExamSchedules(startAt, endAt);
		return ResponseEntity.ok(exams);
	}

	// POST /exams/{id}/generate-questions: Sinh đề ngẫu nhiên
	@PostMapping("/{id}/generate-questions")
	public ResponseEntity<List<Long>> generateRandomQuestions(@PathVariable Long id, @RequestParam int count) {
		List<Long> questionIds = examService.generateRandomQuestions(id, count);
		return ResponseEntity.ok(questionIds);
	}
}
