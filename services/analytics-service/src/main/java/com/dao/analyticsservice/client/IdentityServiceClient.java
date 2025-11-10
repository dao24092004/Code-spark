package com.dao.analyticsservice.client;

import com.dao.analyticsservice.dto.client.UserSummaryDto;
import com.dao.common.dto.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@FeignClient(name = "identity-service", path = "/api/v1/users")
public interface IdentityServiceClient {

    @GetMapping("/{userId}")
    ApiResponse<UserSummaryDto> getUserById(@PathVariable("userId") Long userId);

    @GetMapping
    ApiResponse<List<UserSummaryDto>> getAllUsers();
}

