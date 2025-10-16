package com.dao.examservice.dto.Resquest;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamCreationRequest {
	private String title;
	private String description;
	private Integer durationMinutes;
	private Integer passingScore;
	private LocalDateTime startTime;
	private LocalDateTime endTime;
	private Integer maxAttempts;
}
