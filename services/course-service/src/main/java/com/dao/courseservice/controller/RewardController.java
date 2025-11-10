package com.dao.courseservice.controller;

import com.dao.common.dto.ApiResponse;
import com.dao.courseservice.response.RewardResponse;
import com.dao.courseservice.service.RewardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/rewards")
@RequiredArgsConstructor
public class RewardController {

    private final RewardService rewardService;

    /**
     * API để lấy lịch sử phần thưởng của một học sinh.
     * Chỉ người dùng đó hoặc admin mới có quyền xem.
     * @param studentId ID của học sinh.
     */
    @GetMapping("/student/{studentId}")
    // Giả sử trong token có claim 'sub' là user id
    @PreAuthorize("hasAuthority('COURSE_READ') or #studentId == authentication.principal.claims['sub']")
    public ResponseEntity<ApiResponse<List<RewardResponse>>> getRewardsForStudent(@PathVariable Long studentId) {
        List<RewardResponse> rewards = rewardService.getRewardsForStudent(studentId);
        return ResponseEntity.ok(ApiResponse.success(rewards));
    }
}