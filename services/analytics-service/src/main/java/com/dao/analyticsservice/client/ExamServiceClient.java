package com.dao.analyticsservice.client;

import com.dao.analyticsservice.config.FeignClientConfig;
import com.dao.analyticsservice.dto.client.ExamSummaryDto;
import com.dao.common.dto.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;
import java.util.UUID;

@FeignClient(name = "exam-service", url = "${app.services.exam-service.url:http://localhost:8080}", path = "/exam/exams", configuration = FeignClientConfig.class)
public interface ExamServiceClient {

    @GetMapping("/{id}")
    ApiResponse<ExamSummaryDto> getExamById(@PathVariable UUID id);

    @GetMapping
    ApiResponse<List<ExamSummaryDto>> getAllExams();
}
