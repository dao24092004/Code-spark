package com.dao.courseservice.controller;

import com.dao.common.dto.ApiResponse;
import com.dao.courseservice.request.CreateCourseRequest;
import com.dao.courseservice.request.UpdateCourseRequest;
import com.dao.courseservice.request.CourseFilterCriteria;
import com.dao.courseservice.response.CourseAiDto; // [MỚI] Import DTO cho AI
import com.dao.courseservice.response.CourseMemberDto;
import com.dao.courseservice.response.CourseResponse;
import com.dao.courseservice.service.CourseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.UUID;

/**
 * Controller chịu trách nhiệm xử lý các request liên quan đến Khóa học (UC29).
 */
@RestController
@RequestMapping("/api/v1/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;

    /**
     * API để tạo một khóa học mới.
     */
    @PostMapping
    @PreAuthorize("hasAuthority('COURSE_CREATE')")
    public ResponseEntity<ApiResponse<CourseResponse>> createCourse(
            @Valid @RequestBody CreateCourseRequest request,
            @org.springframework.security.core.annotation.AuthenticationPrincipal Jwt jwt,
            @RequestHeader("Authorization") String authToken) {
        Long userId = extractUserId(jwt);
        CourseResponse newCourse = courseService.createCourse(request, userId, authToken);
        return new ResponseEntity<>(ApiResponse.success("Course created successfully", newCourse), HttpStatus.CREATED);
    }

    /**
     * API để lấy thông tin chi tiết của một khóa học theo ID.
     */
    @GetMapping("/{courseId}")
    public ResponseEntity<ApiResponse<CourseResponse>> getCourseById(@PathVariable UUID courseId) {
        CourseResponse courseResponse = courseService.getCourseById(courseId);
        return ResponseEntity.ok(ApiResponse.success(courseResponse));
    }

    /**
     * API để lấy danh sách tất cả các khóa học (hỗ trợ phân trang).
     */
    @GetMapping
    @PreAuthorize("hasAuthority('COURSE_READ')")
    public ResponseEntity<ApiResponse<Page<CourseResponse>>> getAllCourses(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String organizationId,
            @RequestParam(required = false) Long createdBy,
            @RequestParam(required = false) String visibility,
            @RequestParam(required = false) String createdFrom,
            @RequestParam(required = false) String createdTo) {

        CourseFilterCriteria filterCriteria = CourseFilterCriteria.builder()
                .keyword(keyword)
                .organizationId(organizationId)
                .createdBy(createdBy)
                .visibility(visibility)
                .createdFrom(parseDateTime(createdFrom))
                .createdTo(parseDateTime(createdTo))
                .build();

        Page<CourseResponse> courses = courseService.getAllCourses(pageable, filterCriteria);
        return ResponseEntity.ok(ApiResponse.success(courses));
    }

    private LocalDateTime parseDateTime(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return LocalDateTime.parse(value);
        } catch (DateTimeParseException ex) {
            throw new ResponseStatusException(HttpStatusCode.valueOf(400),
                    "createdFrom/createdTo phải đúng định dạng ISO-8601 (vd: 2025-01-01T00:00:00)", ex);
        }
    }

    private Long extractUserId(Jwt jwt) {
        Object raw = jwt.getClaim("id");
        if (raw == null) {
            raw = jwt.getClaim("userId");
        }
        if (raw instanceof Number number) {
            return number.longValue();
        }
        if (raw instanceof String s) {
            try {
                return Long.parseLong(s);
            } catch (NumberFormatException ignored) {
            }
        }
        String sub = jwt.getSubject();
        if (sub != null) {
            try {
                return Long.parseLong(sub);
            } catch (NumberFormatException ignored) {
            }
        }
        throw new ResponseStatusException(HttpStatusCode.valueOf(401),
                "Invalid token: missing numeric 'id'/'userId' claim");
    }

    @GetMapping("/organization/{organizationId}")
    @PreAuthorize("hasAuthority('COURSE_READ')")
    public ResponseEntity<ApiResponse<Page<CourseResponse>>> getCoursesByOrganizationId(
            @PathVariable String organizationId,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<CourseResponse> courses = courseService.getCoursesByOrganizationId(organizationId, pageable);
        return ResponseEntity.ok(ApiResponse.success(courses));
    }

    @PutMapping("/{courseId}")
    @PreAuthorize("hasAuthority('COURSE_WRITE')")
    public ResponseEntity<ApiResponse<CourseResponse>> updateCourse(
            @PathVariable UUID courseId,
            @Valid @RequestBody UpdateCourseRequest request) {
        CourseResponse updatedCourse = courseService.updateCourse(courseId, request);
        return ResponseEntity.ok(ApiResponse.success("Course updated successfully", updatedCourse));
    }

    @DeleteMapping("/{courseId}")
    @PreAuthorize("hasAuthority('COURSE_DELETE')")
    public ResponseEntity<ApiResponse<Void>> deleteCourse(@PathVariable UUID courseId) {
        courseService.deleteCourse(courseId);
        return ResponseEntity.ok(ApiResponse.success("Course deleted successfully"));
    }

    // ===============================================================
    // CÁC API MỚI (Từ Chức năng 2 & 3 & AI)
    // ===============================================================

    @PutMapping("/{courseId}/publish")
    @PreAuthorize("hasAuthority('COURSE_WRITE')")
    public ResponseEntity<ApiResponse<Void>> publishCourse(
            @PathVariable UUID courseId,
            @RequestHeader("Authorization") String authToken) {

        courseService.publishCourse(courseId, authToken);
        return ResponseEntity.ok(ApiResponse.success("Course published successfully"));
    }

    @GetMapping("/{courseId}/roster")
    @PreAuthorize("hasAuthority('COURSE_READ')")
    public ResponseEntity<ApiResponse<List<CourseMemberDto>>> getCourseRoster(
            @PathVariable UUID courseId,
            @RequestHeader("Authorization") String authToken) {

        List<CourseMemberDto> roster = courseService.getCourseRoster(courseId, authToken);
        return ResponseEntity.ok(ApiResponse.success(roster));
    }

    /**
     * API Internal dành cho AI Service.
     * Trả về danh sách CourseAiDto (nhẹ hơn CourseResponse).
     */
    @GetMapping("/internal/all-metadata")
    // @PreAuthorize("permitAll()") // Cân nhắc bảo mật nội bộ
    public ResponseEntity<ApiResponse<List<CourseAiDto>>> getAllCoursesForAI() {
        // [SỬA LỖI]: Gọi đúng tên method trong Service và dùng đúng kiểu trả về DTO
        List<CourseAiDto> courses = courseService.getAllCoursesForAI();
        return ResponseEntity.ok(ApiResponse.success(courses));
    }
}