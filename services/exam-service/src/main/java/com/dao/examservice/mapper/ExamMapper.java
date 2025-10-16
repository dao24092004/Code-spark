package com.dao.examservice.mapper;

import com.dao.examservice.entity.Exam;
import com.dao.examservice.dto.Resquest.ExamCreationRequest;
import com.dao.examservice.dto.Response.ExamCreationResponse;
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
}
