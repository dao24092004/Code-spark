package com.dao.examservice.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ExamNotificationMessage {
    private String recipientUserId;
    private String title;
    private String content;
    private String type;
    private String severity;
    private Map<String, Object> data;
    private Instant createdAt;

    public ExamNotificationMessage() {
        this.createdAt = Instant.now();
    }

    public static ExamNotificationMessageBuilder builder() {
        return new ExamNotificationMessageBuilder();
    }

    public static class ExamNotificationMessageBuilder {
        private String recipientUserId;
        private String title;
        private String content;
        private String type = "EXAM";
        private String severity = "NORMAL";
        private Map<String, Object> data;
        private Instant createdAt = Instant.now();

        public ExamNotificationMessageBuilder recipientUserId(String recipientUserId) {
            this.recipientUserId = recipientUserId;
            return this;
        }

        public ExamNotificationMessageBuilder title(String title) {
            this.title = title;
            return this;
        }

        public ExamNotificationMessageBuilder content(String content) {
            this.content = content;
            return this;
        }

        public ExamNotificationMessageBuilder type(String type) {
            this.type = type;
            return this;
        }

        public ExamNotificationMessageBuilder severity(String severity) {
            this.severity = severity;
            return this;
        }

        public ExamNotificationMessageBuilder data(Map<String, Object> data) {
            this.data = data;
            return this;
        }

        public ExamNotificationMessage build() {
            ExamNotificationMessage msg = new ExamNotificationMessage();
            msg.recipientUserId = this.recipientUserId;
            msg.title = this.title;
            msg.content = this.content;
            msg.type = this.type;
            msg.severity = this.severity;
            msg.data = this.data;
            msg.createdAt = this.createdAt;
            return msg;
        }
    }

    public String getRecipientUserId() { return recipientUserId; }
    public void setRecipientUserId(String recipientUserId) { this.recipientUserId = recipientUserId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    public Map<String, Object> getData() { return data; }
    public void setData(Map<String, Object> data) { this.data = data; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
