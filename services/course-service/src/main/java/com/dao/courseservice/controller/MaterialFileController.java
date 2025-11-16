package com.dao.courseservice.controller;

import com.dao.common.dto.ApiResponse;
import com.dao.courseservice.entity.Course;
import com.dao.courseservice.exception.ResourceNotFoundException;
import com.dao.courseservice.repository.CourseRepository;
import com.dao.courseservice.service.S3FileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
public class MaterialFileController {

    private final CourseRepository courseRepository;
    private final S3FileService s3FileService;

    @PostMapping("/courses/{courseId}/materials/upload")
    @PreAuthorize("hasAuthority('MATERIAL_WRITE')")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadMaterial(
            @PathVariable UUID courseId,
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        // Ensure course exists
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));

        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Empty file"));
        }

        // Upload to S3/MinIO
        String publicUrl = s3FileService.uploadFile(file, "materials");

        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "storageKey", publicUrl,
                "url", publicUrl,
                "filename", publicUrl.substring(publicUrl.lastIndexOf("/") + 1)
        )));
    }
}


