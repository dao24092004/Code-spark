package com.dao.examservice.repository;

import com.dao.examservice.entity.QuestionTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface QuestionTagRepository extends JpaRepository<QuestionTag, UUID> {

    @Query("SELECT qt FROM QuestionTag qt WHERE qt.question.id = :questionId")
    List<QuestionTag> findByQuestionId(@Param("questionId") UUID questionId);

    @Query("SELECT DISTINCT qt.tag FROM QuestionTag qt WHERE qt.question.organizationId = :orgId ORDER BY qt.tag")
    List<String> findAllUniqueTagsByOrganizationId(@Param("orgId") UUID orgId);

    void deleteByQuestionId(UUID questionId);
}
