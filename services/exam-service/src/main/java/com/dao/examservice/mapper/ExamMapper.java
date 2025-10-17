package com.dao.examservice.mapper;

import com.dao.examservice.entity.Exam;
import com.dao.examservice.dto.Request.ExamCreationRequest;
import com.dao.examservice.dto.Response.ExamCreationResponse;
import com.dao.examservice.dto.Response.ExamResponse;
import org.springframework.stereotype.Component;

@Component
public class ExamMapper {
	public Exam toEntity(ExamCreationRequest request) {
		return Exam.builder()
				.title(request.getTitle())
				.description(request.getDescription())
				.durationMinutes(request.getDurationMinutes())
				.passingScore(request.getPassingScore())
				.startTime(request.getStartTime())
				.endTime(request.getEndTime())
				.maxAttempts(request.getMaxAttempts())
				.isActive(true)
				.build();
	}

	public ExamCreationResponse toCreationResponse(Exam exam) {
		return ExamCreationResponse.builder()
				.id(exam.getId())
				.title(exam.getTitle())
				.status("CREATED")
				.message("Exam created successfully")
				.createdAt(exam.getCreatedAt())
				.build();
	}

	public ExamResponse toResponse(Exam exam) {
		return ExamResponse.builder()
				.id(exam.getId())
				.title(exam.getTitle())
				.description(exam.getDescription())
				.durationMinutes(exam.getDurationMinutes())
				.passingScore(exam.getPassingScore())
				.totalScore(exam.getTotalScore())
				.isActive(exam.getIsActive())
				.startTime(exam.getStartTime())
				.endTime(exam.getEndTime())
				.maxAttempts(exam.getMaxAttempts())
				.requiredTags(exam.getRequiredTags())
				.difficultyLevel(exam.getDifficultyLevel() != null ? exam.getDifficultyLevel().name() : null)
				.createdBy(exam.getCreatedBy())
				.createdAt(exam.getCreatedAt())
				.updatedAt(exam.getUpdatedAt())
				.questionCount(exam.getQuestions() != null ? exam.getQuestions().size() : 0)
				.registrationCount(exam.getSubmissions() != null ? exam.getSubmissions().size() : 0)
				.build();
	}
}
