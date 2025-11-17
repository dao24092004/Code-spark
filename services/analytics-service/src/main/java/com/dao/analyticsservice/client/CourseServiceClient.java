package com.dao.analyticsservice.client;

import com.dao.analyticsservice.config.FeignClientConfig;
import com.dao.analyticsservice.dto.client.CourseSummaryDto;
import com.dao.analyticsservice.dto.client.PageResponse;
import com.dao.common.dto.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.UUID;

@FeignClient(name = "course-service", url = "${app.services.course-service.url:http://localhost:8080}", path = "/api/v1/courses", configuration = FeignClientConfig.class)
public interface CourseServiceClient {

    @GetMapping("/{courseId}")
    ApiResponse<CourseSummaryDto> getCourseById(@PathVariable UUID courseId);

    @GetMapping
    ApiResponse<PageResponse<CourseSummaryDto>> getCourses(@RequestParam(defaultValue = "0") int page,
                                                           @RequestParam(defaultValue = "10") int size);
}

