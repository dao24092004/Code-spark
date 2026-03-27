package com.dao.examservice.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "media_captures", indexes = {
    @Index(name = "idx_media_captures_session", columnList = "session_id"),
    @Index(name = "idx_media_captures_type", columnList = "capture_type"),
    @Index(name = "idx_media_captures_timestamp", columnList = "timestamp")
})
public class MediaCapture {

    public enum CaptureType { SCREENSHOT, WEBCAM_FRAME, AUDIO_CLIP, VIDEO_CLIP }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private ExamSession session;

    @Enumerated(EnumType.STRING)
    @Column(name = "capture_type", nullable = false, length = 50)
    private CaptureType captureType;

    @Column(name = "capture_url", columnDefinition = "TEXT", nullable = false)
    private String captureUrl;

    @Column(name = "thumbnail_url", columnDefinition = "TEXT")
    private String thumbnailUrl;

    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @Column(nullable = false)
    private Instant timestamp;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public MediaCapture() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public ExamSession getSession() { return session; }
    public void setSession(ExamSession session) { this.session = session; }

    public CaptureType getCaptureType() { return captureType; }
    public void setCaptureType(CaptureType captureType) { this.captureType = captureType; }

    public String getCaptureUrl() { return captureUrl; }
    public void setCaptureUrl(String captureUrl) { this.captureUrl = captureUrl; }

    public String getThumbnailUrl() { return thumbnailUrl; }
    public void setThumbnailUrl(String thumbnailUrl) { this.thumbnailUrl = thumbnailUrl; }

    public Integer getDurationSeconds() { return durationSeconds; }
    public void setDurationSeconds(Integer durationSeconds) { this.durationSeconds = durationSeconds; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
