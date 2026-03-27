package com.dao.courseservice.mapper;

import com.dao.courseservice.entity.Course;
import com.dao.courseservice.entity.Question;
import com.dao.courseservice.entity.QuestionOption;
import com.dao.courseservice.entity.Quiz;
import com.dao.courseservice.entity.QuizSubmission;
import com.dao.courseservice.request.CreateOptionRequest;
import com.dao.courseservice.request.CreateQuestionRequest;
import com.dao.courseservice.request.CreateQuizRequest;
import com.dao.courseservice.request.UpdateQuizRequest;
import com.dao.courseservice.response.QuestionOptionAdminResponse;
import com.dao.courseservice.response.QuestionOptionResponse;
import com.dao.courseservice.response.QuestionResponse;
import com.dao.courseservice.response.QuizAdminResponse;
import com.dao.courseservice.response.QuizDetailResponse;
import com.dao.courseservice.response.QuizSubmissionResultResponse;
import com.dao.courseservice.response.QuizSummaryResponse;
import com.dao.courseservice.response.QuestionAdminResponse;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class QuizMapper {

    public QuizDetailResponse toQuizDetailResponseForStudent(Quiz quiz) {
        if (quiz == null) return null;

        return QuizDetailResponse.builder()
                .id(quiz.getId())
                .title(quiz.getTitle())
                .description(quiz.getDescription())
                .timeLimitMinutes(quiz.getTimeLimitMinutes())
                .createdAt(quiz.getCreatedAt())
                .questions(quiz.getQuestions() != null ? quiz.getQuestions().stream()
                        .map(this::toQuestionResponseForStudent)
                        .collect(Collectors.toList()) : Collections.emptyList())
                .build();
    }

    private QuestionResponse toQuestionResponseForStudent(Question question) {
        return QuestionResponse.builder()
                .id(question.getId())
                .content(question.getContent())
                .type(question.getType())
                .options(question.getOptions() != null ? question.getOptions().stream()
                        .map(this::toQuestionOptionResponseForStudent)
                        .collect(Collectors.toList()) : Collections.emptyList())
                .build();
    }

    private QuestionOptionResponse toQuestionOptionResponseForStudent(QuestionOption option) {
        return QuestionOptionResponse.builder()
                .id(option.getId())
                .content(option.getContent())
                .isCorrect(false)
                .build();
    }

    public QuizSubmissionResultResponse toQuizSubmissionResultResponse(QuizSubmission submission) {
        if (submission == null) return null;

        return QuizSubmissionResultResponse.builder()
                .id(submission.getId())
                .studentId(submission.getStudentId())
                .quizId(submission.getQuiz().getId())
                .score(submission.getScore())
                .submittedAt(submission.getSubmittedAt())
                .answers(submission.getAnswers())
                .build();
    }

    public Quiz toEntity(CreateQuizRequest request, Course course) {
        if (request == null) return null;

        Quiz quiz = Quiz.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .timeLimitMinutes(request.getTimeLimitMinutes())
                .course(course)
                .build();

        if (request.getQuestions() != null) {
            Set<Question> questions = request.getQuestions().stream()
                    .map(qDto -> toQuestionEntity(qDto, quiz))
                    .collect(Collectors.toSet());
            quiz.setQuestions(questions);
        }

        return quiz;
    }

    private Question toQuestionEntity(CreateQuestionRequest qDto, Quiz quiz) {
        Question question = Question.builder()
                .content(qDto.getContent())
                .type(qDto.getType())
                .displayOrder(qDto.getDisplayOrder())
                .quiz(quiz)
                .build();

        if (qDto.getOptions() != null) {
            Set<QuestionOption> options = qDto.getOptions().stream()
                    .map(oDto -> toOptionEntity(oDto, question))
                    .collect(Collectors.toSet());
            question.setOptions(options);
        }

        return question;
    }

    private QuestionOption toOptionEntity(CreateOptionRequest oDto, Question question) {
        return QuestionOption.builder()
                .content(oDto.getContent())
                .isCorrect(oDto.isCorrect())
                .question(question)
                .build();
    }

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

    public QuizAdminResponse toQuizAdminResponse(Quiz quiz) {
        if (quiz == null) return null;

        return QuizAdminResponse.builder()
                .id(quiz.getId())
                .title(quiz.getTitle())
                .description(quiz.getDescription())
                .timeLimitMinutes(quiz.getTimeLimitMinutes())
                .createdAt(quiz.getCreatedAt())
                .questions(quiz.getQuestions() != null ? quiz.getQuestions().stream()
                        .map(this::toQuestionAdminResponse)
                        .collect(Collectors.toList()) : Collections.emptyList())
                .build();
    }

    private QuestionAdminResponse toQuestionAdminResponse(Question question) {
        return QuestionAdminResponse.builder()
                .id(question.getId())
                .content(question.getContent())
                .type(question.getType())
                .displayOrder(question.getDisplayOrder())
                .options(question.getOptions() != null ? question.getOptions().stream()
                        .map(this::toQuestionOptionAdminResponse)
                        .collect(Collectors.toList()) : Collections.emptyList())
                .build();
    }

    private QuestionOptionAdminResponse toQuestionOptionAdminResponse(QuestionOption option) {
        return QuestionOptionAdminResponse.builder()
                .id(option.getId())
                .content(option.getContent())
                .isCorrect(option.isCorrect())
                .build();
    }

    public QuizSummaryResponse toQuizSummaryResponse(Quiz quiz) {
        if (quiz == null) return null;
        return QuizSummaryResponse.builder()
                .id(quiz.getId())
                .title(quiz.getTitle())
                .build();
    }

    public QuestionAdminResponse toQuestionForExam(Question question) {
        if (question == null) return null;
        return QuestionAdminResponse.builder()
                .id(question.getId())
                .content(question.getContent())
                .type(question.getType())
                .displayOrder(question.getDisplayOrder())
                .options(question.getOptions() != null ? question.getOptions().stream()
                        .map(this::toQuestionOptionAdminResponse)
                        .collect(Collectors.toList()) : Collections.emptyList())
                .build();
    }
}
