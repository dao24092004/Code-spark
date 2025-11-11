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
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

// [THÊM MỚI] - Các import cho CRUD Admin
import com.dao.courseservice.entity.Course;
import com.dao.courseservice.repository.CourseRepository;
import com.dao.courseservice.request.CreateQuizRequest;
import com.dao.courseservice.request.UpdateQuizRequest;
import com.dao.courseservice.response.QuizAdminResponse;
import com.dao.courseservice.response.QuizSummaryResponse;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

//================================================================================
// 1. INTERFACE: Cập nhật thêm 5 phương thức CRUD
//================================================================================

/**
 * Interface định nghĩa các chức năng nghiệp vụ cho việc làm Quiz (UC31)
 * VÀ QUẢN LÝ QUIZ (CRUD Admin)
 */
public interface QuizService {

    // ========================================================================
    // Nghiệp vụ Học sinh (Giữ nguyên)
    // ========================================================================

    /**
     * Lấy thông tin chi tiết của một bài quiz cho học sinh làm bài.
     * QUAN TRỌNG: Sẽ che giấu thông tin đáp án đúng.
     */
    QuizDetailResponse getQuizDetailsForStudent(UUID quizId);

    /**
     * Xử lý việc học sinh nộp bài, chấm điểm và lưu kết quả.
     */
    QuizSubmissionResultResponse submitQuiz(UUID quizId, SubmitQuizRequest request);

    // ========================================================================
    // [THÊM MỚI] - CRUD cho Admin
    // ========================================================================

    /**
     * (Admin) Tạo một bài quiz mới cho khóa học.
     */
    QuizAdminResponse createQuiz(UUID courseId, CreateQuizRequest request);

    /**
     * (Admin) Lấy chi tiết bài quiz (bao gồm cả đáp án đúng).
     */
    QuizAdminResponse getQuizDetailsForAdmin(UUID quizId);

    /**
     * (Admin) Lấy danh sách (tóm tắt) tất cả quiz của một khóa học.
     */
    List<QuizSummaryResponse> getAllQuizzesForCourse(UUID courseId);

    /**
     * (Admin) Cập nhật thông tin cơ bản của một bài quiz.
     */
    QuizAdminResponse updateQuiz(UUID quizId, UpdateQuizRequest request);

    /**
     * (Admin) Xóa một bài quiz.
     */
    void deleteQuiz(UUID quizId);
}

//================================================================================
// 2. IMPLEMENTATION: Thêm CourseRepository và 5 hàm triển khai
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
    private final ObjectMapper objectMapper; 
    
    // ========================================================================
    // [THÊM MỚI] - Dependencies cho CRUD Admin
    // ========================================================================
    private final CourseRepository courseRepository;

    
    // ========================================================================
    // Nghiệp vụ Học sinh (Giữ nguyên)
    // ========================================================================

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
            grantReward(request.getStudentId(), score * 10, "PASS_QUIZ", savedSubmission.getId());
        }

        return quizMapper.toQuizSubmissionResultResponse(savedSubmission);
    }
    
    // ... (Giữ nguyên các hàm private: calculateScore, grantReward)
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

    // ========================================================================
    // [THÊM MỚI] - Nghiệp vụ CRUD cho Admin
    // ========================================================================

    @Override
    public QuizAdminResponse createQuiz(UUID courseId, CreateQuizRequest request) {
        log.info("Creating new quiz for course {}", courseId);

        // 1. Tìm khóa học
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));

        // 2. Dùng mapper để chuyển DTO request thành Entity
        Quiz quiz = quizMapper.toEntity(request, course);

        // 3. Lưu (do cấu hình cascade, tất cả question/option sẽ được lưu theo)
        Quiz savedQuiz = quizRepository.save(quiz);
        log.info("Successfully created quiz with id: {}", savedQuiz.getId());

        // 4. Trả về response cho Admin (sử dụng mapper cho admin)
        return quizMapper.toQuizAdminResponse(savedQuiz);
    }

    @Override
    @Transactional(readOnly = true)
    public QuizAdminResponse getQuizDetailsForAdmin(UUID quizId) {
        log.info("Fetching quiz details for admin, id: {}", quizId);
        
        // Dùng lại query fetch đầy đủ
        Quiz quiz = quizRepository.findByIdWithQuestionsAndOptions(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz", "id", quizId));
        
        // Dùng mapper mới để hiển thị cả đáp án đúng
        return quizMapper.toQuizAdminResponse(quiz);
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuizSummaryResponse> getAllQuizzesForCourse(UUID courseId) {
        log.info("Fetching all quizzes summary for course {}", courseId);
        
        // 1. Kiểm tra khóa học tồn tại
        if (!courseRepository.existsById(courseId)) {
            throw new ResourceNotFoundException("Course", "id", courseId);
        }

        // 2. Tìm các quiz theo courseId
        List<Quiz> quizzes = quizRepository.findByCourseId(courseId);

        // 3. Map sang DTO tóm tắt
        return quizzes.stream()
                .map(quizMapper::toQuizSummaryResponse)
                .collect(Collectors.toList());
    }

    @Override
    public QuizAdminResponse updateQuiz(UUID quizId, UpdateQuizRequest request) {
        log.info("Updating quiz {}", quizId);
        
        // 1. Tìm quiz (không cần fetch sâu vì chỉ cập nhật thông tin quiz)
        Quiz existingQuiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz", "id", quizId));

        // 2. Dùng mapper cập nhật các trường
        quizMapper.updateQuizFromRequest(existingQuiz, request);

        // 3. Lưu lại
        Quiz savedQuiz = quizRepository.save(existingQuiz);
        log.info("Successfully updated quiz {}", savedQuiz.getId());

        // 4. Trả về DTO (Fetch lại để lấy thông tin đầy đủ, đảm bảo)
        return getQuizDetailsForAdmin(savedQuiz.getId());
    }

    @Override
    public void deleteQuiz(UUID quizId) {
        log.info("Deleting quiz {}", quizId);
        
        if (!quizRepository.existsById(quizId)) {
            throw new ResourceNotFoundException("Quiz", "id", quizId);
        }
        
        quizRepository.deleteById(quizId);
        log.info("Successfully deleted quiz {}", quizId);
    }
}
