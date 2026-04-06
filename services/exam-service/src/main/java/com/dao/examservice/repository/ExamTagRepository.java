package com.dao.examservice.repository;

import com.dao.examservice.entity.ExamTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ExamTagRepository extends JpaRepository<ExamTag, UUID> {

    @Query("SELECT et FROM ExamTag et WHERE et.exam.id = :examId")
    List<ExamTag> findByExamId(@Param("examId") UUID examId);

    void deleteByExamId(UUID examId);
}
