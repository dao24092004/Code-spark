package com.dao.courseservice.controller;

import com.dao.common.dto.ApiResponse;
import com.dao.courseservice.entity.Course;
import com.dao.courseservice.exception.ResourceNotFoundException;
import com.dao.courseservice.repository.CourseRepository;
import com.dao.courseservice.service.MaterialService;

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
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Slf4j
public class MaterialFileController {

    private final MaterialService materialService; // Dùng Service thay vì Repository

    @PostMapping("/courses/{courseId}/materials/upload")
    @PreAuthorize("hasAuthority('MATERIAL_WRITE')")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadMaterial(
            @PathVariable UUID courseId,
            @RequestParam("file") MultipartFile file
    ) {
        // Mọi logic kiểm tra khóa học và upload đã nằm trong service
        Map<String, String> uploadResult = materialService.uploadMaterialFile(courseId, file);
        
        return ResponseEntity.ok(ApiResponse.success("File uploaded successfully", uploadResult));
}
}


