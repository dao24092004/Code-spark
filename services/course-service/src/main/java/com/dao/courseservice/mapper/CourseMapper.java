package com.dao.courseservice.mapper;

import com.dao.courseservice.entity.Course;
import com.dao.courseservice.request.CreateCourseRequest;
import com.dao.courseservice.request.UpdateCourseRequest;
import com.dao.courseservice.response.CourseResponse;
import org.springframework.stereotype.Component;

/**
 * Lớp này chịu trách nhiệm chuyển đổi dữ liệu giữa các lớp DTO và Entity.
 * Nó giúp tách biệt các tầng của ứng dụng một cách rõ ràng.
 */
@Component // Đánh dấu là một Spring Bean để có thể inject vào các lớp khác
public class CourseMapper {

    /**
     * Chuyển từ CreateCourseRequest (dữ liệu đầu vào) sang Course (entity để lưu vào DB).
     */
    public Course toEntity(CreateCourseRequest request) {
        // Dùng builder của Lombok để tạo đối tượng một cách an toàn và sạch sẽ
        return Course.builder()
                .id(request.getId())
                .instructorId(request.getInstructorId())
                .title(request.getTitle())
                .description(request.getDescription())
                .thumbnailUrl(request.getThumbnailUrl())
                // Đặt giá trị mặc định nếu client không cung cấp
                .visibility(request.getVisibility() != null ? request.getVisibility() : "private")
                .build();
    }

    /**
     * Chuyển từ Course (entity từ DB) sang CourseResponse (dữ liệu trả về cho client).
     */
    public CourseResponse toCourseResponse(Course course) {
        // Dùng builder để tạo đối tượng response
        return CourseResponse.builder()
                .id(course.getId())
                .instructorId(course.getInstructorId())
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
     * Cập nhật một entity 'Course' đã có từ dữ liệu trong 'UpdateCourseRequest'.
     * Phương thức này chỉ cập nhật những trường có giá trị, tránh ghi đè dữ liệu bằng null.
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
            course.setVisibility(request.getVisibility());
        }
    }
}