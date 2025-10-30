package com.dao.courseservice.controller;

import com.dao.common.dto.ApiResponse;
import com.dao.courseservice.response.ProgressResponse;
import com.dao.courseservice.service.ProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ProgressController {

    private final ProgressService progressService;

    /**
     * API để cập nhật tiến độ của học sinh (khi họ xem xong một bài học).
     */
    @PostMapping("/progress/student/{studentId}/course/{courseId}/material/{materialId}")
    // @PreAuthorize - BỎ để user có thể update progress
    public ResponseEntity<ApiResponse<ProgressResponse>> updateProgress(
        @PathVariable Long studentId,
        @PathVariable UUID courseId,
        @PathVariable UUID materialId
) {
    ProgressResponse updatedProgress = progressService.updateStudentProgress(studentId, courseId, materialId);
    return ResponseEntity.ok(ApiResponse.success("Progress updated successfully", updatedProgress));
}

    /**
     * API để học sinh xem tiến độ của mình trong một khóa học.
     */
    @GetMapping("/progress/student/{studentId}/course/{courseId}")
    // @PreAuthorize - BỎ để user có thể xem progress
    public ResponseEntity<ApiResponse<ProgressResponse>> getStudentProgress(
        @PathVariable Long studentId,
        @PathVariable UUID courseId
) {
    ProgressResponse progress = progressService.getStudentProgressInCourse(studentId, courseId);
    return ResponseEntity.ok(ApiResponse.success(progress));
}
    
    /**
     * API cho giảng viên xem dashboard tiến độ của cả lớp.
     */
    @GetMapping("/courses/{courseId}/progress")
        // SỬA LẠI: Thêm điều kiện "hoặc có vai trò ADMIN"
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('COURSE_WRITE')")
    public ResponseEntity<ApiResponse<List<ProgressResponse>>> getCourseDashboard(@PathVariable UUID courseId) {
    List<ProgressResponse> dashboard = progressService.getCourseProgressDashboard(courseId);
    return ResponseEntity.ok(ApiResponse.success(dashboard));
}
}