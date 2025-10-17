package com.dao.examservice.mapper;

import com.dao.examservice.dto.Request.QuestionCreationRequest;
import com.dao.examservice.dto.Response.QuestionResponse;
import com.dao.examservice.entity.Question;
import org.springframework.stereotype.Component;

@Component
public class QuestionMapper {

    public Question toEntity(QuestionCreationRequest request) {
        return Question.builder()
                .text(request.getText())
                .score(request.getScore())
                .build();
    }

    public QuestionResponse toResponse(Question question) {
        return QuestionResponse.builder()
                .id(question.getId())
                .text(question.getText())
                .score(question.getScore())
                .examId(question.getExam() != null ? question.getExam().getId() : null)
                .build();
    }
}
