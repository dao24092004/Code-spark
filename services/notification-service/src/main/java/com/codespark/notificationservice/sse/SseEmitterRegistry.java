package com.codespark.notificationservice.sse;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Duration;
import java.util.Collections;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class SseEmitterRegistry {
    private static final long DEFAULT_TIMEOUT_MS = Duration.ofHours(6).toMillis();

    private final ConcurrentHashMap<String, Set<SseEmitter>> userEmitters = new ConcurrentHashMap<>();

    public SseEmitter register(String userId) {
        SseEmitter emitter = new SseEmitter(DEFAULT_TIMEOUT_MS);
        Set<SseEmitter> emitters = userEmitters.computeIfAbsent(userId, k -> Collections.newSetFromMap(new ConcurrentHashMap<>()));
        emitters.add(emitter);

        emitter.onCompletion(() -> remove(userId, emitter));
        emitter.onTimeout(() -> remove(userId, emitter));
        emitter.onError(e -> remove(userId, emitter));

        try {
            emitter.send(SseEmitter.event().name("connected").data("connected"));
        } catch (IOException ignored) {}

        return emitter;
    }

    public void remove(String userId, SseEmitter emitter) {
        Set<SseEmitter> emitters = userEmitters.get(userId);
        if (emitters != null) {
            emitters.remove(emitter);
            if (emitters.isEmpty()) {
                userEmitters.remove(userId);
            }
        }
    }

    public Set<SseEmitter> getEmitters(String userId) {
        return userEmitters.getOrDefault(userId, Collections.emptySet());
    }
}
