package com.dao.courseservice.mapper;

import com.dao.courseservice.entity.Course;
import com.dao.courseservice.request.CreateCourseRequest;
import com.dao.courseservice.request.UpdateCourseRequest;
import com.dao.courseservice.response.CourseResponse;
import org.springframework.stereotype.Component;

@Component
public class CourseMapper {

    private String normalizeVisibility(String value) {
        if (value == null) return "private";
        String v = value.trim().toLowerCase();
        // DB constraint chỉ chấp nhận 'public' hoặc 'private'
        if (v.equals("public") || v.equals("published")) {
            return "public";
        }
        return "private";
    }

    /**
     * Chuyển từ CreateCourseRequest sang Course entity
     */
    public Course toEntity(CreateCourseRequest request) {
        return Course.builder()
                .id(request.getId())
                .organizationId(request.getOrganizationId())        // ⭐ NEW
                .title(request.getTitle())
                .description(request.getDescription())
                .thumbnailUrl(request.getThumbnailUrl())
                .visibility(normalizeVisibility(request.getVisibility()))
                .build();
    }

    /**
     * Chuyển từ Course entity sang CourseResponse
     */
    public CourseResponse toCourseResponse(Course course) {
        return CourseResponse.builder()
                .id(course.getId())
                .organizationId(course.getOrganizationId())        // ⭐ NEW
                .title(course.getTitle())
                .slug(course.getSlug())
                .description(course.getDescription())
                .thumbnailUrl(course.getThumbnailUrl())
                .visibility(course.getVisibility())
                .createdAt(course.getCreatedAt())
                .updatedAt(course.getUpdatedAt())
                .build();
    }

    /**
     * Cập nhật Course entity từ UpdateCourseRequest
     */
    public void updateEntityFromRequest(Course course, UpdateCourseRequest request) {
        if (request.getTitle() != null) {
            course.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            course.setDescription(request.getDescription());
        }
        if (request.getThumbnailUrl() != null) {
            course.setThumbnailUrl(request.getThumbnailUrl());
        }
        if (request.getVisibility() != null) {
            course.setVisibility(normalizeVisibility(request.getVisibility()));
        }
        if (request.getOrganizationId() != null) {                 // ⭐ NEW
            course.setOrganizationId(request.getOrganizationId());
        }
    }
}
