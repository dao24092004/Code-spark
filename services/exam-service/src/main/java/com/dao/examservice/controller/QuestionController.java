package com.dao.examservice.controller;

import com.dao.examservice.dto.Request.QuestionCreationRequest;
import com.dao.examservice.dto.Response.QuestionResponse;
import com.dao.examservice.entity.Question;
import com.dao.examservice.service.QuestionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/questions")
public class QuestionController {

    @Autowired
    private QuestionService questionService;

    // POST /questions: Tạo câu hỏi
    @PostMapping
    public ResponseEntity<QuestionResponse> createQuestion(@RequestBody QuestionCreationRequest request) {
        Question question = questionService.createQuestion(request);
        QuestionResponse response = questionService.toResponse(question);
        return ResponseEntity.ok(response);
    }

    // GET /questions/{id}: Xem câu hỏi
    @GetMapping("/{id}")
    public ResponseEntity<Question> getQuestion(@PathVariable Long id) {
        Optional<Question> questionOpt = questionService.getQuestion(id);
        return questionOpt.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    // GET /questions: Tìm kiếm câu hỏi (tags, difficulty)
    @GetMapping
    public ResponseEntity<List<QuestionResponse>> getAllQuestions(
            @RequestParam(required = false) Long examId,
            @RequestParam(required = false) Integer difficulty,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) List<String> tags) {
        List<Question> questions = questionService.getQuestions(examId, difficulty, type, tags);
        List<QuestionResponse> responses = questions.stream()
                .map(questionService::toResponse)
                .toList();
        return ResponseEntity.ok(responses);
    }

    // PUT /questions/{id}: Cập nhật câu hỏi
    @PutMapping("/{id}")
    public ResponseEntity<Question> updateQuestion(@PathVariable Long id, @RequestBody QuestionCreationRequest request) {
        Optional<Question> questionOpt = questionService.updateQuestion(id, request);
        return questionOpt.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    // DELETE /questions/{id}: Xóa câu hỏi
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable Long id) {
        boolean deleted = questionService.deleteQuestion(id);
        return deleted ? ResponseEntity.ok().build() : ResponseEntity.notFound().build();
    }

    // POST /questions/generate: Sinh câu hỏi ngẫu nhiên
    @PostMapping("/generate")
    public ResponseEntity<List<Long>> generateRandomQuestions(
            @RequestParam Long examId,
            @RequestParam int count,
            @RequestParam(required = false) Integer difficulty) {
        List<Long> questionIds = questionService.generateRandomQuestions(examId, count, difficulty);
        return ResponseEntity.ok(questionIds);
    }
}
