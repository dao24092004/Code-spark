package com.dao.examservice.dto.request;

import java.util.Set;

public class GenerateQuestionsRequest {
    public int count;
    public Set<String> tags;
    public Integer minDifficulty;
    public Integer maxDifficulty;
}
