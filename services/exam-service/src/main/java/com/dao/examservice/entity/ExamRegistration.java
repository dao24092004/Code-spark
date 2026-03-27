package com.dao.examservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "cm_exam_registrations", indexes = {
    @Index(name = "idx_cm_exam_registrations_exam", columnList = "exam_id"),
    @Index(name = "idx_cm_exam_registrations_user", columnList = "user_id"),
    @Index(name = "idx_cm_exam_registrations_status", columnList = "status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamRegistration {

    public enum RegistrationStatus { SCHEDULED, REGISTERED, CANCELLED }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", referencedColumnName = "id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_cm_exam_registrations_exams"))
    private Exam exam;

    @Column(name = "user_id", columnDefinition = "uuid")
    private UUID userId;

    @CreationTimestamp
    @Column(name = "registered_at", nullable = false, updatable = false)
    private Instant registeredAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private RegistrationStatus status = RegistrationStatus.SCHEDULED;
}
