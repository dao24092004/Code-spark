package com.dao.examservice.service;

import com.dao.examservice.dto.ExamNotificationMessage;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    private static final String NOTIFICATION_TOPIC = "notifications";

    public void sendNotification(ExamNotificationMessage message) {
        try {
            String messageJson = objectMapper.writeValueAsString(message);
            kafkaTemplate.send(NOTIFICATION_TOPIC, message.getRecipientUserId(), messageJson);
            log.info("Notification sent to user {}: {}", message.getRecipientUserId(), message.getTitle());
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize notification message", e);
        }
    }

    public void sendExamResultNotification(UUID userId, String examTitle, int score, boolean passed) {
        String content = passed
            ? String.format("Chúc mừng! Bạn đã đạt %d điểm trong kỳ thi \"%s\"", score, examTitle)
            : String.format("Bạn đạt %d điểm trong kỳ thi \"%s\". Hãy cố gắng lần sau!", score, examTitle);

        Map<String, Object> data = new HashMap<>();
        data.put("examTitle", examTitle);
        data.put("score", score);
        data.put("passed", passed);

        ExamNotificationMessage message = ExamNotificationMessage.builder()
            .recipientUserId(String.valueOf(userId))
            .title("Kết quả thi")
            .content(content)
            .type("EXAM_RESULT")
            .severity(passed ? "NORMAL" : "LOW")
            .data(data)
            .build();

        sendNotification(message);
    }

    public void sendExamScheduledNotification(UUID userId, String examTitle, String startAt) {
        Map<String, Object> data = new HashMap<>();
        data.put("examTitle", examTitle);
        data.put("startAt", startAt);

        ExamNotificationMessage message = ExamNotificationMessage.builder()
            .recipientUserId(String.valueOf(userId))
            .title("Lịch thi mới")
            .content(String.format("Bạn có lịch thi \"%s\" vào lúc %s", examTitle, startAt))
            .type("EXAM_SCHEDULED")
            .severity("HIGH")
            .data(data)
            .build();

        sendNotification(message);
    }
}
