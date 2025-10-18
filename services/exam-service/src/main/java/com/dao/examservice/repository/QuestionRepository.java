package com.dao.examservice.repository;

import com.dao.examservice.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface QuestionRepository extends JpaRepository<Question, UUID> {

    @Query("select distinct q from Question q left join q.tags t where (:tagsEmpty = true or t in :tags) and (:min is null or q.difficulty >= :min) and (:max is null or q.difficulty <= :max)")
    List<Question> search(@Param("tags") Collection<String> tags,
                          @Param("tagsEmpty") boolean tagsEmpty,
                          @Param("min") Integer minDifficulty,
                          @Param("max") Integer maxDifficulty);
}


