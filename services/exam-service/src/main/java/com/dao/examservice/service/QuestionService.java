package com.dao.examservice.service;

import com.dao.examservice.dto.request.QuestionCreationRequest;
import com.dao.examservice.dto.request.QuestionSearchRequest;
import com.dao.examservice.entity.Question;
import com.dao.examservice.repository.QuestionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class QuestionService {

    private final QuestionRepository questionRepository;

    public QuestionService(QuestionRepository questionRepository) {
        this.questionRepository = questionRepository;
    }

    @Transactional
    public Question create(QuestionCreationRequest request) {
        Question q = new Question();
        q.setType(request.type);
        q.setContent(request.content);
        q.setDifficulty(request.difficulty);
        q.setExplanation(request.explanation);
        q.setScore(request.score);
        q.setText(request.text);
        if (request.tags != null) q.setTags(request.tags);
        return questionRepository.save(q);
    }

    @Transactional(readOnly = true)
    public List<Question> search(QuestionSearchRequest request) {
        List<String> tags = request.tags == null ? Collections.emptyList() : new ArrayList<>(request.tags);
        return questionRepository.search(tags, tags.isEmpty(), request.minDifficulty, request.maxDifficulty);
    }

    @Transactional(readOnly = true)
    public List<UUID> generateRandomIds(com.dao.examservice.dto.request.GenerateQuestionsRequest request) {
        QuestionSearchRequest filter = new QuestionSearchRequest();
        filter.tags = request.tags;
        filter.minDifficulty = request.minDifficulty;
        filter.maxDifficulty = request.maxDifficulty;

        List<Question> pool = search(filter);

        if (pool == null || pool.isEmpty() || request.count <= 0) {
            return Collections.emptyList();
        }

        Collections.shuffle(pool);
        return pool.stream().limit(request.count).map(Question::getId).collect(Collectors.toList());
    }

    @Transactional
    public void delete(UUID id) {
        questionRepository.deleteById(id);
    }
}


