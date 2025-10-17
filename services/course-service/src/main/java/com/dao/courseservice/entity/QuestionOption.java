package com.dao.courseservice.entity;

import jakarta.persistence.*;
// SỬA LẠI: Bỏ @Data, thêm @Getter và @Setter
import lombok.Getter;
import lombok.Setter;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Getter // Thêm @Getter
@Setter // Thêm @Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "cm_question_options")
public class QuestionOption {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(nullable = false)
    private boolean isCorrect;
}