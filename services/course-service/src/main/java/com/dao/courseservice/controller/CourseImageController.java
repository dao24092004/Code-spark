// src/main/java/com/dao/courseservice/controller/CourseImageController.java

package com.dao.courseservice.controller;

import com.dao.common.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.UUID;

@RestController
@RequestMapping("/api/courses/{courseId}/images")
//@RequiredArgsConstructor // (Sẽ inject service ở bước sau)
public class CourseImageController {

    // (Bạn cần tạo CourseImageService để xử lý logic upload file S3/MinIO)
    // private final CourseImageService courseImageService; 

    @PostMapping("/upload")
    @PreAuthorize("isAuthenticated()") // (Nên check quyền 'COURSE_WRITE')
    public ResponseEntity<ApiResponse<String>> uploadCourseImage(
        @PathVariable UUID courseId,
        @RequestParam("file") MultipartFile file
    ) {
        // Logic (trong Service):
        // 1. Upload file lên S3/MinIO.
        // 2. Lấy URL/Key trả về.
        // 3. Lưu (URL/Key, courseId) vào bảng `cm_course_images`.
        // String imageUrl = courseImageService.uploadImage(courseId, file);
        // return ResponseEntity.ok(ApiResponse.success("Image uploaded", imageUrl));

        // (Code tạm)
        return ResponseEntity.ok(ApiResponse.success("API (chưa code) Upload Image OK"));
    }

    @DeleteMapping("/{imageId}")
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