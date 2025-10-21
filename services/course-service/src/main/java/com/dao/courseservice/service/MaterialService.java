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

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

//================================================================================
// 1. INTERFACE
//================================================================================

public interface MaterialService {
    MaterialResponse addMaterialToCourse(UUID courseId, CreateMaterialRequest request);
    List<MaterialResponse> getMaterialsForCourse(UUID courseId);
    void deleteMaterial(UUID materialId);
}

//================================================================================
// 2. IMPLEMENTATION
//================================================================================

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
class MaterialServiceImpl implements MaterialService {

    private final MaterialRepository materialRepository;
    private final CourseRepository courseRepository;
    private final MaterialMapper materialMapper; // ✅ Đã thay CourseMapper → MaterialMapper

    @Override
    public MaterialResponse addMaterialToCourse(UUID courseId, CreateMaterialRequest request) {
        log.info("Adding material '{}' to course {}", request.getTitle(), courseId);

        // 1. Kiểm tra khóa học tồn tại
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));

        // 2. Tạo entity từ request
        Material material = materialMapper.toEntity(request);
        material.setCourse(course);

        // 3. Lưu vào DB
        Material savedMaterial = materialRepository.save(material);
        log.info("Successfully added material with id {}", savedMaterial.getId());

        // 4. Trả về response
        return materialMapper.toMaterialResponse(savedMaterial);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MaterialResponse> getMaterialsForCourse(UUID courseId) {
        log.info("Fetching materials for course {}", courseId);

        if (!courseRepository.existsById(courseId)) {
            throw new ResourceNotFoundException("Course", "id", courseId);
        }

        return materialRepository.findByCourseIdOrderByDisplayOrderAsc(courseId).stream()
                .map(materialMapper::toMaterialResponse)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteMaterial(UUID materialId) {
        log.info("Deleting material with id: {}", materialId);

        if (!materialRepository.existsById(materialId)) {
            throw new ResourceNotFoundException("Material", "id", materialId);
        }

        materialRepository.deleteById(materialId);
        log.info("Successfully deleted material with id: {}", materialId);
    }
}
