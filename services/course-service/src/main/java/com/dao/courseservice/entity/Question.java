package com.dao.courseservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import java.util.Set;
import java.util.UUID;

import lombok.ToString;


@Getter // Thêm @Getter
@Setter // Thêm @Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "cm_questions")
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ToString.Exclude // Bỏ qua trường này khi tạo phương thức toString()
    @EqualsAndHashCode.Exclude // Bỏ qua trường này khi tạo equals() và hashCode()
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;
    

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(nullable = false)
    private String type;

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<QuestionOption> options;
    private Integer displayOrder;
}