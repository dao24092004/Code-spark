package com.dao.examservice.repository;

import com.dao.examservice.entity.QuizSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface QuizSubmissionRepository extends JpaRepository<QuizSubmission, UUID> {

    @Query("SELECT qs FROM QuizSubmission qs WHERE qs.quizId = :quizId AND qs.studentId = :studentId AND qs.isFinal = true")
    Optional<QuizSubmission> findFinalByQuizIdAndStudentId(
            @Param("quizId") UUID quizId,
            @Param("studentId") UUID studentId);

    @Query("SELECT qs FROM QuizSubmission qs WHERE qs.quizId = :quizId AND qs.studentId = :studentId ORDER BY qs.submittedAt DESC")
    List<QuizSubmission> findByQuizIdAndStudentIdOrderBySubmittedAtDesc(
            @Param("quizId") UUID quizId,
            @Param("studentId") UUID studentId);

    @Query("SELECT qs FROM QuizSubmission qs WHERE qs.quizId = :quizId ORDER BY qs.score DESC")
    List<QuizSubmission> findByQuizIdOrderByScoreDesc(@Param("quizId") UUID quizId);

    long countByQuizId(UUID quizId);
}
