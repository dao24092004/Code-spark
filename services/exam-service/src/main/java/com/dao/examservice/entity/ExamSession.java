package com.dao.examservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "exam_sessions", indexes = {
    @Index(name = "idx_exam_sessions_exam", columnList = "exam_id"),
    @Index(name = "idx_exam_sessions_user", columnList = "user_id"),
    @Index(name = "idx_exam_sessions_status", columnList = "status"),
    @Index(name = "idx_exam_sessions_exam_user", columnList = "exam_id, user_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamSession {

    public enum SessionStatus { ACTIVE, COMPLETED, TERMINATED, ABANDONED }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "organization_id", columnDefinition = "uuid")
    private UUID organizationId;

    @Column(name = "user_id", columnDefinition = "uuid")
    private UUID userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_id")
    private QuizSubmission submission;

    @Column(name = "start_time", nullable = false)
    private Instant startTime;

    @Column(name = "end_time")
    private Instant endTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private SessionStatus status = SessionStatus.ACTIVE;

    @Column(name = "grace_period_minutes")
    @Builder.Default
    private Integer gracePeriodMinutes = 0;

    @Column(name = "violation_threshold_count")
    @Builder.Default
    private Integer violationThresholdCount = 3;

    @Column(name = "max_severity_level", length = 50)
    private String maxSeverityLevel;

    @Column(name = "high_severity_violation_count")
    private Integer highSeverityViolationCount;

    @Column(name = "is_auto_closed", nullable = false)
    @Builder.Default
    private Boolean isAutoClosed = false;

    @Column(name = "auto_fail_reason", length = 100)
    private String autoFailReason;

    @Column(name = "review_notes", columnDefinition = "TEXT")
    private String reviewNotes;

    @Column(name = "reviewer_id", columnDefinition = "uuid")
    private UUID reviewerId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @Builder.Default
    private List<ProctoringEvent> proctoringEvents = new ArrayList<>();

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @Builder.Default
    private List<MediaCapture> mediaCaptures = new ArrayList<>();
}
