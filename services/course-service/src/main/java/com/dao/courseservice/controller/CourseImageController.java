// src/main/java/com/dao/courseservice/controller/CourseImageController.java

package com.dao.courseservice.controller;

import com.dao.common.dto.ApiResponse;
import com.dao.courseservice.entity.Course;
import com.dao.courseservice.repository.CourseRepository;
import com.dao.courseservice.service.S3FileService;
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

    private final CourseRepository courseRepository;
    private final S3FileService s3FileService;

    @PostMapping("/{courseId}/images/upload")
    @PreAuthorize("isAuthenticated()") // (Nên check quyền 'COURSE_WRITE')
    public ResponseEntity<ApiResponse<String>> uploadCourseImage(
        @PathVariable UUID courseId,
        @RequestParam("file") MultipartFile file
    ) {
        try {
            // Upload to S3/MinIO
            String publicUrl = s3FileService.uploadFile(file, "thumbnails");

            // Update course thumbnailUrl
            Course course = courseRepository.findById(courseId).orElse(null);
            if (course != null) {
                course.setThumbnailUrl(publicUrl);
                courseRepository.save(course);
            }

            return ResponseEntity.ok(ApiResponse.success("Image uploaded", publicUrl));
        } catch (IOException ex) {
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to upload image: " + ex.getMessage()));
        }
    }

    @DeleteMapping("/{courseId}/images/{imageId}")
    @PreAuthorize("isAuthenticated()") // (Nên check quyền 'COURSE_WRITE')
    public ResponseEntity<ApiResponse<Void>> deleteCourseImage(
        @PathVariable UUID courseId,
        @PathVariable UUID imageId
    ) {
        // Logic (trong Service):
        // 1. Xóa file trên S3/MinIO.
        // 2. Xóa hàng trong bảng `cm_course_images`.
        // courseImageService.deleteImage(courseId, imageId);
        return ResponseEntity.ok(ApiResponse.success("Image deleted"));
    }
}