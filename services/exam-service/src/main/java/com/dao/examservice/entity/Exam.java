package com.dao.examservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.Collections;

@Entity
@Table(name = "exams")
@Getter
@Setter
@ToString
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(exclude = "questions")
public class Exam {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 1000)
    private String description;

    @Column(name = "duration_minutes", nullable = false)
    private Integer durationMinutes;

    @Column(name = "passing_score")
    private Integer passingScore;

    @Column(name = "total_score")
    private Integer totalScore;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;
    
    @Column(name = "max_attempts")
    private Integer maxAttempts;
    
    @Column(name = "required_tags")
    @ElementCollection
    private List<String> requiredTags = new ArrayList<>();
    
    @Column(name = "difficulty_level")
    @Enumerated(EnumType.STRING)
    private DifficultyLevel difficultyLevel;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Quan hệ với các câu hỏi trong bài thi
    @OneToMany(mappedBy = "exam", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @ToString.Exclude
    @Builder.Default
    private Set<Question> questions = new HashSet<>();

    // Quan hệ với các bài làm của học viên
    @OneToMany(mappedBy = "exam", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @ToString.Exclude
    @Builder.Default
    private Set<ExamSubmission> submissions = new HashSet<>();

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Helper method để thêm câu hỏi vào bài thi
    public void addQuestion(Question question) {
        questions.add(question);
        question.setExam(this);
    }

    // Helper method để xóa câu hỏi khỏi bài thi
    public void removeQuestion(Question question) {
        questions.remove(question);
        question.setExam(null);
    }

    // Sinh đề thi ngẫu nhiên từ danh sách câu hỏi
    public void generateRandomQuestions(List<Question> availableQuestions, int numberOfQuestions) {
        // Xóa các câu hỏi hiện tại
        questions.clear();
        
        // Tạo một bản sao của danh sách để shuffle
        List<Question> shuffledQuestions = new ArrayList<>(availableQuestions);
        Collections.shuffle(shuffledQuestions);
        
        // Chọn số lượng câu hỏi cần thiết
        for (int i = 0; i < Math.min(numberOfQuestions, shuffledQuestions.size()); i++) {
            addQuestion(shuffledQuestions.get(i));
        }
        
        // Cập nhật tổng điểm
        updateTotalScore();
    }

    // Cập nhật tổng điểm của bài thi
    private void updateTotalScore() {
        this.totalScore = questions.stream()
                .mapToInt(Question::getScore)
                .sum();
    }

    // Kiểm tra xem có thể đăng ký thi không
    public boolean canRegister() {
        LocalDateTime now = LocalDateTime.now();
        return isActive && 
               startTime != null && 
               endTime != null && 
               now.isBefore(endTime) &&
               now.isAfter(startTime.minusDays(7)); // Cho phép đăng ký trước 7 ngày
    }

    public enum DifficultyLevel {
        EASY, MEDIUM, HARD
    }
}
