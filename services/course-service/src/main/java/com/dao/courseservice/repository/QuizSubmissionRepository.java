package com.dao.courseservice.repository;

import com.dao.courseservice.entity.QuizSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface QuizSubmissionRepository extends JpaRepository<QuizSubmission, UUID> {
    /**
     * Tìm tất cả các lần nộp bài của một học sinh cho một bài quiz cụ thể.
     */
    List<QuizSubmission> findByStudentIdAndQuizId(Long studentId, UUID quizId);
    
    /**
     * Xóa tất cả quiz submissions cho các quizzes trong một khóa học.
     * Sử dụng khi xóa khóa học để tránh foreign key constraint violation.
     */
    @Modifying
    @Query("DELETE FROM QuizSubmission qs WHERE qs.quiz.course.id = :courseId")
    void deleteByCourseId(@Param("courseId") UUID courseId);
}