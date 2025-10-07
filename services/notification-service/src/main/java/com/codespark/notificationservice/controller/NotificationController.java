package com.codespark.notificationservice.controller;

import com.codespark.notificationservice.client.IdentityServiceClient;
import com.codespark.notificationservice.dto.ApiResponse;
import com.codespark.notificationservice.sse.SseEmitterRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

    private final IdentityServiceClient identityClient;
    private final SseEmitterRegistry registry;

    private static final String PERM_NOTIFICATION_STREAM = "NOTIFICATION.STREAM";

    /**
     * Tạo kết nối Server-Sent Events (SSE) để nhận thông báo real-time.
     *
     * @param headers Headers của request, chứa token xác thực.
     * @return ResponseEntity chứa SseEmitter để client đăng ký nhận sự kiện.
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseEntity<SseEmitter> stream(@RequestHeader HttpHeaders headers) {
        String authHeader = headers.getFirst(HttpHeaders.AUTHORIZATION);
        if (!StringUtils.hasText(authHeader) || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String token = authHeader.substring(7);
        try {
            ApiResponse<Map<String, Object>> res = identityClient.validateToken(token);
            if (res == null || !res.isSuccess() || res.getData() == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            Object userIdObj = res.getData().get("userId");
            if (userIdObj == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            // Enforce permission to open notification stream
            ApiResponse<Boolean> perm = identityClient.checkPermission(token, PERM_NOTIFICATION_STREAM);
            if (perm == null || !Boolean.TRUE.equals(perm.getData())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            String userId = String.valueOf(userIdObj);
            SseEmitter emitter = registry.register(userId);
            return ResponseEntity.ok(emitter);
        } catch (Exception e) {
            log.error("SSE auth failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }
}
