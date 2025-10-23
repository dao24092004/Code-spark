package com.dao.examservice.repository;

import com.dao.examservice.entity.Exam;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface ExamRepository extends JpaRepository<Exam, UUID> {

    List<Exam> findByStartAtGreaterThanEqual(Instant start);

    List<Exam> findByEndAtLessThanEqual(Instant end);

    List<Exam> findByStartAtGreaterThanEqualAndEndAtLessThanEqual(Instant start, Instant end);
}