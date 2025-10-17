package com.dao.examservice.service;

import com.dao.examservice.dto.Request.QuestionCreationRequest;
import com.dao.examservice.dto.Response.QuestionResponse;
import com.dao.examservice.entity.Exam;
import com.dao.examservice.entity.Question;
import com.dao.examservice.repository.ExamRepository;
import com.dao.examservice.repository.QuestionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.stream.Collectors;

@Service
public class QuestionService {

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private ExamRepository examRepository;

    // Tạo câu hỏi
    public Question createQuestion(QuestionCreationRequest request) {
        Question question = Question.builder()
                .text(request.getText())
                .score(request.getScore())
                .build();
        
        if (request.getExamId() != null) {
            Optional<Exam> examOpt = examRepository.findById(request.getExamId());
            examOpt.ifPresent(question::setExam);
        }
        
        return questionRepository.save(question);
    }

    // Xem câu hỏi
    public Optional<Question> getQuestion(Long id) {
        return questionRepository.findById(id);
    }

    // Lấy danh sách câu hỏi với filter (tags, difficulty)
    public List<Question> getQuestions(Long examId, Integer difficulty, String type, List<String> tags) {
        if (examId != null) {
            return questionRepository.findByExamId(examId);
        }
        if (difficulty != null) {
            return questionRepository.findByDifficulty(difficulty);
        }
        if (type != null) {
            return questionRepository.findByType(type);
        }
        return questionRepository.findAll();
    }

    // Cập nhật câu hỏi
    public Optional<Question> updateQuestion(Long id, QuestionCreationRequest request) {
        Optional<Question> questionOpt = questionRepository.findById(id);
        questionOpt.ifPresent(question -> {
            question.setText(request.getText());
            question.setScore(request.getScore());
            questionRepository.save(question);
        });
        return questionOpt;
    }

    // Xóa câu hỏi
    public boolean deleteQuestion(Long id) {
        if (questionRepository.existsById(id)) {
            questionRepository.deleteById(id);
            return true;
        }
        return false;
    }

    // Sinh câu hỏi ngẫu nhiên
    public List<Long> generateRandomQuestions(Long examId, int count, Integer difficulty) {
        List<Question> availableQuestions;
        
        if (difficulty != null) {
            availableQuestions = questionRepository.findByDifficulty(difficulty);
        } else {
            availableQuestions = questionRepository.findAll();
        }
        
        if (availableQuestions.size() <= count) {
            return availableQuestions.stream()
                    .map(Question::getId)
                    .collect(Collectors.toList());
        }
        
        Random random = new Random();
        return random.ints(0, availableQuestions.size())
                .distinct()
                .limit(count)
                .mapToObj(availableQuestions::get)
                .map(Question::getId)
                .collect(Collectors.toList());
    }

    // Convert Question to Response
    public QuestionResponse toResponse(Question question) {
        return QuestionResponse.builder()
                .id(question.getId())
                .text(question.getText())
                .score(question.getScore())
                .examId(question.getExam() != null ? question.getExam().getId() : null)
                .build();
    }
}
