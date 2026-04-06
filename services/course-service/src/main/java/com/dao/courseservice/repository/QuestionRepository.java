package com.dao.courseservice.repository;

import com.dao.courseservice.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface QuestionRepository extends JpaRepository<Question, UUID> {

    /**
     * Tìm tất cả câu hỏi của một quiz với options (tránh N+1).
     */
    @Query("SELECT q FROM Question q " +
           "LEFT JOIN FETCH q.options " +
           "WHERE q.quiz.id = :quizId " +
           "ORDER BY q.displayOrder ASC")
    List<Question> findByQuizIdWithOptions(@Param("quizId") UUID quizId);

    /**
     * Tìm câu hỏi theo ID với options.
     */
    @Query("SELECT q FROM Question q " +
           "LEFT JOIN FETCH q.options " +
           "WHERE q.id = :questionId")
    Question findByIdWithOptions(@Param("questionId") UUID questionId);
}