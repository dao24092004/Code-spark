package com.dao.examservice.service;

import com.dao.examservice.dto.Request.ExamCreationRequest;
import com.dao.examservice.dto.Request.ExamScheduleRequest;
import com.dao.examservice.entity.Exam;
import com.dao.examservice.entity.ExamRegistration;
import com.dao.examservice.entity.Question;
import com.dao.examservice.repository.ExamRegistrationRepository;
import com.dao.examservice.repository.ExamRepository;
import com.dao.examservice.repository.QuestionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Random;

@Service
public class ExamService {

	@Autowired
	private ExamRepository examRepository;

	@Autowired
	private QuestionRepository questionRepository;

	@Autowired
	private ExamRegistrationRepository examRegistrationRepository;

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

	// Sinh đề ngẫu nhiên (shuffle)
	@Transactional
	public List<Long> generateRandomQuestions(Long examId, int count, Integer difficulty) {
		Optional<Exam> examOpt = examRepository.findById(examId);
		if (examOpt.isEmpty()) {
			return Collections.emptyList();
		}

		List<Question> availableQuestions;
		if (difficulty != null) {
			availableQuestions = questionRepository.findByDifficulty(difficulty);
		} else {
			availableQuestions = questionRepository.findAll();
		}

		if (availableQuestions.size() <= count) {
			return availableQuestions.stream()
					.map(Question::getId)
					.toList();
		}

		// Shuffle và chọn ngẫu nhiên
		Collections.shuffle(availableQuestions);
		return availableQuestions.stream()
				.limit(count)
				.map(Question::getId)
				.toList();
	}

	// Lập lịch thi & đăng ký
	@Transactional
	public Optional<ExamRegistration> scheduleExam(Long examId, ExamScheduleRequest request) {
		Optional<Exam> examOpt = examRepository.findById(examId);
		if (examOpt.isEmpty()) {
			return Optional.empty();
		}

		Exam exam = examOpt.get();
		ExamRegistration registration = ExamRegistration.builder()
				.studentId(request.getStudentId())
				.exam(exam)
				.examStartTime(request.getExamStartTime())
				.examEndTime(request.getExamEndTime())
				.maxAttempts(request.getMaxAttempts())
				.build();

		return Optional.of(examRegistrationRepository.save(registration));
	}
}
