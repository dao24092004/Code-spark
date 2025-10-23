package com.dao.analyticsservice.repository;

import com.dao.analyticsservice.entity.ProctoringEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProctoringEventRepository extends JpaRepository<ProctoringEvent, Long> {

    List<ProctoringEvent> findByExamId(UUID examId);

    List<ProctoringEvent> findBySubmissionId(UUID submissionId);
}
