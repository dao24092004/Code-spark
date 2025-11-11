package com.dao.examservice.dto.response;

import java.util.List;

/**
 * Response for question import operation
 */
public class QuestionImportResponse {
    public int imported;
    public int skipped;
    public int errors;
    public List<String> errorDetails;
    public String subject;
    public List<String> tags;
}

