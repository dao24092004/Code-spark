package com.dao.courseservice.response;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data
@Builder
public class QuizSummaryResponse {
    private UUID id;
    private String title;
}