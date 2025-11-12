package com.dao.examservice.repository;

import com.dao.examservice.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface QuestionRepository extends JpaRepository<Question, UUID> {

    // ✅ FIX v2: Use subquery to avoid Hibernate's N+1 and CARTESIAN PRODUCT issues with EAGER @ElementCollection
    // When LEFT JOIN is used with EAGER fetch, Hibernate may return duplicate Question objects
    // Subquery ensures each question appears exactly once
    @Query("""
        SELECT DISTINCT q FROM Question q 
        WHERE (:tagsEmpty = true OR EXISTS (
            SELECT 1 FROM Question q2 
            JOIN q2.tags t 
            WHERE q2.id = q.id AND t IN :tags
        ))
        AND (:min IS NULL OR q.difficulty >= :min) 
        AND (:max IS NULL OR q.difficulty <= :max)
        """)
    List<Question> search(@Param("tags") Collection<String> tags,
                          @Param("tagsEmpty") boolean tagsEmpty,
                          @Param("min") Integer minDifficulty,
                          @Param("max") Integer maxDifficulty);

    @Query("select distinct t from Question q join q.tags t order by t")
    List<String> findAllUniqueTags();
    
    // Check if question with same text exists (for duplicate detection)
    boolean existsByText(String text);
    
    // Find question by exact text match (case-insensitive)
    @Query("SELECT q FROM Question q WHERE LOWER(q.text) = LOWER(:text)")
    List<Question> findByTextIgnoreCase(@Param("text") String text);
}


