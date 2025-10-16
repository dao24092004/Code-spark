package com.dao.examservice.repository;

import com.dao.examservice.entity.Exam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExamRepository extends JpaRepository<Exam, Long> {

    // GET /exams/{id}: Xem kỳ thi
    Optional<Exam> findById(Long id);

    // GET /exams/schedules: Lấy lịch thi
    @Query("SELECT e FROM Exam e WHERE e.startTime >= :startAt AND e.endTime <= :endAt")
    List<Exam> findExamSchedules(
        @Param("startAt") LocalDateTime startAt,
        @Param("endAt") LocalDateTime endAt
    );
}