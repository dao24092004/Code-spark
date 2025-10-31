package com.dao.courseservice.controller;

import com.dao.common.dto.ApiResponse; // Import ApiResponse từ common library
import com.dao.courseservice.request.CreateCourseRequest;
import com.dao.courseservice.request.UpdateCourseRequest;
import com.dao.courseservice.response.CourseResponse;
import com.dao.courseservice.service.CourseService;
import jakarta.validation.Valid; // Sửa lại import từ javax thành jakarta
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Controller chịu trách nhiệm xử lý các request liên quan đến Khóa học (UC29).
 */
@RestController
@RequestMapping("/api/courses") // Đường dẫn gốc cho tất cả các API
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;

    /**
     * API để tạo một khóa học mới.
     * Yêu cầu người dùng phải có quyền 'COURSE_CREATE'.
     */
    @PostMapping
    @PreAuthorize("hasAuthority('COURSE_CREATE')")
    public ResponseEntity<ApiResponse<CourseResponse>> createCourse(@Valid @RequestBody CreateCourseRequest request) {
        CourseResponse newCourse = courseService.createCourse(request);
        return ResponseEntity.ok(ApiResponse.success("Course created successfully", newCourse));
    }

    /**
     * API để lấy thông tin chi tiết của một khóa học theo ID.
     * Cho phép truy cập công khai để user có thể xem courses.
     */
    @GetMapping("/{courseId}")
    // @PreAuthorize("hasAuthority('COURSE_READ')") // BỎ để user có thể xem
    public ResponseEntity<ApiResponse<CourseResponse>> getCourseById(@PathVariable UUID courseId) {
        CourseResponse courseResponse = courseService.getCourseById(courseId);
        return ResponseEntity.ok(ApiResponse.success(courseResponse));
    }

    /**
     * API để lấy danh sách tất cả các khóa học (hỗ trợ phân trang).
     * Cho phép truy cập công khai để user có thể xem courses.
     */
    @GetMapping
    // @PreAuthorize("hasAuthority('COURSE_READ')") // BỎ để user có thể xem
    public ResponseEntity<ApiResponse<Page<CourseResponse>>> getAllCourses(
            @PageableDefault(size = 10) Pageable pageable
    ) {
        Page<CourseResponse> courses = courseService.getAllCourses(pageable);
        return ResponseEntity.ok(ApiResponse.success(courses));
    }

    /**
     * API để cập nhật thông tin một khóa học.
     * Yêu cầu người dùng phải có quyền 'COURSE_UPDATE'.
     */
    @PutMapping("/{courseId}")
    @PreAuthorize("hasAuthority('COURSE_WRITE')")
    public ResponseEntity<ApiResponse<CourseResponse>> updateCourse(
            @PathVariable UUID courseId,
            @Valid @RequestBody UpdateCourseRequest request
    ) {
        CourseResponse updatedCourse = courseService.updateCourse(courseId, request);
        return ResponseEntity.ok(ApiResponse.success("Course updated successfully", updatedCourse));
    }

    /**
     * API để xóa một khóa học.
     * Yêu cầu người dùng phải có quyền 'COURSE_DELETE'.
     */
    @DeleteMapping("/{courseId}")
    @PreAuthorize("hasAuthority('COURSE_DELETE')")
    public ResponseEntity<ApiResponse<Void>> deleteCourse(@PathVariable UUID courseId) {
        courseService.deleteCourse(courseId);
        return ResponseEntity.ok(ApiResponse.success("Course deleted successfully"));
    }
}