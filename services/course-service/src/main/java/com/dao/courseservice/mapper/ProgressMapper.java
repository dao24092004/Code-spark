package com.dao.courseservice.mapper;

import com.dao.courseservice.entity.Progress;
import com.dao.courseservice.response.ProgressResponse;
import org.springframework.stereotype.Component;

@Component
public class ProgressMapper {

    /**
     * Chuyển từ Progress (entity) sang ProgressResponse (DTO).
     */
    public ProgressResponse toProgressResponse(Progress progress) {
        if (progress == null) {
            return null;
        }
        return ProgressResponse.builder()
                .id(progress.getId())
                .studentId(progress.getStudentId())
                .courseId(progress.getCourse().getId())
                .percentComplete(progress.getPercentComplete())
                .lastMaterialId(progress.getLastMaterial() != null ? progress.getLastMaterial().getId() : null)
                .updatedAt(progress.getUpdatedAt())
                .build();
    }
}