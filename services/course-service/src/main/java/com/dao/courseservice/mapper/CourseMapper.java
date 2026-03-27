package com.dao.courseservice.mapper;

import com.dao.courseservice.entity.Course;
import com.dao.courseservice.request.CreateCourseRequest;
import com.dao.courseservice.request.UpdateCourseRequest;
import com.dao.courseservice.response.CourseResponse;
import org.springframework.stereotype.Component;

@Component
public class CourseMapper {

    public Course toEntity(CreateCourseRequest request) {
        return Course.builder()
                .id(request.getId())
                .organizationId(request.getOrganizationId())
                .title(request.getTitle())
                .description(request.getDescription())
                .thumbnailUrl(request.getThumbnailUrl())
                .visibility(request.getVisibility() != null ? request.getVisibility() : "private")
                .build();
    }

    public CourseResponse toCourseResponse(Course course) {
        return CourseResponse.builder()
                .id(course.getId())
                .createdBy(course.getCreatedBy())
                .organizationId(course.getOrganizationId())
                .title(course.getTitle())
                .slug(course.getSlug())
                .description(course.getDescription())
                .thumbnailUrl(course.getThumbnailUrl())
                .language(course.getLanguage())
                .durationMinutes(course.getDurationMinutes())
                .level(course.getLevel())
                .visibility(course.getVisibility())
                .createdAt(course.getCreatedAt())
                .updatedAt(course.getUpdatedAt())
                .build();
    }

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
            course.setVisibility(request.getVisibility());
        }
        if (request.getOrganizationId() != null) {
            course.setOrganizationId(request.getOrganizationId());
        }
    }
}
