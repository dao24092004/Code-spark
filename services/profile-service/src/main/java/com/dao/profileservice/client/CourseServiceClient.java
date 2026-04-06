package com.dao.profileservice.client;

import com.dao.common.dto.ApiResponse;
import com.dao.profileservice.client.dto.CourseInfoResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;
import java.util.UUID;

@FeignClient(name = "course-service", url = "${app.services.course-service.url:http://localhost:9001}")
public interface CourseServiceClient {

    /**
     * Lấy danh sách khóa học đã hoàn thành của một user.
     * 
     * @param userId ID của người dùng
     * @return Danh sách thông tin khóa học đã hoàn thành
     */
    @GetMapping("/api/v1/courses/completed/{userId}")
    ApiResponse<List<CourseInfoResponse>> getCompletedCourses(@PathVariable("userId") Long userId);

    /**
     * Lấy danh sách khóa học đang học của một user.
     * 
     * @param userId ID của người dùng
     * @return Danh sách thông tin khóa học đang học
     */
    @GetMapping("/api/v1/courses/enrolled/{userId}")
    ApiResponse<List<CourseInfoResponse>> getEnrolledCourses(@PathVariable("userId") Long userId);

    /**
     * Lấy thông tin chi tiết một khóa học.
     * 
     * @param courseId ID của khóa học
     * @return Thông tin khóa học
     */
    @GetMapping("/api/v1/courses/{courseId}")
    ApiResponse<CourseInfoResponse> getCourseById(@PathVariable("courseId") UUID courseId);
}
