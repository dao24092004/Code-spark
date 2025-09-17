package com.codespark.notificationservice.kafka;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class KafkaConsumer {

    private static final Logger LOGGER = LoggerFactory.getLogger(KafkaConsumer.class);

    @KafkaListener(topics = "user-registration", groupId = "notification-group")
    public void consume(String message) {
        LOGGER.info(String.format("Received message -> %s", message));
        // Add logic here to send notification to user
    }
}
