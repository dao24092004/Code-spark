package com.dao.examservice.dto.response;

import com.dao.examservice.entity.Question;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public class QuestionResponse {
    public UUID id;
    public Question.QuestionType type;
    public String content;
    public Integer difficulty;
    public String explanation;
    public Integer score;
    public String text;
    public Set<String> tags;
    public Instant createdAt;
    public Instant updatedAt;
}