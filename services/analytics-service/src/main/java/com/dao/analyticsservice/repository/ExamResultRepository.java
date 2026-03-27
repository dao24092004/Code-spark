package com.dao.analyticsservice.repository;

import com.dao.analyticsservice.entity.ExamResult;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExamResultRepository extends JpaRepository<ExamResult, Long> {

    Optional<ExamResult> findBySubmissionId(UUID submissionId);

    List<ExamResult> findByExamId(UUID examId);

    // Sửa: userId từ UUID → Long
    List<ExamResult> findByUserId(Long userId);

    @Query("SELECT COUNT(DISTINCT er.examId) FROM ExamResult er WHERE er.examId IS NOT NULL")
    long countDistinctByExamIdIsNotNull();

    @Query("SELECT COUNT(DISTINCT er.userId) FROM ExamResult er WHERE er.userId IS NOT NULL")
    long countDistinctByUserIdIsNotNull();

    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    List<ExamResult> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    List<ExamResult> findTop10ByOrderByScoreDesc();

    List<ExamResult> findTop10ByOrderByCreatedAtDesc();

    @Query("select avg(er.score) from ExamResult er")
    Double findAverageScore();

    // ========== OPTIMIZED AGGREGATION QUERIES ==========

    // Get user statistics grouped (for top performers)
    @Query("SELECT er.userId, AVG(er.score), COUNT(er), MAX(er.score), MIN(er.score) " +
           "FROM ExamResult er " +
           "WHERE er.userId IS NOT NULL " +
           "GROUP BY er.userId " +
           "ORDER BY AVG(er.score) DESC")
    List<Object[]> getUserStatisticsGrouped(Pageable pageable);

    // Get exam/course statistics grouped (for top courses)
    @Query("SELECT er.examId, AVG(er.score), COUNT(er), MAX(er.score), MIN(er.score) " +
           "FROM ExamResult er " +
           "WHERE er.examId IS NOT NULL " +
           "GROUP BY er.examId " +
           "ORDER BY COUNT(er) DESC")
    List<Object[]> getExamStatisticsGrouped(Pageable pageable);

    // Get score trend by date
    @Query("SELECT FUNCTION('DATE', er.createdAt), AVG(er.score), COUNT(er) " +
           "FROM ExamResult er " +
           "WHERE er.createdAt BETWEEN :start AND :end " +
           "GROUP BY FUNCTION('DATE', er.createdAt) " +
           "ORDER BY FUNCTION('DATE', er.createdAt)")
    List<Object[]> getScoreTrendByDate(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    // Get exam attempts in date range
    @Query("SELECT COUNT(er) FROM ExamResult er WHERE er.createdAt BETWEEN :start AND :end")
    long countExamAttemptsBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    // Get average score in date range
    @Query("SELECT AVG(er.score) FROM ExamResult er WHERE er.createdAt BETWEEN :start AND :end")
    Double findAverageScoreBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    // Get user rank by average score
    @Query("SELECT er.userId, AVG(er.score) as avgScore " +
           "FROM ExamResult er " +
           "WHERE er.userId IS NOT NULL " +
           "GROUP BY er.userId " +
           "ORDER BY avgScore DESC")
    Page<Object[]> getUserRankByAverageScore(Pageable pageable);
}
