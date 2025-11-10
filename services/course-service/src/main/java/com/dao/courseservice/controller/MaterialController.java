package com.dao.courseservice.controller;

import com.dao.common.dto.ApiResponse;
import com.dao.courseservice.request.CreateMaterialRequest;
import com.dao.courseservice.response.MaterialResponse;
import com.dao.courseservice.service.MaterialService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api") // Đường dẫn gốc
@RequiredArgsConstructor
public class MaterialController {

    private final MaterialService materialService;

    /**
     * API để thêm một học liệu mới vào một khóa học.
     * @param courseId ID của khóa học từ đường dẫn.
     * @param request Dữ liệu học liệu mới.
     */
    @PostMapping("/courses/{courseId}/materials")
    @PreAuthorize("hasAuthority('MATERIAL_WRITE')") // Yêu cầu quyền sửa khóa học để thêm học liệu
    public ResponseEntity<ApiResponse<MaterialResponse>> addMaterialToCourse(
            @PathVariable UUID courseId,
            @Valid @RequestBody CreateMaterialRequest request
    ) {
        MaterialResponse newMaterial = materialService.addMaterialToCourse(courseId, request);
        return ResponseEntity.ok(ApiResponse.success("Material added successfully", newMaterial));
    }

    /**
     * API để lấy tất cả học liệu của một khóa học.
     * @param courseId ID của khóa học từ đường dẫn.
     */
    @GetMapping("/courses/{courseId}/materials")
    // @PreAuthorize("hasAuthority('COURSE_READ')") // BỎ để user có thể xem
    public ResponseEntity<ApiResponse<List<MaterialResponse>>> getMaterialsForCourse(@PathVariable UUID courseId) {
        List<MaterialResponse> materials = materialService.getMaterialsForCourse(courseId);
        return ResponseEntity.ok(ApiResponse.success(materials));
    }

    /**
     * API để xóa một học liệu dựa trên ID của chính nó.
     * @param materialId ID của học liệu cần xóa.
     */
    @DeleteMapping("/materials/{materialId}")
    @PreAuthorize("hasAuthority('MATERIAL_DELETE')")
    public ResponseEntity<ApiResponse<Void>> deleteMaterial(@PathVariable UUID materialId) {
        materialService.deleteMaterial(materialId);
        return ResponseEntity.ok(ApiResponse.success("Material deleted successfully"));
    }
}