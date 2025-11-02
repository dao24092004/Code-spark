package com.dao.courseservice.repository;

import com.dao.courseservice.entity.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List; // <-- THÊM IMPORT NÀY
import java.util.Optional;
import java.util.UUID;

/**
 * Repository để truy vấn dữ liệu cho bảng cm_quizzes (UC31).
 */
@Repository
public interface QuizRepository extends JpaRepository<Quiz, UUID> {
    
    /**
     * SỬA LẠI QUERY:
     * Chỉ fetch đến questions. Việc fetch options sẽ được xử lý riêng.
     * Đổi tên phương thức cho rõ ràng.
     */
    @Query("SELECT q FROM Quiz q LEFT JOIN FETCH q.questions quest LEFT JOIN FETCH quest.options WHERE q.id = :quizId")
    Optional<Quiz> findByIdWithQuestionsAndOptions(@Param("quizId") UUID quizId);
    List<Quiz> findByCourseId(UUID courseId);
}