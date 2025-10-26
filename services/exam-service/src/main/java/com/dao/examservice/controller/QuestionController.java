package com.dao.examservice.controller;

import com.dao.examservice.dto.request.QuestionCreationRequest;
import com.dao.examservice.dto.request.QuestionSearchRequest;
import com.dao.examservice.dto.response.GeneratedQuestionsResponse;
import com.dao.examservice.dto.response.QuestionResponse;
import com.dao.examservice.entity.Question;
import com.dao.examservice.service.QuestionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.Set;
@RestController
@RequestMapping("/questions")
public class QuestionController {

    private final QuestionService questionService;

    public QuestionController(QuestionService questionService) {
        this.questionService = questionService;
    }

    // POST /questions: create
    @PostMapping
    public ResponseEntity<QuestionResponse> create(@RequestBody QuestionCreationRequest request) {
        Question q = questionService.create(request);
        return ResponseEntity.ok(toResponse(q));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        questionService.delete(id);
        return ResponseEntity.ok().build();
    }

    // GET /questions: search by tags, difficulty
    @GetMapping
    public ResponseEntity<List<QuestionResponse>> search(@RequestParam(required = false) List<String> tags, @RequestParam(required = false) Integer minDifficulty, @RequestParam(required = false) Integer maxDifficulty) {
        QuestionSearchRequest req = new QuestionSearchRequest();
        if (tags != null) req.tags = Set.copyOf(tags);
        req.minDifficulty = minDifficulty;
        req.maxDifficulty = maxDifficulty;
        List<Question> results = questionService.search(req);
        return ResponseEntity.ok(results.stream().map(this::toResponse).collect(Collectors.toList()));
    }

    // POST /exams/{id}/generate-questions is placed under /exams controller per spec
    // To support quick testing here, we expose a helper endpoint to generate by filter
    @PostMapping("/generate")
    public ResponseEntity<GeneratedQuestionsResponse> generate(@RequestParam(defaultValue = "10") int count, @RequestBody(required = false) QuestionSearchRequest filter) {
        if (filter == null) filter = new QuestionSearchRequest();
        com.dao.examservice.dto.request.GenerateQuestionsRequest serviceRequest = new com.dao.examservice.dto.request.GenerateQuestionsRequest();
        serviceRequest.count = count;
        serviceRequest.tags = filter.tags;
        serviceRequest.minDifficulty = filter.minDifficulty;
        serviceRequest.maxDifficulty = filter.maxDifficulty;
        List<UUID> ids = questionService.generateRandomIds(serviceRequest);
        GeneratedQuestionsResponse r = new GeneratedQuestionsResponse();
        r.questionIds = new ArrayList<>(ids);
        return ResponseEntity.ok(r);
    }

    private QuestionResponse toResponse(Question q) {
        QuestionResponse r = new QuestionResponse();
        r.id = q.getId();
        r.type = q.getType();
        r.content = q.getContent();
        r.difficulty = q.getDifficulty();
        r.explanation = q.getExplanation();
        r.score = q.getScore();
        r.text = q.getText();
        r.tags = q.getTags();
        r.createdAt = q.getCreatedAt();
        r.updatedAt = q.getUpdatedAt();
        return r;
    }
}
