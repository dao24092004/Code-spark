package com.codespark.notificationservice.kafka;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.codespark.notificationservice.dto.NotificationMessage;
import com.codespark.notificationservice.service.NotificationDispatcher;

@Component
public class KafkaConsumer {

    private static final Logger LOGGER = LoggerFactory.getLogger(KafkaConsumer.class);
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final NotificationDispatcher dispatcher;

    public KafkaConsumer(NotificationDispatcher dispatcher) {
        this.dispatcher = dispatcher;
    }

    @KafkaListener(topics = "user-registration", groupId = "notification-group")
    public void consume(String message) {
        LOGGER.info(String.format("Received message on topic user-registration -> %s", message));
        handleMessage(message);
    }

    @KafkaListener(topics = "notifications", groupId = "notification-group")
    public void consumeGeneral(String message) {
        LOGGER.info(String.format("Received message on topic notifications -> %s", message));
        handleMessage(message);
    }

    private void handleMessage(String raw) {
        try {
            NotificationMessage msg = objectMapper.readValue(raw, NotificationMessage.class);
            if (msg.getRecipientUserId() == null || msg.getRecipientUserId().isBlank()) {
                LOGGER.warn("Notification missing recipientUserId. Dropping. Payload: {}", raw);
                return;
            }
            dispatcher.dispatch(msg);
        } catch (Exception e) {
            LOGGER.error("Failed to process notification payload: {} - error: {}", raw, e.getMessage());
        }
    }
}
