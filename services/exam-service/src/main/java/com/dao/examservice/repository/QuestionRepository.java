package com.dao.examservice.repository;

import com.dao.examservice.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface QuestionRepository extends JpaRepository<Question, UUID> {

    @Query("""
        SELECT DISTINCT q FROM Question q
        WHERE (:tagsEmpty = true OR EXISTS (
            SELECT 1 FROM QuestionTag qt
            WHERE qt.question.id = q.id AND qt.tag IN :tags
        ))
        AND (:min IS NULL OR q.difficulty >= :min)
        AND (:max IS NULL OR q.difficulty <= :max)
        """)
    List<Question> search(@Param("tags") Collection<String> tags,
                          @Param("tagsEmpty") boolean tagsEmpty,
                          @Param("min") Integer minDifficulty,
                          @Param("max") Integer maxDifficulty);

    boolean existsByText(String text);

    @Query("SELECT q FROM Question q WHERE LOWER(q.text) = LOWER(:text)")
    List<Question> findByTextIgnoreCase(@Param("text") String text);

    @Query("SELECT COUNT(q) FROM Question q JOIN QuestionTag qt ON qt.question.id = q.id WHERE qt.tag = :tag")
    long countByTag(@Param("tag") String tag);

    @Query("SELECT DISTINCT qt.tag FROM QuestionTag qt WHERE qt.question.organizationId = :orgId ORDER BY qt.tag")
    List<String> findAllUniqueTagsByOrganizationId(@Param("orgId") UUID orgId);    @Query("SELECT DISTINCT qt.tag FROM QuestionTag qt ORDER BY qt.tag")
    List<String> findAllUniqueTags();
}