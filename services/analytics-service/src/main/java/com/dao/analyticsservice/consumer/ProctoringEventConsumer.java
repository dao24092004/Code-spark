package com.dao.analyticsservice.consumer;

import com.dao.analyticsservice.entity.ProctoringEvent;
import com.dao.analyticsservice.repository.ProctoringEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Kafka Consumer để nhận ProctoringEvent từ proctoring-service.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ProctoringEventConsumer {

    private final ProctoringEventRepository proctoringEventRepository;

    @KafkaListener(topics = "${kafka.topic.proctoring-events:proctoring-events}", groupId = "${spring.kafka.consumer.group-id:analytics-service}")
    public void consumeProctoringEvent(ProctoringEventMessage message) {
        log.info("Received proctoring event: examId={}, submissionId={}, eventType={}",
                message.getExamId(), message.getSubmissionId(), message.getEventType());

        try {
            ProctoringEvent event = new ProctoringEvent();
            event.setExamId(message.getExamId());
            event.setSubmissionId(message.getSubmissionId());
            event.setEventType(message.getEventType());
            event.setEventData(message.getEventData());
            event.setCreatedAt(message.getCreatedAt() != null ? message.getCreatedAt() : LocalDateTime.now());

            proctoringEventRepository.save(event);
            log.info("Saved proctoring event to analytics database");
        } catch (Exception e) {
            log.error("Error saving proctoring event: {}", e.getMessage(), e);
        }
    }

    /**
     * Inner class cho message từ Kafka.
     */
    public static class ProctoringEventMessage {
        private String eventType;
        private String eventData;
        private java.util.UUID examId;
        private java.util.UUID submissionId;
        private LocalDateTime createdAt;

        public String getEventType() { return eventType; }
        public void setEventType(String eventType) { this.eventType = eventType; }
        public String getEventData() { return eventData; }
        public void setEventData(String eventData) { this.eventData = eventData; }
        public java.util.UUID getExamId() { return examId; }
        public void setExamId(java.util.UUID examId) { this.examId = examId; }
        public java.util.UUID getSubmissionId() { return submissionId; }
        public void setSubmissionId(java.util.UUID submissionId) { this.submissionId = submissionId; }
        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    }
}
