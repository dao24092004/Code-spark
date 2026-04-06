package com.dao.examservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "question_tags", indexes = {
    @Index(name = "idx_question_tags_question", columnList = "question_id")
}, uniqueConstraints = {
    @UniqueConstraint(name = "uk_question_tags_question_tag", columnNames = {"question_id", "tag"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionTag {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(nullable = false, length = 100)
    private String tag;
}
