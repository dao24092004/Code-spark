package com.dao.profileservice.client;

import com.dao.common.dto.ApiResponse;
import com.dao.profileservice.client.dto.RewardSummaryResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "reward-service", url = "${app.services.reward-service.url:http://localhost:9011}")
public interface RewardServiceClient {

    /**
     * Lấy tổng điểm thưởng của một user.
     * 
     * @param userId ID của người dùng
     * @return Tổng điểm thưởng
     */
    @GetMapping("/api/v1/rewards/{userId}/points")
    ApiResponse<Integer> getTotalPoints(@PathVariable("userId") Long userId);

    /**
     * Lấy thông tin tổng hợp phần thưởng của một user.
     * 
     * @param userId ID của người dùng
     * @return Thông tin tổng hợp phần thưởng
     */
    @GetMapping("/api/v1/rewards/{userId}/summary")
    ApiResponse<RewardSummaryResponse> getRewardSummary(@PathVariable("userId") Long userId);

    /**
     * Lấy danh sách badge của một user.
     * 
     * @param userId ID của người dùng
     * @return Danh sách badge
     */
    @GetMapping("/api/v1/rewards/{userId}/badges")
    ApiResponse<Object> getUserBadges(@PathVariable("userId") Long userId);

    /**
     * Lấy số bài thi đã vượt qua của một user.
     * 
     * @param userId ID của người dùng
     * @return Số bài thi đã vượt qua
     */
    @GetMapping("/api/v1/rewards/{userId}/exams-passed")
    ApiResponse<Integer> getExamsPassed(@PathVariable("userId") Long userId);
}
