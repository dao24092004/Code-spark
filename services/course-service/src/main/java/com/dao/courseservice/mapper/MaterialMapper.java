package com.dao.courseservice.mapper;

import com.dao.courseservice.entity.Material;
import com.dao.courseservice.request.CreateMaterialRequest;
import com.dao.courseservice.request.UpdateMaterialRequest;
import com.dao.courseservice.response.MaterialResponse;
import org.springframework.stereotype.Component;

/**
 * Lớp này CHỈ chịu trách nhiệm chuyển đổi dữ liệu cho entity Material.
 * Giúp tuân thủ nguyên tắc Single Responsibility (Đơn trách nhiệm).
 */
@Component
public class MaterialMapper {

    /**
     * Chuyển từ CreateMaterialRequest (dữ liệu đầu vào) sang Material (entity để lưu vào DB).
     */
    public Material toEntity(CreateMaterialRequest request) {
        return Material.builder()
                .title(request.getTitle())
                .type(request.getType())
                .storageKey(request.getStorageKey())
                .content(request.getContent())
                .displayOrder(request.getDisplayOrder())
                .build();
    }

    /**
     * Chuyển từ Material (entity từ DB) sang MaterialResponse (dữ liệu trả về cho client).
     */
    public MaterialResponse toMaterialResponse(Material material) {
        return MaterialResponse.builder()
                .id(material.getId())
                .title(material.getTitle())
                .type(material.getType())
                .storageKey(material.getStorageKey())
                .content(material.getContent())
                .displayOrder(material.getDisplayOrder())
                .createdAt(material.getCreatedAt())
                .build();
    }

    /**
     * Áp dụng các thay đổi từ UpdateMaterialRequest lên entity Material hiện tại.
     * Chỉ cập nhật những trường không null trong request.
     */
    public void updateEntity(Material material, UpdateMaterialRequest request) {
        if (request.getTitle() != null) {
            material.setTitle(request.getTitle());
        }
        if (request.getType() != null) {
            material.setType(request.getType());
        }
        if (request.getStorageKey() != null) {
            material.setStorageKey(request.getStorageKey());
        }
        if (request.getContent() != null) {
            material.setContent(request.getContent());
        }
        if (request.getDisplayOrder() != null) {
            material.setDisplayOrder(request.getDisplayOrder());
        }
    }
}