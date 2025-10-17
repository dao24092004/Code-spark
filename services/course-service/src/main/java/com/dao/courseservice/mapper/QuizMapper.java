package com.dao.courseservice.mapper;

import com.dao.courseservice.entity.Question;
import com.dao.courseservice.entity.QuestionOption;
import com.dao.courseservice.entity.Quiz;
import com.dao.courseservice.entity.QuizSubmission;
import com.dao.courseservice.response.QuestionOptionResponse;
import com.dao.courseservice.response.QuestionResponse;
import com.dao.courseservice.response.QuizDetailResponse;
import com.dao.courseservice.response.QuizSubmissionResultResponse;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.stream.Collectors;

@Component
public class QuizMapper {

    /**
     * Chuyển đổi Quiz sang DTO chi tiết để cho học sinh xem (che giấu đáp án).
     */
    public QuizDetailResponse toQuizDetailResponseForStudent(Quiz quiz) {
        if (quiz == null) return null;

        return QuizDetailResponse.builder()
                .id(quiz.getId())
                .title(quiz.getTitle())
                .description(quiz.getDescription())
                .timeLimitMinutes(quiz.getTimeLimitMinutes())
                .createdAt(quiz.getCreatedAt())
                .questions(quiz.getQuestions() != null ? quiz.getQuestions().stream()
                        .map(this::toQuestionResponseForStudent) // Gọi hàm con để xử lý từng câu hỏi
                        .collect(Collectors.toList()) : Collections.emptyList())
                .build();
    }

    /**
     * Chuyển đổi Question sang DTO (che giấu đáp án).
     */
    private QuestionResponse toQuestionResponseForStudent(Question question) {
        return QuestionResponse.builder()
                .id(question.getId())
                .content(question.getContent())
                .type(question.getType())
                .options(question.getOptions() != null ? question.getOptions().stream()
                        .map(this::toQuestionOptionResponseForStudent) // Gọi hàm con để xử lý từng lựa chọn
                        .collect(Collectors.toList()) : Collections.emptyList())
                .build();
    }

    /**
     * Chuyển đổi QuestionOption sang DTO (che giấu đáp án).
     * QUAN TRỌNG: Gán isCorrect = false để không lộ đáp án cho học sinh.
     */
    private QuestionOptionResponse toQuestionOptionResponseForStudent(QuestionOption option) {
        return QuestionOptionResponse.builder()
                .id(option.getId())
                .content(option.getContent())
                .isCorrect(false) // Luôn trả về false
                .build();
    }

    /**
     * Chuyển đổi QuizSubmission (entity) sang DTO kết quả trả về.
     */
    public QuizSubmissionResultResponse toQuizSubmissionResultResponse(QuizSubmission submission) {
        if (submission == null) return null;

        return QuizSubmissionResultResponse.builder()
                .id(submission.getId())
                .studentId(submission.getStudentId())
                .quizId(submission.getQuiz().getId())
                .score(submission.getScore())
                .submittedAt(submission.getSubmittedAt())
                .answers(submission.getAnswers()) // Giả sử bạn có lưu câu trả lời
                .build();
    }
}