package com.dao.examservice.dto.Request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamScheduleRequest {
    private Long studentId;
    private LocalDateTime examStartTime;
    private LocalDateTime examEndTime;
    private Integer maxAttempts;
}
