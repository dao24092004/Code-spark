package com.dao.courseservice.service;

import com.dao.courseservice.entity.Course;
import com.dao.courseservice.entity.Material;
import com.dao.courseservice.exception.ResourceNotFoundException;
import com.dao.courseservice.mapper.MaterialMapper;
import com.dao.courseservice.repository.CourseRepository;
import com.dao.courseservice.repository.MaterialRepository;
import com.dao.courseservice.request.CreateMaterialRequest;
import com.dao.courseservice.response.MaterialResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import com.dao.client.FileServiceClient;

import com.dao.common.notification.NotificationMessage;
import com.dao.common.notification.NotificationProducerService;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.HashMap;
import java.util.Map;

public interface MaterialService {
    MaterialResponse addMaterialToCourse(UUID courseId, CreateMaterialRequest request);
    List<MaterialResponse> getMaterialsForCourse(UUID courseId);
    void deleteMaterial(UUID materialId);
    MaterialResponse updateMaterial(UUID materialId, com.dao.courseservice.request.UpdateMaterialRequest request);
    Map<String, String> uploadMaterialFile(UUID courseId, MultipartFile file);
}

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
class MaterialServiceImpl implements MaterialService {

    private final MaterialRepository materialRepository;
    private final CourseRepository courseRepository;
    private final MaterialMapper materialMapper;
    private final NotificationProducerService notificationService;
    private final com.dao.client.FileServiceClient fileServiceClient;

    @Override
    public MaterialResponse addMaterialToCourse(UUID courseId, CreateMaterialRequest request) {
        log.info("Adding material '{}' to course {}", request.getTitle(), courseId);

        Course course = courseRepository.findActiveById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));

        Material material = materialMapper.toEntity(request);
        material.setCourse(course);

        Material savedMaterial = materialRepository.save(material);
        log.info("Successfully added material with id {}", savedMaterial.getId());

        NotificationMessage msg = new NotificationMessage();
        
        // Gửi cho các sinh viên trong khóa học này (Consumer sẽ tự đi tìm sinh viên dựa vào tiền tố COURSE_)
        msg.setRecipientUserId("COURSE_" + courseId.toString());
        
        msg.setTitle("Học liệu mới!");
        // Lấy được luôn tên khóa học để thông báo thân thiện hơn
        msg.setContent("Giảng viên vừa tải lên tài liệu mới cho khóa học '" + course.getTitle() + "'. Vào xem ngay nhé!");
        msg.setType("INFO");
        msg.setSeverity("medium");

        // Đính kèm data để frontend làm nút "Bấm vào để xem tài liệu"
        Map<String, Object> extraData = new HashMap<>();
        extraData.put("courseId", courseId.toString());
        extraData.put("materialId", savedMaterial.getId().toString());
        msg.setData(extraData);

        notificationService.sendNotification(msg);

        return materialMapper.toMaterialResponse(savedMaterial);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MaterialResponse> getMaterialsForCourse(UUID courseId) {
        log.info("Fetching materials for course {}", courseId);

        return materialRepository.findByCourseIdOrderByDisplayOrderAsc(courseId).stream()
                .map(materialMapper::toMaterialResponse)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteMaterial(UUID materialId) {
        log.info("Deleting material with id: {}", materialId);

        Material material = materialRepository.findById(materialId)
                .orElseThrow(() -> new ResourceNotFoundException("Material", "id", materialId));

        materialRepository.delete(material);

        log.info("Successfully deleted material with id: {}", materialId);
    }

    @Override
    public MaterialResponse updateMaterial(UUID materialId, com.dao.courseservice.request.UpdateMaterialRequest request) {
        log.info("Updating material {}", materialId);

        Material material = materialRepository.findActiveById(materialId)
                .orElseThrow(() -> new ResourceNotFoundException("Material", "id", materialId));

        if (request.getTitle() != null) material.setTitle(request.getTitle());
        if (request.getType() != null) material.setType(request.getType());
        if (request.getStorageKey() != null) material.setStorageKey(request.getStorageKey());
        if (request.getContent() != null) material.setContent(request.getContent());
        if (request.getDisplayOrder() != null) material.setDisplayOrder(request.getDisplayOrder());

        Material saved = materialRepository.save(material);
        return materialMapper.toMaterialResponse(saved);
    }
    @Override
    public Map<String, String> uploadMaterialFile(UUID courseId, MultipartFile file) {
        log.info("Processing file upload for course: {}", courseId);

        // 1. Kiểm tra khóa học tồn tại
        courseRepository.findActiveById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be empty");
        }

        try {
            // 2. Gọi FileService để upload
            var response = fileServiceClient.uploadFile(file); 

            // Kiểm tra response có hợp lệ và có chứa data không
            if (response == null || response.getData() == null) {
                throw new RuntimeException("Upload failed: No response from storage service");
            }

            // KHAI BÁO publicUrl từ response data
            String publicUrl = response.getData(); 

            // 3. Trích xuất filename từ URL
            String filename = publicUrl.substring(publicUrl.lastIndexOf("/") + 1);
            
            return Map.of(
                "storageKey", publicUrl,
                "url", publicUrl,
                "filename", filename
            );
        } catch (Exception e) {
            log.error("Failed to upload material for course {}: {}", courseId, e.getMessage());
            throw new RuntimeException("Storage service error: " + e.getMessage());
        }
    }
}
