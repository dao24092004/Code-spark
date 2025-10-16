package com.dao.examservice.service;

import com.dao.examservice.entity.Exam;
import com.dao.examservice.dto.Resquest.ExamCreationRequest;
import com.dao.examservice.repository.ExamRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ExamService {

	@Autowired
	private ExamRepository examRepository;

	// Tạo kỳ thi
	public Exam createExam(ExamCreationRequest request) {
		Exam exam = Exam.builder()
				.title(request.getTitle())
				.description(request.getDescription())
				.durationMinutes(request.getDurationMinutes())
				.passingScore(request.getPassingScore())
				.startTime(request.getStartTime())
				.endTime(request.getEndTime())
				.maxAttempts(request.getMaxAttempts())
				.isActive(true)
				.build();
		return examRepository.save(exam);
	}

	// Cấu hình kỳ thi (cập nhật)
	public Optional<Exam> updateExamConfig(Long id, ExamCreationRequest request) {
		Optional<Exam> examOpt = examRepository.findById(id);
		examOpt.ifPresent(exam -> {
			exam.setDurationMinutes(request.getDurationMinutes());
			exam.setPassingScore(request.getPassingScore());
			exam.setMaxAttempts(request.getMaxAttempts());
			exam.setStartTime(request.getStartTime());
			exam.setEndTime(request.getEndTime());
			examRepository.save(exam);
		});
		return examOpt;
	}

	// Xem kỳ thi
	public Optional<Exam> getExam(Long id) {
		return examRepository.findById(id);
	}

	// Lấy lịch thi
	public List<Exam> getExamSchedules(LocalDateTime startAt, LocalDateTime endAt) {
		return examRepository.findExamSchedules(startAt, endAt);
	}

	// Sinh đề ngẫu nhiên
	public List<Long> generateRandomQuestions(Long examId, int count) {
		// TODO: Gọi QuestionService để lấy danh sách câu hỏi ngẫu nhiên
		return List.of();
	}
}
