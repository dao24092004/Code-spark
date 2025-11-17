package com.dao.analyticsservice.client;

import com.dao.analyticsservice.config.FeignClientConfig;
import com.dao.analyticsservice.dto.client.ProctoringEventDto;
import com.dao.common.dto.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.UUID;

@FeignClient(name = "proctoring-service", url = "${app.services.proctoring-service.url:http://localhost:8080}", path = "/api/proctoring", configuration = FeignClientConfig.class)
public interface ProctoringServiceClient {

    @GetMapping("/events")
    ApiResponse<List<ProctoringEventDto>> getEventsByExamId(@RequestParam UUID examId);
    
    @GetMapping("/events")
    ApiResponse<List<ProctoringEventDto>> getEventsByUserId(@RequestParam UUID userId);
}
