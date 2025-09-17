package com.dao.fileservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.Map;
import java.util.Set;
import com.dao.fileservice.dto.ApiResponse;

@FeignClient(name = "identity-service", path = "/api/v1/inter-service")
public interface IdentityAuthClient {

    @PostMapping("/validate-token")
    ApiResponse<Map<String, Object>> validateToken(@RequestParam("token") String token);

    @PostMapping("/check-permission")
    ApiResponse<Boolean> checkPermission(@RequestParam("token") String token,
                                        @RequestParam("permission") String permission);

    @PostMapping("/check-any-permission")
    ApiResponse<Boolean> checkAnyPermission(@RequestParam("token") String token,
                                           @RequestBody Set<String> permissions);
}
