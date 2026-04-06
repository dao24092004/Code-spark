package com.dao.courseservice.repository;

import com.dao.courseservice.entity.QuizSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface QuizSubmissionRepository extends JpaRepository<QuizSubmission, UUID> {

    List<QuizSubmission> findByStudentIdAndQuizId(UUID studentId, UUID quizId);

    @Query("SELECT qs FROM QuizSubmission qs " +
           "LEFT JOIN FETCH qs.quiz " +
           "WHERE qs.studentId = :studentId AND qs.quiz.id = :quizId " +
           "ORDER BY qs.submittedAt DESC")
    Optional<QuizSubmission> findTopByStudentIdAndQuizIdOrderBySubmittedAtDesc(
            @Param("studentId") UUID studentId,
            @Param("quizId") UUID quizId);

    @Query("SELECT qs FROM QuizSubmission qs " +
           "LEFT JOIN FETCH qs.quiz " +
           "WHERE qs.quiz.id = :quizId")
    List<QuizSubmission> findByQuizId(@Param("quizId") UUID quizId);

    List<QuizSubmission> findByStudentId(UUID studentId);

    @Modifying
    @Query("DELETE FROM QuizSubmission qs WHERE qs.quiz.course.id = :courseId")
    void deleteByCourseId(@Param("courseId") UUID courseId);
}
