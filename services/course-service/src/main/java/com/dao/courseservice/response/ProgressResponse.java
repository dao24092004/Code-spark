package com.dao.courseservice.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProgressResponse {
    private UUID id;
    private UUID studentId;
    private UUID courseId;
    private Integer percentComplete;
    private UUID lastMaterialId;
    private boolean passedFinalExam;
    private boolean courseCompleted;
    private LocalDateTime updatedAt;
}
