package com.dao.examservice.repository;

import com.dao.examservice.entity.ExamDifficulty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamDifficultyRepository extends JpaRepository<ExamDifficulty, String> {
    
    /**
     * Find all active difficulties ordered by display order
     */
    @Query("SELECT ed FROM ExamDifficulty ed WHERE ed.isActive = true ORDER BY ed.displayOrder ASC")
    List<ExamDifficulty> findAllActiveOrderByDisplayOrder();
}

