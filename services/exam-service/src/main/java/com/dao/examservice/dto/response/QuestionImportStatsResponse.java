package com.dao.examservice.dto.response;

import java.util.Map;

/**
 * Response for question import statistics
 */
public class QuestionImportStatsResponse {
    public long totalQuestions;
    public int totalTags;
    public Map<String, Long> questionsByTag;
}

