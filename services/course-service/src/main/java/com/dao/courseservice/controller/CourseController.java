package com.dao.courseservice.controller;

import com.dao.common.dto.ApiResponse;
import com.dao.courseservice.request.CreateCourseRequest;
import com.dao.courseservice.request.UpdateCourseRequest;
import com.dao.courseservice.request.CourseFilterCriteria;
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
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatusCode;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.UUID;

/**
 * Controller chịu trách nhiệm xử lý các request liên quan đến Khóa học (UC29).
 */
@RestController
@RequestMapping("/api/v1/courses") // Full path to ensure consistency
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;

    /**
     * API để tạo một khóa học mới.
     * Yêu cầu người dùng phải có quyền 'COURSE_CREATE'.
     */
    @PostMapping
    @PreAuthorize("hasAuthority('COURSE_CREATE')")
    public ResponseEntity<ApiResponse<CourseResponse>> createCourse(
            @Valid @RequestBody CreateCourseRequest request,
            @org.springframework.security.core.annotation.AuthenticationPrincipal Jwt jwt,
            @RequestHeader("Authorization") String authToken
    ) {
        UUID userId = extractUserId(jwt);

        CourseResponse newCourse = courseService.createCourse(request, userId, authToken);
        // Trả về 201 Created thì tốt hơn cho POST
        return new ResponseEntity<>(ApiResponse.success("Course created successfully", newCourse), HttpStatus.CREATED);
    }

    /**
     * API để lấy thông tin chi tiết của một khóa học theo ID.
     * Cho phép truy cập công khai để user có thể xem courses.
     */
    @GetMapping("/{courseId}")
    public ResponseEntity<ApiResponse<CourseResponse>> getCourseById(@PathVariable UUID courseId) {
        CourseResponse courseResponse = courseService.getCourseById(courseId);
        return ResponseEntity.ok(ApiResponse.success(courseResponse));
    }

    /**
     * API để lấy danh sách tất cả các khóa học (hỗ trợ phân trang).
     * Cho phép truy cập công khai để user có thể xem courses.
     */
    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_READ')")
    public ResponseEntity<ApiResponse<Page<CourseResponse>>> getAllCourses(
            @PageableDefault(size = 20, page = 0) Pageable pageable,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String organizationId,
            @RequestParam(required = false) String visibility,
            @RequestParam(required = false) String createdFrom,
            @RequestParam(required = false) String createdTo) {

        // Protection: Limit max page size to prevent abuse
        int maxPageSize = 100;
        int safePageSize = Math.min(pageable.getPageSize(), maxPageSize);
        Pageable safePageable = org.springframework.data.domain.PageRequest.of(
                pageable.getPageNumber(),
                safePageSize,
                pageable.getSort()
        );

        CourseFilterCriteria filterCriteria = CourseFilterCriteria.builder()
                .keyword(keyword)
                .organizationId(organizationId != null ? UUID.fromString(organizationId) : null)
                .visibility(visibility)
                .createdFrom(parseDateTime(createdFrom))
                .createdTo(parseDateTime(createdTo))
                .build();

        // Use safePageable instead of original pageable
        Page<CourseResponse> courses = courseService.getAllCourses(safePageable, filterCriteria);
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
    
    /**
     * Trích xuất userId an toàn từ JWT.
     * Ưu tiên claim 'id' hoặc 'userId'. Nếu không có, thử parse 'sub' khi là số.
     * Ném 401 nếu không tìm thấy user id hợp lệ.
     */
    private UUID extractUserId(Jwt jwt) {
        Object raw = jwt.getClaim("id");
        if (raw == null) {
            raw = jwt.getClaim("userId");
        }
        if (raw instanceof String s) {
            return UUID.fromString(s);
        }
        if (raw instanceof Number n) {
            return UUID.nameUUIDFromBytes((n.longValue() + "").getBytes());
        }
        String sub = jwt.getSubject();
        if (sub != null) {
            try {
                return UUID.fromString(sub);
            } catch (IllegalArgumentException ignored) {}
        }
        throw new ResponseStatusException(HttpStatusCode.valueOf(401), "Invalid token: missing UUID 'id'/'userId' claim");
    }

    /**
     * Lấy danh sách khóa học theo organizationId với phân trang
     * @param organizationId ID của tổ chức
     * @param pageable Thông tin phân trang
     * @return Danh sách khóa học đã phân trang
     */
    @GetMapping("/organization/{organizationId}")
    @PreAuthorize("hasAuthority('COURSE_READ')")
    public ResponseEntity<ApiResponse<Page<CourseResponse>>> getCoursesByOrganizationId(
            @PathVariable UUID organizationId,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<CourseResponse> courses = courseService.getCoursesByOrganizationId(organizationId, pageable);
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

    // ===============================================================
    // CÁC API MỚI (Từ Chức năng 2 & 3)
    // ===============================================================

    /**
     * API để publish một khóa học (Chức năng 2).
     * Yêu cầu quyền 'COURSE_WRITE'.
     */
    @PutMapping("/{courseId}/publish")
    @PreAuthorize("hasAuthority('COURSE_WRITE')")
    public ResponseEntity<ApiResponse<Void>> publishCourse(
            @PathVariable UUID courseId,
            @RequestHeader("Authorization") String authToken) {
        
        courseService.publishCourse(courseId, authToken);
        return ResponseEntity.ok(ApiResponse.success("Course published successfully"));
    }

    /**
     * API để lấy danh sách học viên (roster) của một khóa học.
     * Yêu cầu quyền 'COURSE_READ'.
     */
    @GetMapping("/{courseId}/roster")
    @PreAuthorize("hasAuthority('COURSE_READ')")
    public ResponseEntity<ApiResponse<List<CourseMemberDto>>> getCourseRoster(
            @PathVariable UUID courseId,
            @RequestHeader("Authorization") String authToken) {

        List<CourseMemberDto> roster = courseService.getCourseRoster(courseId, authToken);
        return ResponseEntity.ok(ApiResponse.success(roster));
    }

    /**
     * API để lấy danh sách học viên của một khóa học với phân trang.
     * Yêu cầu quyền 'COURSE_READ'.
     */
    @GetMapping("/{courseId}/students")
    @PreAuthorize("hasAuthority('COURSE_READ')")
    public ResponseEntity<ApiResponse<Page<CourseMemberDto>>> getCourseStudents(
            @PathVariable UUID courseId,
            @PageableDefault(size = 20) Pageable pageable) {

        Page<CourseMemberDto> students = courseService.getCourseStudents(courseId, pageable);
        return ResponseEntity.ok(ApiResponse.success(students));
    }
}