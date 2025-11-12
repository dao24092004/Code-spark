package com.dao.examservice.repository;

import com.dao.examservice.entity.ExamStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamStatusRepository extends JpaRepository<ExamStatus, String> {
    
    /**
     * Find all active statuses ordered by display order
     */
    @Query("SELECT es FROM ExamStatus es WHERE es.isActive = true ORDER BY es.displayOrder ASC")
    List<ExamStatus> findAllActiveOrderByDisplayOrder();
}

