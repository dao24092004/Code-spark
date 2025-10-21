package com.dao.courseservice.repository;

import com.dao.courseservice.entity.QuizSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface QuizSubmissionRepository extends JpaRepository<QuizSubmission, UUID> {
    /**
     * Tìm tất cả các lần nộp bài của một học sinh cho một bài quiz cụ thể.
     */
    List<QuizSubmission> findByStudentIdAndQuizId(Long studentId, UUID quizId);
}