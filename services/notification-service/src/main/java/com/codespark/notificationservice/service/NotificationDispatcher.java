package com.codespark.notificationservice.service;

import com.codespark.notificationservice.dto.NotificationMessage;
import com.codespark.notificationservice.sse.SseEmitterRegistry;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Instant;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationDispatcher {

    private final SseEmitterRegistry registry;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public void dispatch(NotificationMessage message) {
        if (message.getCreatedAt() == null) {
            message.setCreatedAt(Instant.now());
        }
        String userId = message.getRecipientUserId();
        if (userId == null || userId.isBlank()) {
            log.warn("Skip dispatch: missing recipientUserId in message: {}", message);
            return;
        }
        Set<SseEmitter> emitters = registry.getEmitters(userId);
        if (emitters.isEmpty()) {
            log.debug("No active SSE connections for user {}. Message stored/dropped.", userId);
            // TODO: Optionally persist to DB for later retrieval
            return;
        }
        String payload;
        try {
            payload = objectMapper.writeValueAsString(message);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize notification message: {}", e.getMessage());
            return;
        }
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("notification")
                        .data(payload));
            } catch (IOException io) {
                log.warn("Emitter send failed for user {}. Removing emitter. Reason: {}", userId, io.getMessage());
                registry.remove(userId, emitter);
            }
        }
    }
}
