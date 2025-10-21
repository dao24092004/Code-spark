package com.dao.examservice.dto.request;

import java.util.Set;

public class QuestionSearchRequest {
    public Set<String> tags;
    public Integer minDifficulty;
    public Integer maxDifficulty;
}


