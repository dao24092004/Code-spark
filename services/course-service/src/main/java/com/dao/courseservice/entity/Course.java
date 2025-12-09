package com.dao.courseservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.util.List;
import java.time.LocalDateTime;
import java.util.UUID;
import java.math.BigDecimal; // [MỚI] Cần import BigDecimal

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "cm_courses")
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column
    private Long createdBy;

    @Column(nullable = false)
    private String organizationId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String description;

    // ==========================================
    // [PHẦN THÊM MỚI ĐỂ SỬA LỖI]
    // ==========================================

    // 1. Thêm giá tiền (Service đang gọi getPrice())
    @Column(name = "price")
    private BigDecimal price;

    // 2. Thêm liên kết Metadata (Service đang gọi getMetadata())
    // mappedBy = "course" nghĩa là CourseMetadata là bên giữ khóa ngoại (foreign
    // key)
    @OneToOne(mappedBy = "course", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private CourseMetadata metadata;

    // ==========================================

    private String thumbnailUrl;

    @Column(nullable = false)
    private String visibility;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Material> materials;

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Quiz> quizzes;
}