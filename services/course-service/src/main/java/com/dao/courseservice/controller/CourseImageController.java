// src/main/java/com/dao/courseservice/controller/CourseImageController.java

package com.dao.courseservice.controller;

import com.dao.common.dto.ApiResponse;
import com.dao.courseservice.entity.Course;
import com.dao.courseservice.repository.CourseRepository;
import com.dao.courseservice.service.CourseService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/courses")
@RequiredArgsConstructor
public class CourseImageController {

    private final CourseService courseService; // Inject Service thay vì Repository

    @PostMapping("/{courseId}/images/upload")
    @PreAuthorize("hasAuthority('COURSE_WRITE')")
    public ResponseEntity<ApiResponse<String>> uploadCourseImage(
        @PathVariable UUID courseId,
        @RequestParam("file") MultipartFile file
    ) {
        String imageUrl = courseService.uploadCourseImage(courseId, file);
        return ResponseEntity.ok(ApiResponse.success("Image uploaded successfully", imageUrl));
    }

    @DeleteMapping("/{courseId}/images/{imageId}")
    @PreAuthorize("hasAuthority('COURSE_WRITE')")
    public ResponseEntity<ApiResponse<Void>> deleteCourseImage(
        @PathVariable UUID courseId,
        @PathVariable UUID imageId
    ) {
        courseService.deleteCourseImage(courseId, imageId);
        return ResponseEntity.ok(ApiResponse.success("Image deleted successfully"));
    }

}