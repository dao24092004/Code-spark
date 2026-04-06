package com.dao.examservice.repository;

import com.dao.examservice.entity.Answer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AnswerRepository extends JpaRepository<Answer, UUID> {

    @Query("SELECT a FROM Answer a WHERE a.submission.id = :submissionId")
    List<Answer> findBySubmissionId(@Param("submissionId") UUID submissionId);

    @Query("SELECT a FROM Answer a WHERE a.submission.id = :submissionId AND a.questionId = :questionId")
    List<Answer> findBySubmissionIdAndQuestionId(
            @Param("submissionId") UUID submissionId,
            @Param("questionId") UUID questionId);
}
