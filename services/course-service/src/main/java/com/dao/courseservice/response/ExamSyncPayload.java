package com.dao.courseservice.response;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data
@Builder
public class ExamSyncPayload {
    private UUID id;
    private UUID courseId;
    private String title;
    private String description;
    private Integer timeLimitMinutes;
    private UUID createdBy;
    private String status;
}