package com.dao.analyticsservice.client;

import com.dao.analyticsservice.dto.client.CourseSummaryDto;
import com.dao.analyticsservice.dto.client.PageResponse;
import com.dao.common.dto.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.UUID;

@FeignClient(name = "course-service", path = "/api/courses")
public interface CourseServiceClient {

    @GetMapping("/{courseId}")
    ApiResponse<CourseSummaryDto> getCourseById(@PathVariable("courseId") UUID courseId);

    @GetMapping
    ApiResponse<PageResponse<CourseSummaryDto>> getCourses(@RequestParam(value = "page", defaultValue = "0") int page,
                                                           @RequestParam(value = "size", defaultValue = "10") int size);
}

