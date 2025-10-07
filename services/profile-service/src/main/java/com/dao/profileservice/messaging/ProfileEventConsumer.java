package com.dao.profileservice.messaging;

import com.dao.profileservice.dto.ProfileDto;
import com.dao.profileservice.messaging.dto.UserRegisteredEvent;
import com.dao.profileservice.service.ProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ProfileEventConsumer {

    private final ProfileService profileService;

    @KafkaListener(topics = "user.registered", groupId = "profile-service-group")
    public void handleUserRegistered(@Payload UserRegisteredEvent userRegisteredEvent,
                                     @Header(KafkaHeaders.RECEIVED_KEY) String key) {
        log.info("Received user registered event with key: {}, payload: {}", key, userRegisteredEvent);
        try {
            ProfileDto profileDto = new ProfileDto();
            profileDto.setUserId(userRegisteredEvent.getUserId());
            profileDto.setFirstName(userRegisteredEvent.getFirstName());
            profileDto.setLastName(userRegisteredEvent.getLastName());
            profileDto.setEmail(userRegisteredEvent.getEmail());
            profileService.createProfile(profileDto);
        } catch (Exception e) {
            log.error("Failed to create profile for user: {}. Reason: {}", userRegisteredEvent.getUserId(), e.getMessage());
        }
    }

    @KafkaListener(topics = "user.updated", groupId = "profile-service-group")
    public void handleUserUpdated(@Payload Object userUpdatedEvent,
                                 @Header(KafkaHeaders.RECEIVED_KEY) String key) {
        log.info("Received user updated event with key: {}, payload: {}", key, userUpdatedEvent);
    }

    @KafkaListener(topics = "file.processed", groupId = "profile-service-group")
    public void handleFileProcessed(@Payload Object fileProcessedEvent,
                                   @Header(KafkaHeaders.RECEIVED_KEY) String key) {
        log.info("Received file processed event with key: {}, payload: {}", key, fileProcessedEvent);
    }
}