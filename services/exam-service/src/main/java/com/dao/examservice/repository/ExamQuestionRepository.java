package com.dao.examservice.repository;

import com.dao.examservice.entity.ExamQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ExamQuestionRepository extends JpaRepository<ExamQuestion, UUID> {

    /**
     * Find all questions for a specific exam, ordered by displayOrder.
     * Used to retrieve exam questions for display/taking the exam.
     */
    @Query("SELECT eq FROM ExamQuestion eq WHERE eq.exam.id = :examId ORDER BY eq.displayOrder")
    List<ExamQuestion> findByExamIdOrderByDisplayOrder(@Param("examId") UUID examId);

    /**
     * Count total questions in an exam.
     * Used for validation and statistics.
     */
    @Query("SELECT COUNT(eq) FROM ExamQuestion eq WHERE eq.exam.id = :examId")
    long countByExamId(@Param("examId") UUID examId);

    /**
     * Delete all questions from an exam.
     * Used when regenerating exam questions or deleting exam.
     */
    void deleteByExamId(UUID examId);

    /**
     * Check if a specific question exists in an exam.
     * Used to prevent duplicate questions in same exam.
     */
    boolean existsByExamIdAndQuestionId(UUID examId, UUID questionId);
}

