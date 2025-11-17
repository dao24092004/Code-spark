package com.dao.analyticsservice.client;

import com.dao.analyticsservice.config.FeignClientConfig;
import com.dao.analyticsservice.dto.client.UserSummaryDto;
import com.dao.common.dto.ApiResponse;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "identity-service", url = "${app.services.identity-service.url:http://localhost:8080}", path = "/identity/api/v1/users", configuration = FeignClientConfig.class)
public interface IdentityServiceClient {

    @GetMapping
    ApiResponse<com.dao.analyticsservice.dto.client.PageResponse<UserSummaryDto>> getAllUsers();

    @GetMapping("/{id}")
    ApiResponse<UserSummaryDto> getUserById(@PathVariable Long id);
}
