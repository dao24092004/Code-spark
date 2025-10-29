package com.dao.examservice.dto.request;

import com.dao.examservice.entity.Question;
import java.util.Set;

public class QuestionCreationRequest {
    public Question.QuestionType type;
    public String content; // JSON string
    public Integer difficulty;
    public String explanation;
    public Integer score;
    public String text;
    public Set<String> tags;
}


