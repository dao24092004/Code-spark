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

@RestController
@RequestMapping("/api/quizzes") // Đường dẫn gốc cho tất cả API về quiz
@RequiredArgsConstructor
public class QuizController {

    private final QuizService quizService;

    /**
     * API để học sinh lấy thông tin chi tiết của một bài quiz để bắt đầu làm bài.
     */
    @GetMapping("/{quizId}")
    // @PreAuthorize("hasAuthority('COURSE_READ')") // BỎ để user có thể xem
    public ResponseEntity<ApiResponse<QuizDetailResponse>> getQuizDetails(@PathVariable UUID quizId) {
        QuizDetailResponse quizDetails = quizService.getQuizDetailsForStudent(quizId);
        return ResponseEntity.ok(ApiResponse.success(quizDetails));
    }

    /**
     * API để học sinh nộp bài quiz sau khi làm xong.
     */
    @PostMapping("/{quizId}/submit")
    @PreAuthorize("isAuthenticated()") // Yêu cầu người dùng phải đăng nhập để nộp bài
    public ResponseEntity<ApiResponse<QuizSubmissionResultResponse>> submitQuiz(
            @PathVariable UUID quizId,
            @Valid @RequestBody SubmitQuizRequest request
    ) {
        QuizSubmissionResultResponse result = quizService.submitQuiz(quizId, request);
        return ResponseEntity.ok(ApiResponse.success("Quiz submitted successfully", result));
    }
}