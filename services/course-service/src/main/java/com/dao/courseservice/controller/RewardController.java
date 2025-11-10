package com.dao.courseservice.controller;

import com.dao.common.dto.ApiResponse;
import com.dao.courseservice.request.GrantRewardRequest;
import com.dao.courseservice.response.RewardResponse;
import com.dao.courseservice.service.RewardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

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

    /**
     * API để cấp thưởng thủ công cho học sinh.
     * Chỉ admin hoặc giáo viên có quyền phù hợp mới được thực hiện.
     */
    @PostMapping("/grant")
    @PreAuthorize("hasAuthority('REWARD_WRITE')")
    public ResponseEntity<ApiResponse<RewardResponse>> grantReward(
            @Valid @RequestBody GrantRewardRequest request
    ) {
        RewardResponse reward = rewardService.grantReward(
                request.getStudentId(),
                request.getTokens(),
                request.getReasonCode(),
                request.getRelatedId()
        );

        return ResponseEntity.ok(ApiResponse.success("Reward granted successfully", reward));
    }
}