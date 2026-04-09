package com.dao.common.notification;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class NotificationProducerService {

    private static final Logger LOGGER = LoggerFactory.getLogger(NotificationProducerService.class);
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private static final String TOPIC = "notifications";

    // Khởi tạo (Constructor)
    public NotificationProducerService(KafkaTemplate<String, String> kafkaTemplate, ObjectMapper objectMapper) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    // Hàm gửi thông báo
    public void sendNotification(NotificationMessage message) {
        if (message.getCreatedAt() == null) {
            message.setCreatedAt(Instant.now());
        }
        try {
            String payload = objectMapper.writeValueAsString(message);
            kafkaTemplate.send(TOPIC, payload);
            LOGGER.info("Gửi thông báo thành công cho user: {}", message.getRecipientUserId());
        } catch (JsonProcessingException e) {
            LOGGER.error("Lỗi khi chuyển đổi JSON: {}", e.getMessage());
        }
    }
}