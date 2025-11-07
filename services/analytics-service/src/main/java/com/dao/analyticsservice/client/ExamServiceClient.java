package com.dao.analyticsservice.client;

import com.dao.analyticsservice.dto.client.ExamSummaryDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@FeignClient(name = "exam-service", path = "/exams")
public interface ExamServiceClient {

    @GetMapping("/{examId}")
    ExamSummaryDto getExamById(@PathVariable("examId") UUID examId);

    @GetMapping("/schedules")
    List<ExamSummaryDto> getExamSchedules(@RequestParam(value = "start", required = false) Instant start,
                                          @RequestParam(value = "end", required = false) Instant end);
}

