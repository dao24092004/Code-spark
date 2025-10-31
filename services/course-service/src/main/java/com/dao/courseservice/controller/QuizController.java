package com.dao.courseservice.controller;

import com.dao.common.dto.ApiResponse;
import com.dao.courseservice.request.SubmitQuizRequest;
import com.dao.courseservice.response.QuizDetailResponse;
import com.dao.courseservice.response.QuizSubmissionResultResponse;
import com.dao.courseservice.service.QuizService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

// [THÊM MỚI] - Import cho CRUD Admin
import com.dao.courseservice.request.CreateQuizRequest;
import com.dao.courseservice.request.UpdateQuizRequest;
import com.dao.courseservice.response.QuizAdminResponse;
import com.dao.courseservice.response.QuizSummaryResponse;
import org.springframework.http.HttpStatus;
import java.util.List;

@RestController
@RequestMapping("/api") // <-- Sửa đường dẫn gốc thành /api
@RequiredArgsConstructor
public class QuizController {

    private final QuizService quizService;

    // ========================================================================
    // API cho Học sinh (Student)
    // (Thêm /quizzes vào đường dẫn)
    // ========================================================================
    
    /**
     * API để học sinh lấy thông tin chi tiết của một bài quiz để bắt đầu làm bài.
     */
    @GetMapping("/quizzes/{quizId}") // <-- Đường dẫn rõ ràng
    // @PreAuthorize("hasAuthority('COURSE_READ')") // BỎ để user có thể xem
    public ResponseEntity<ApiResponse<QuizDetailResponse>> getQuizDetails(@PathVariable UUID quizId) {
        QuizDetailResponse quizDetails = quizService.getQuizDetailsForStudent(quizId);
        return ResponseEntity.ok(ApiResponse.success(quizDetails));
    }

    /**
     * API để học sinh nộp bài quiz sau khi làm xong.
     */
    @PostMapping("/quizzes/{quizId}/submit") // <-- Đường dẫn rõ ràng
    @PreAuthorize("isAuthenticated()") // Yêu cầu người dùng phải đăng nhập để nộp bài
    public ResponseEntity<ApiResponse<QuizSubmissionResultResponse>> submitQuiz(
            @PathVariable UUID quizId,
            @Valid @RequestBody SubmitQuizRequest request
    ) {
        QuizSubmissionResultResponse result = quizService.submitQuiz(quizId, request);
        return ResponseEntity.ok(ApiResponse.success("Quiz submitted successfully", result));
    }

    // ========================================================================
    // [THÊM MỚI] - API cho Giảng viên/Admin (Instructor/Admin)
    // ========================================================================

    /**
     * (Admin) API tạo một bài quiz mới cho khóa học.
     */
    @PostMapping("/courses/{courseId}/quizzes")
    @PreAuthorize("hasAuthority('COURSE_CREATE')") // Quyền quản lý khóa học
    public ResponseEntity<ApiResponse<QuizAdminResponse>> createQuiz(
            @PathVariable UUID courseId,
            @Valid @RequestBody CreateQuizRequest request
    ) {
        QuizAdminResponse newQuiz = quizService.createQuiz(courseId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Quiz created successfully", newQuiz));
    }

    /**
     * (Admin) API lấy danh sách tóm tắt các quiz trong khóa học.
     */
    @GetMapping("/courses/{courseId}/quizzes")
    @PreAuthorize("hasAuthority('COURSE_READ')")
    public ResponseEntity<ApiResponse<List<QuizSummaryResponse>>> getAllQuizzesForCourse(
            @PathVariable UUID courseId
    ) {
        List<QuizSummaryResponse> quizzes = quizService.getAllQuizzesForCourse(courseId);
        return ResponseEntity.ok(ApiResponse.success(quizzes));
    }

    /**
     * (Admin) API lấy chi tiết quiz (bao gồm đáp án) cho admin.
     */
    @GetMapping("/quizzes/{quizId}/admin")
    @PreAuthorize("hasAuthority('COURSE_READ')")
    public ResponseEntity<ApiResponse<QuizAdminResponse>> getQuizDetailsForAdmin(
            @PathVariable UUID quizId
    ) {
        QuizAdminResponse quizDetails = quizService.getQuizDetailsForAdmin(quizId);
        return ResponseEntity.ok(ApiResponse.success(quizDetails));
    }

    /**
     * (Admin) API cập nhật thông tin cơ bản của quiz.
     */
    @PutMapping("/quizzes/{quizId}")
    @PreAuthorize("hasAuthority('COURSE_WRITE')")
    public ResponseEntity<ApiResponse<QuizAdminResponse>> updateQuiz(
            @PathVariable UUID quizId,
            @Valid @RequestBody UpdateQuizRequest request
    ) {
        QuizAdminResponse updatedQuiz = quizService.updateQuiz(quizId, request);
        return ResponseEntity.ok(ApiResponse.success("Quiz updated successfully", updatedQuiz));
    }

    /**
     * (Admin) API xóa một bài quiz.
     */
    @DeleteMapping("/quizzes/{quizId}")
    @PreAuthorize("hasAuthority('COURSE_DELETE')")
    public ResponseEntity<ApiResponse<Void>> deleteQuiz(
            @PathVariable UUID quizId
    ) {
        quizService.deleteQuiz(quizId);
        return ResponseEntity.ok(ApiResponse.success("Quiz deleted successfully"));
    }
}
