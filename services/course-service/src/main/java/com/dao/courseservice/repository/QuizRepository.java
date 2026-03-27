package com.dao.courseservice.repository;

import com.dao.courseservice.entity.Quiz;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, UUID> {

    @Query("SELECT q FROM Quiz q " +
           "LEFT JOIN FETCH q.questions quest " +
           "LEFT JOIN FETCH quest.options " +
           "WHERE q.id = :quizId")
    Optional<Quiz> findByIdWithQuestionsAndOptions(@Param("quizId") UUID quizId);

    @Query("SELECT q FROM Quiz q WHERE q.course.id = :courseId")
    List<Quiz> findByCourseId(@Param("courseId") UUID courseId);

    @Query("SELECT q FROM Quiz q WHERE q.course.id = :courseId AND q.status = 'PUBLISHED'")
    List<Quiz> findActiveByCourseId(@Param("courseId") UUID courseId);

    @Query("SELECT q FROM Quiz q WHERE q.course.id = :courseId")
    Page<Quiz> findByCourseId(@Param("courseId") UUID courseId, Pageable pageable);

    @Query("SELECT CASE WHEN COUNT(q) > 0 THEN true ELSE false END FROM Quiz q WHERE q.id = :quizId")
    boolean existsActiveById(@Param("quizId") UUID quizId);

    @Query("SELECT q FROM Quiz q WHERE q.id = :quizId")
    Optional<Quiz> findActiveById(@Param("quizId") UUID quizId);
}
