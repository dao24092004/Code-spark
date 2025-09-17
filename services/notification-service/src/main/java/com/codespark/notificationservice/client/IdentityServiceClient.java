package com.codespark.notificationservice.client;

import com.codespark.notificationservice.dto.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.Map;
import java.util.Set;

@FeignClient(name = "identity-service", path = "/api/v1/inter-service")
public interface IdentityServiceClient {

    @PostMapping("/validate-token")
    ApiResponse<Map<String, Object>> validateToken(@RequestParam("token") String token);

    @PostMapping("/check-permission")
    ApiResponse<Boolean> checkPermission(@RequestParam("token") String token,
                                         @RequestParam("permission") String permission);

    @PostMapping("/check-role")
    ApiResponse<Boolean> checkRole(@RequestParam("token") String token,
                                   @RequestParam("role") String role);

    @PostMapping("/check-any-permission")
    ApiResponse<Boolean> checkAnyPermission(@RequestParam("token") String token,
                                            @RequestBody Set<String> permissions);

    @PostMapping("/check-any-role")
    ApiResponse<Boolean> checkAnyRole(@RequestParam("token") String token,
                                      @RequestBody Set<String> roles);
}
