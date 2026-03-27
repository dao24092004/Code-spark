package com.dao.courseservice.service;

import com.dao.courseservice.entity.Course;
import com.dao.courseservice.entity.QuestionOption;
import com.dao.courseservice.entity.Quiz;
import com.dao.courseservice.entity.QuizSubmission;
import com.dao.courseservice.entity.Reward;
import com.dao.courseservice.exception.ResourceNotFoundException;
import com.dao.courseservice.mapper.QuizMapper;
import com.dao.courseservice.repository.CourseRepository;
import com.dao.courseservice.repository.QuizRepository;
import com.dao.courseservice.repository.QuizSubmissionRepository;
import com.dao.courseservice.repository.RewardRepository;
import com.dao.courseservice.request.CreateQuizRequest;
import com.dao.courseservice.request.SubmitQuizRequest;
import com.dao.courseservice.request.UpdateQuizRequest;
import com.dao.courseservice.response.QuestionAdminResponse;
import com.dao.courseservice.response.QuizAdminResponse;
import com.dao.courseservice.response.QuizDetailResponse;
import com.dao.courseservice.response.QuizSubmissionResultResponse;
import com.dao.courseservice.response.QuizSummaryResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

public interface QuizService {
    QuizDetailResponse getQuizDetailsForStudent(UUID quizId);
    QuizSubmissionResultResponse submitQuiz(UUID quizId, SubmitQuizRequest request);
    QuizAdminResponse createQuiz(UUID courseId, CreateQuizRequest request);
    QuizAdminResponse getQuizDetailsForAdmin(UUID quizId);
    List<QuizSummaryResponse> getAllQuizzesForCourse(UUID courseId);
    QuizAdminResponse updateQuiz(UUID quizId, UpdateQuizRequest request);
    void deleteQuiz(UUID quizId);
    List<QuestionAdminResponse> getQuestionsForExam(UUID quizId);
    List<QuestionAdminResponse> getQuestionsForExamAdmin(UUID quizId);
}

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
class QuizServiceImpl implements QuizService {

    private final QuizRepository quizRepository;
    private final QuizSubmissionRepository submissionRepository;
    private final RewardRepository rewardRepository;
    private final QuizMapper quizMapper;
    private final ObjectMapper objectMapper;
    private final CourseRepository courseRepository;

    @Override
    @Transactional(readOnly = true)
    public QuizDetailResponse getQuizDetailsForStudent(UUID quizId) {
        log.info("Fetching quiz details for id: {}", quizId);
        Quiz quiz = quizRepository.findByIdWithQuestionsAndOptions(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz", "id", quizId));
        return quizMapper.toQuizDetailResponseForStudent(quiz);
    }

    @Override
    public QuizSubmissionResultResponse submitQuiz(UUID quizId, SubmitQuizRequest request) {
        log.info("Student {} submitting quiz {}", request.getStudentId(), quizId);

        Quiz quiz = quizRepository.findByIdWithQuestionsAndOptions(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz", "id", quizId));

        int score = calculateScore(quiz, request);
        QuizSubmission submission = new QuizSubmission();
        submission.setQuiz(quiz);
        submission.setStudentId(request.getStudentId());
        submission.setScore(score);

        try {
            submission.setAnswers(objectMapper.writeValueAsString(request.getAnswers()));
        } catch (JsonProcessingException e) {
            log.error("Error serializing answers to JSON string", e);
        }

        QuizSubmission savedSubmission = submissionRepository.save(submission);
        log.info("Submission {} from student {} saved with score {}",
                savedSubmission.getId(), request.getStudentId(), score);

        if (score > 0) {
            grantReward(request.getStudentId(), score * 10, "PASS_QUIZ", savedSubmission.getId(), quiz.getCourse().getId());
        }

        return quizMapper.toQuizSubmissionResultResponse(savedSubmission);
    }

    private int calculateScore(Quiz quiz, SubmitQuizRequest request) {
        int correctAnswers = 0;
        for (var question : quiz.getQuestions()) {
            Set<UUID> correctOptionIds = question.getOptions().stream()
                    .filter(QuestionOption::isCorrect)
                    .map(QuestionOption::getId)
                    .collect(Collectors.toSet());
            List<UUID> studentAnswerIds = request.getAnswers().get(question.getId());
            if (studentAnswerIds != null && correctOptionIds.equals(Set.copyOf(studentAnswerIds))) {
                correctAnswers++;
            }
        }
        return correctAnswers;
    }

    private void grantReward(UUID studentId, int tokens, String reason, UUID relatedId, UUID courseId) {
        log.info("Granting {} tokens to student {} for reason: {}", tokens, studentId, reason);
        Course course = courseRepository.findActiveById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));
        Reward reward = Reward.builder()
                .studentId(studentId)
                .course(course)
                .tokensAwarded(tokens)
                .reasonCode(reason)
                .relatedId(relatedId != null ? relatedId.toString() : null)
                .build();
        rewardRepository.save(reward);
    }

