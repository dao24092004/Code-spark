package com.dao.profileservice.messaging;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ProfileEventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void sendProfileCreatedEvent(Long userId, Long profileId) {
        ProfileCreatedEvent event = ProfileCreatedEvent.builder()
                .userId(userId)
                .profileId(profileId)
                .timestamp(System.currentTimeMillis())
                .build();

        kafkaTemplate.send("profile.created", userId.toString(), event);
        log.info("Sent profile created event for user: {}, profile: {}", userId, profileId);
    }

    public void sendProfileUpdatedEvent(Long userId, Long profileId) {
        ProfileUpdatedEvent event = ProfileUpdatedEvent.builder()
                .userId(userId)
                .profileId(profileId)
                .timestamp(System.currentTimeMillis())
                .build();

        kafkaTemplate.send("profile.updated", userId.toString(), event);
        log.info("Sent profile updated event for user: {}, profile: {}", userId, profileId);
    }

    public void sendUserFileProcessingRequest(Long userId, String operation, Object data) {
        UserFileProcessingEvent event = UserFileProcessingEvent.builder()
                .userId(userId)
                .operation(operation)
                .data(data)
                .timestamp(System.currentTimeMillis())
                .build();

        kafkaTemplate.send("user.file.processing", userId.toString(), event);
        log.info("Sent user file processing request for user: {}, operation: {}", userId, operation);
    }
}