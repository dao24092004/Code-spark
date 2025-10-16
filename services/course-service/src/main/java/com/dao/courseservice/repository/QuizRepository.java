package com.dao.courseservice.repository;

import com.dao.courseservice.entity.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository để truy vấn dữ liệu cho bảng cm_quizzes (UC31).
 */
@Repository
public interface QuizRepository extends JpaRepository<Quiz, UUID> {
    
    /**
     * Lấy thông tin chi tiết của một bài quiz, bao gồm tất cả câu hỏi và các lựa chọn.
     * 'LEFT JOIN FETCH' được sử dụng để tải tất cả dữ liệu liên quan trong một lần gọi DB.
     * Rất hữu ích khi học sinh bắt đầu làm bài quiz.
     */
    @Query("SELECT q FROM Quiz q LEFT JOIN FETCH q.questions quest LEFT JOIN FETCH quest.options WHERE q.id = :quizId")
    Optional<Quiz> findByIdWithQuestionsAndOptions(@Param("quizId") UUID quizId);
}