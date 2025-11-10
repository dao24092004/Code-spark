package com.dao.courseservice.service;

import com.dao.courseservice.entity.QuestionOption;
import com.dao.courseservice.entity.Quiz;
import com.dao.courseservice.entity.QuizSubmission;
import com.dao.courseservice.entity.Reward;
import com.dao.courseservice.exception.ResourceNotFoundException;
import com.dao.courseservice.mapper.QuizMapper;
import com.dao.courseservice.repository.QuizRepository;
import com.dao.courseservice.repository.QuizSubmissionRepository;
import com.dao.courseservice.repository.RewardRepository;
import com.dao.courseservice.request.SubmitQuizRequest;
import com.dao.courseservice.response.QuizDetailResponse;
import com.dao.courseservice.response.QuizSubmissionResultResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.fasterxml.jackson.core.JsonProcessingException; // <-- SỬA LẠI: Thêm import này
import com.fasterxml.jackson.databind.ObjectMapper; // <-- SỬA LẠI: Thêm import này

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

//================================================================================
// 1. INTERFACE: Định nghĩa các chức năng nghiệp vụ cho việc làm Quiz (UC31)
//================================================================================

/**
 * Interface định nghĩa các chức năng nghiệp vụ cho việc làm Quiz (UC31).
 */
public interface QuizService {

    /**
     * Lấy thông tin chi tiết của một bài quiz cho học sinh làm bài.
     * QUAN TRỌNG: Sẽ che giấu thông tin đáp án đúng.
     * @param quizId ID của bài quiz.
     * @return Dữ liệu chi tiết của bài quiz.
     */
    QuizDetailResponse getQuizDetailsForStudent(UUID quizId);

    /**
     * Xử lý việc học sinh nộp bài, chấm điểm và lưu kết quả.
     * @param quizId ID của bài quiz.
     * @param request Các câu trả lời của học sinh.
     * @return Kết quả bài làm, bao gồm cả điểm số.
     */
    QuizSubmissionResultResponse submitQuiz(UUID quizId, SubmitQuizRequest request);
}

//================================================================================
// 2. IMPLEMENTATION: Lớp triển khai logic cho các chức năng trên
//================================================================================

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
class QuizServiceImpl implements QuizService {

    private final QuizRepository quizRepository;
    private final QuizSubmissionRepository submissionRepository;
    private final RewardRepository rewardRepository;
    private final QuizMapper quizMapper;
    private final ObjectMapper objectMapper; // <-- SỬA LẠI: Inject ObjectMapper vào đây
    //--------------------------------------------------------------------------
    // Lấy chi tiết bài quiz cho học sinh (ẩn đáp án đúng)
    //--------------------------------------------------------------------------

    @Override
    @Transactional(readOnly = true)
    public QuizDetailResponse getQuizDetailsForStudent(UUID quizId) {
        log.info("Fetching quiz details for id: {}", quizId);

        // SỬA LẠI: Dùng đúng phương thức để tải đầy đủ dữ liệu
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

        // Chuyển đổi Map sang chuỗi JSON trước khi lưu
        try {
            submission.setAnswers(objectMapper.writeValueAsString(request.getAnswers()));
        } catch (JsonProcessingException e) {
            log.error("Error serializing answers to JSON string", e);
            // Bạn có thể ném ra lỗi hoặc xử lý khác ở đây
        }

        QuizSubmission savedSubmission = submissionRepository.save(submission);
        log.info("Submission {} from student {} saved with score {}",
                savedSubmission.getId(), request.getStudentId(), score);

        if (score > 0) {
            grantReward(request.getStudentId(), score * 10, "PASS_QUIZ", savedSubmission.getId());
        }

        return quizMapper.toQuizSubmissionResultResponse(savedSubmission);
    }

    //--------------------------------------------------------------------------
    // Phương thức nội bộ: Chấm điểm quiz
    //--------------------------------------------------------------------------

    private int calculateScore(Quiz quiz, SubmitQuizRequest request) {
        int correctAnswers = 0;

        for (var question : quiz.getQuestions()) {
            // Lấy danh sách ID các đáp án đúng
            Set<UUID> correctOptionIds = question.getOptions().stream()
                    .filter(QuestionOption::isCorrect)
                    .map(QuestionOption::getId)
                    .collect(Collectors.toSet());

            // Lấy câu trả lời của học sinh cho câu hỏi này
            List<UUID> studentAnswerIds = request.getAnswers().get(question.getId());

            // So sánh xem có đúng hoàn toàn không
            if (studentAnswerIds != null && correctOptionIds.equals(Set.copyOf(studentAnswerIds))) {
                correctAnswers++;
            }
        }

        return correctAnswers;
    }

    //--------------------------------------------------------------------------
    // Phương thức nội bộ: Trao thưởng token (UC32)
    //--------------------------------------------------------------------------

    private void grantReward(Long studentId, int tokens, String reason, UUID relatedId) {
        log.info("Granting {} tokens to student {} for reason: {}", tokens, studentId, reason);

        Reward reward = Reward.builder()
                .studentId(studentId)
                .tokensAwarded(tokens)
                .reasonCode(reason)
                .relatedId(relatedId != null ? relatedId.toString() : null)
                .build();

        rewardRepository.save(reward);
    }
}
