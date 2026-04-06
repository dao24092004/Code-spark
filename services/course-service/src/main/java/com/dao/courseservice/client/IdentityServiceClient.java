package com.dao.courseservice.client;

import com.dao.courseservice.response.UserDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;
import java.util.UUID;

@FeignClient(
    name = "identity-service",
    url = "${app.services.identity-service.url}"
)
public interface IdentityServiceClient {

    @GetMapping("/api/v1/users/{id}")
    UserDto getUserById(@PathVariable("id") UUID id);

    @PostMapping("/api/v1/users/batch")
    List<UserDto> getUsersByIds(@RequestBody List<UUID> ids);
}
