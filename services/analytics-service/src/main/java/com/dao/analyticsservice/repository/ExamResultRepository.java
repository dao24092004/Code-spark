package com.dao.analyticsservice.repository;

import com.dao.analyticsservice.entity.ExamResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExamResultRepository extends JpaRepository<ExamResult, Long> {

    Optional<ExamResult> findBySubmissionId(UUID submissionId);

    List<ExamResult> findByExamId(UUID examId);

    List<ExamResult> findByUserId(UUID userId);
}
