package com.dao.examservice.repository;

import com.dao.examservice.entity.QuizRanking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface QuizRankingRepository extends JpaRepository<QuizRanking, UUID> {

    @Query("SELECT qr FROM QuizRanking qr WHERE qr.quizId = :quizId AND qr.studentId = :studentId")
    Optional<QuizRanking> findByQuizIdAndStudentId(
            @Param("quizId") UUID quizId,
            @Param("studentId") UUID studentId);

    @Query("SELECT qr FROM QuizRanking qr WHERE qr.quizId = :quizId ORDER BY qr.rank ASC")
    List<QuizRanking> findByQuizIdOrderByRankAsc(@Param("quizId") UUID quizId);
}
