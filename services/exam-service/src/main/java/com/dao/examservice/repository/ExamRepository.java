package com.dao.examservice.repository;

import com.dao.examservice.entity.Exam;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ExamRepository extends JpaRepository<Exam, UUID> {

    List<Exam> findByStartAtGreaterThanEqual(Instant start);

    List<Exam> findByEndAtLessThanEqual(Instant end);

    List<Exam> findByStartAtGreaterThanEqualAndEndAtLessThanEqual(Instant start, Instant end);

    // ==================== Paginated Queries ====================

    /**
     * Get paginated exams within time window.
     */
    Page<Exam> findByStartAtGreaterThanEqualAndEndAtLessThanEqual(
            Instant start,
            Instant end,
            Pageable pageable);

    /**
     * Get paginated exams from start date.
     */
    Page<Exam> findByStartAtGreaterThanEqual(
            Instant start,
            Pageable pageable);

    /**
     * Get paginated exams until end date.
     */
    Page<Exam> findByEndAtLessThanEqual(
            Instant end,
            Pageable pageable);

    /**
     * Get all paginated exams: use inherited findAll(Pageable).
     */

    // ==================== Search Queries ====================

    /**
     * Search exams by multiple criteria with pagination.
     */
    @Query("SELECT e FROM Exam e WHERE " +
           "(:status IS NULL OR e.status = :status) AND " +
           "(:title IS NULL OR LOWER(e.title) LIKE LOWER(CONCAT('%', :title, '%'))) AND " +
           "e.deletedAt IS NULL")
    Page<Exam> searchExams(
            @Param("status") Exam.ExamStatus status,
            @Param("title") String title,
            Pageable pageable);

    // ==================== Soft Delete Support ====================

    /**
     * Find exams excluding soft deleted ones.
     */
    @Query("SELECT e FROM Exam e WHERE e.id = :id AND e.deletedAt IS NULL")
    Optional<Exam> findActiveById(@Param("id") UUID id);

    /**
     * Find all active exams (not soft deleted).
     */
    @Query("SELECT e FROM Exam e WHERE e.deletedAt IS NULL")
    List<Exam> findAllActive();

    /**
     * Find active exams with pagination.
     */
    Page<Exam> findByDeletedAtIsNull(Pageable pageable);

    // ==================== Entity Graphs ====================

    /**
     * Find exam by ID with examQuestions and questions loaded.
     * Avoids N+1 query when accessing exam questions.
     */
    @EntityGraph(attributePaths = {"examQuestions", "examQuestions.question"})
    @Query("SELECT e FROM Exam e WHERE e.id = :id")
    Optional<Exam> findByIdWithQuestions(@Param("id") UUID id);

    /**
     * Find all exams by courseId with registrations loaded.
     * Avoids N+1 query when accessing exam registrations.
     */
    @EntityGraph(attributePaths = {"registrations"})
    @Query("SELECT e FROM Exam e WHERE e.courseId = :courseId AND e.deletedAt IS NULL")
    List<Exam> findByCourseIdWithRegistrations(@Param("courseId") UUID courseId);

    /**
     * Find exam by ID with both questions and registrations loaded.
     */
    @EntityGraph(attributePaths = {"examQuestions", "examQuestions.question", "registrations"})
    @Query("SELECT e FROM Exam e WHERE e.id = :id")
    Optional<Exam> findByIdWithQuestionsAndRegistrations(@Param("id") UUID id);
}