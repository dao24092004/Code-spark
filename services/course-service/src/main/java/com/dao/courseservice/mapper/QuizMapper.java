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

// ========================================================================
// [THÊM MỚI] - Các import cho CRUD Admin
// ========================================================================
import com.dao.courseservice.entity.Course;
import com.dao.courseservice.request.CreateOptionRequest;
import com.dao.courseservice.request.CreateQuestionRequest;
import com.dao.courseservice.request.CreateQuizRequest;
import com.dao.courseservice.request.UpdateQuizRequest;
import com.dao.courseservice.response.QuestionAdminResponse;
import com.dao.courseservice.response.QuestionOptionAdminResponse;
import com.dao.courseservice.response.QuizAdminResponse;
import com.dao.courseservice.response.QuizSummaryResponse;
import java.util.HashSet;
import java.util.Set; // <-- THÊM IMPORT NÀY

@Component
public class QuizMapper {

    // ========================================================================
    // CÁC HÀM CŨ (CHO HỌC SINH)
    // ========================================================================

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

    // ========================================================================
    // [THÊM MỚI] - Mapper cho Request (Tạo mới Entity)
    // ========================================================================

    /**
     * Chuyển đổi CreateQuizRequest (DTO) sang Quiz (Entity).
     * Đây là hàm phức tạp nhất, nó xây dựng toàn bộ cây entity.
     */
    public Quiz toEntity(CreateQuizRequest request, Course course) {
        if (request == null) return null;

        Quiz quiz = Quiz.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .timeLimitMinutes(request.getTimeLimitMinutes())
                .course(course)
                .build();

        // Map Questions
        if (request.getQuestions() != null) {
            Set<Question> questions = request.getQuestions().stream()
                    .map(qDto -> toQuestionEntity(qDto, quiz)) // Chuyển từng Question DTO
                    .collect(Collectors.toSet());
            quiz.setQuestions(questions);
        }

        return quiz;
    }

    /**
     * Hàm hỗ trợ: Chuyển CreateQuestionRequest (DTO) sang Question (Entity)
     */
    private Question toQuestionEntity(CreateQuestionRequest qDto, Quiz quiz) {
        Question question = Question.builder()
                .content(qDto.getContent())
                .type(qDto.getType())
                .displayOrder(qDto.getDisplayOrder())
                .quiz(quiz)
                .build();

        // Map Options
        if (qDto.getOptions() != null) {
            Set<QuestionOption> options = qDto.getOptions().stream()
                    .map(oDto -> toOptionEntity(oDto, question)) // Chuyển từng Option DTO
                    .collect(Collectors.toSet());
            question.setOptions(options);
        }
        
        return question;
    }

    /**
     * Hàm hỗ trợ: Chuyển CreateOptionRequest (DTO) sang QuestionOption (Entity)
     */
    private QuestionOption toOptionEntity(CreateOptionRequest oDto, Question question) {
        return QuestionOption.builder()
                .content(oDto.getContent())
                .isCorrect(oDto.isCorrect())
                .question(question)
                .build();
    }
    
    /**
     * Cập nhật thông tin Quiz (Entity) từ UpdateQuizRequest (DTO).
     */
    public void updateQuizFromRequest(Quiz quiz, UpdateQuizRequest request) {
        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            quiz.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            quiz.setDescription(request.getDescription());
        }
        if (request.getTimeLimitMinutes() != null) {
            quiz.setTimeLimitMinutes(request.getTimeLimitMinutes());
        }
    }


    // ========================================================================
    // [THÊM MỚI] - Mapper cho Response (Admin - Hiển thị đáp án)
    // ========================================================================

    /**
     * Chuyển đổi Quiz (Entity) sang QuizAdminResponse (DTO cho Admin).
     */
    public QuizAdminResponse toQuizAdminResponse(Quiz quiz) {
        if (quiz == null) return null;

        return QuizAdminResponse.builder()
                .id(quiz.getId())
                .title(quiz.getTitle())
                .description(quiz.getDescription())
                .timeLimitMinutes(quiz.getTimeLimitMinutes())
                .createdAt(quiz.getCreatedAt())
                .questions(quiz.getQuestions() != null ? quiz.getQuestions().stream()
                        .map(this::toQuestionAdminResponse) // Gọi hàm con
                        .collect(Collectors.toList()) : Collections.emptyList())
                .build();
    }

    /**
     * Hàm hỗ trợ: Chuyển Question (Entity) sang QuestionAdminResponse (DTO)
     */
    private QuestionAdminResponse toQuestionAdminResponse(Question question) {
        return QuestionAdminResponse.builder()
                .id(question.getId())
                .content(question.getContent())
                .type(question.getType())
                .displayOrder(question.getDisplayOrder())
                .options(question.getOptions() != null ? question.getOptions().stream()
                        .map(this::toQuestionOptionAdminResponse) // Gọi hàm con
                        .collect(Collectors.toList()) : Collections.emptyList())
                .build();
    }

    /**
     * Hàm hỗ trợ: Chuyển QuestionOption (Entity) sang QuestionOptionAdminResponse (DTO)
     */
    private QuestionOptionAdminResponse toQuestionOptionAdminResponse(QuestionOption option) {
        return QuestionOptionAdminResponse.builder()
                .id(option.getId())
                .content(option.getContent())
                .isCorrect(option.isCorrect()) // Hiển thị đáp án đúng
                .build();
    }
    
    /**
     * Chuyển đổi Quiz (Entity) sang QuizSummaryResponse (DTO tóm tắt).
     */
    public QuizSummaryResponse toQuizSummaryResponse(Quiz quiz) {
        if (quiz == null) return null;
        return QuizSummaryResponse.builder()
                .id(quiz.getId())
                .title(quiz.getTitle())
                .build();
    }
}