    @Override
    public QuizAdminResponse createQuiz(UUID courseId, CreateQuizRequest request) {
        log.info("Creating new quiz for course {}", courseId);

        Course course = courseRepository.findActiveById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));

        Quiz quiz = quizMapper.toEntity(request, course);
        if (quiz.getStatus() == null || quiz.getStatus().isBlank()) {
            quiz.setStatus("DRAFT");
        }

        Quiz savedQuiz = quizRepository.save(quiz);
        log.info("Successfully created quiz with id: {}", savedQuiz.getId());

        return quizMapper.toQuizAdminResponse(savedQuiz);
    }

    @Override
    @Transactional(readOnly = true)
    public QuizAdminResponse getQuizDetailsForAdmin(UUID quizId) {
        log.info("Fetching quiz details for admin, id: {}", quizId);

        Quiz quiz = quizRepository.findByIdWithQuestionsAndOptions(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz", "id", quizId));

        return quizMapper.toQuizAdminResponse(quiz);
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuizSummaryResponse> getAllQuizzesForCourse(UUID courseId) {
        log.info("Fetching all quizzes summary for course {}", courseId);

        List<Quiz> quizzes = quizRepository.findByCourseId(courseId);

        return quizzes.stream()
                .map(quizMapper::toQuizSummaryResponse)
                .collect(Collectors.toList());
    }

    @Override
    public QuizAdminResponse updateQuiz(UUID quizId, UpdateQuizRequest request) {
        log.info("Updating quiz {}", quizId);

        Quiz existingQuiz = quizRepository.findActiveById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz", "id", quizId));

        quizMapper.updateQuizFromRequest(existingQuiz, request);

        Quiz savedQuiz = quizRepository.save(existingQuiz);
        log.info("Successfully updated quiz {}", savedQuiz.getId());

        return getQuizDetailsForAdmin(savedQuiz.getId());
    }

    @Override
    public void deleteQuiz(UUID quizId) {
        log.info("Deleting quiz {}", quizId);

        Quiz quiz = quizRepository.findActiveById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz", "id", quizId));

        quizRepository.delete(quiz);

        log.info("Successfully deleted quiz {}", quizId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuestionAdminResponse> getQuestionsForExam(UUID quizId) {
        log.info("Fetching questions for exam from quiz {}", quizId);

        Quiz quiz = quizRepository.findByIdWithQuestionsAndOptions(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz", "id", quizId));

        return quiz.getQuestions().stream()
                .map(quizMapper::toQuestionForExam)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuestionAdminResponse> getQuestionsForExamAdmin(UUID quizId) {
        log.info("Fetching questions for exam (admin) from quiz {}", quizId);

        Quiz quiz = quizRepository.findByIdWithQuestionsAndOptions(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz", "id", quizId));

        return quiz.getQuestions().stream()
                .map(quizMapper::toQuestionForExam)
                .collect(Collectors.toList());
    }
}
