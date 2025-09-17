package com.dao.profileservice.client;

import com.dao.profileservice.dto.UserDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "identity-service", path = "/api/v1/users")
public interface IdentityServiceClient {

    @GetMapping("/{userId}")
    UserDto getUserById(@PathVariable("userId") Long userId);

    @GetMapping("/{userId}/profile")
    UserDto getUserProfile(@PathVariable("userId") Long userId);
}