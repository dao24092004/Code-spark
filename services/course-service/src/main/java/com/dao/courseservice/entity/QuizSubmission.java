package com.dao.courseservice.entity;

import io.hypersistence.utils.hibernate.type.json.JsonType; // <--- THÊM IMPORT NÀY
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Type; // <--- THÊM IMPORT NÀY

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.Map;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "cm_quiz_submissions")
public class QuizSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Mối quan hệ: Nhiều Submission thuộc về một Quiz
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;

    @Column(nullable = false)
    private Long studentId;

    private Integer score;

    @Type(JsonType.class) // <-- Báo cho Hibernate dùng bộ chuyển đổi JSON
    @Column(name = "answers", columnDefinition = "jsonb") // <-- Đảm bảo cột trong DB là jsonb
    private Map<UUID, List<UUID>> answers;

    @CreationTimestamp
    private LocalDateTime submittedAt;


}