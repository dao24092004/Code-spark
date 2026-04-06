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

public interface MaterialService {
    MaterialResponse addMaterialToCourse(UUID courseId, CreateMaterialRequest request);
    List<MaterialResponse> getMaterialsForCourse(UUID courseId);
    void deleteMaterial(UUID materialId);
    MaterialResponse updateMaterial(UUID materialId, com.dao.courseservice.request.UpdateMaterialRequest request);
}

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
class MaterialServiceImpl implements MaterialService {

    private final MaterialRepository materialRepository;
    private final CourseRepository courseRepository;
    private final MaterialMapper materialMapper;

    @Override
    public MaterialResponse addMaterialToCourse(UUID courseId, CreateMaterialRequest request) {
        log.info("Adding material '{}' to course {}", request.getTitle(), courseId);

        Course course = courseRepository.findActiveById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));

        Material material = materialMapper.toEntity(request);
        material.setCourse(course);

        Material savedMaterial = materialRepository.save(material);
        log.info("Successfully added material with id {}", savedMaterial.getId());

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
}
