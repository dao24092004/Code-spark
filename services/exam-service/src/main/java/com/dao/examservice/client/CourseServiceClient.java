package com.dao.examservice.client;

import com.dao.examservice.client.dto.CmQuestionResponse;
import com.dao.examservice.dto.request.UpdateProgressRequest;
import com.dao.common.dto.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;
import java.util.UUID;

@FeignClient(name = "course-service", url = "${app.services.course-service.url:http://localhost:8082}")
public interface CourseServiceClient {

    @GetMapping("/api/quizzes/{quizId}/questions")
    List<CmQuestionResponse> getQuestionsByQuizId(@PathVariable("quizId") UUID quizId);

    @GetMapping("/api/quizzes/{quizId}/admin/questions")
    List<CmQuestionResponse> getQuestionsByQuizIdForAdmin(@PathVariable("quizId") UUID quizId);

    @PutMapping("/api/v1/courses/{courseId}/progress/{userId}")
    ApiResponse<Void> updateCourseProgress(
            @PathVariable("courseId") UUID courseId,
            @PathVariable("userId") UUID userId,
            @RequestBody UpdateProgressRequest request
    );

    @GetMapping("/api/v1/courses/{courseId}/progress/{userId}")
    ApiResponse<?> getCourseProgress(
            @PathVariable("courseId") UUID courseId,
            @PathVariable("userId") UUID userId
    );
}
