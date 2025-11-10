package com.dao.examservice.repository;

import com.dao.examservice.entity.ExamType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamTypeRepository extends JpaRepository<ExamType, String> {
    
    /**
     * Find all active exam types ordered by display order
     */
    @Query("SELECT et FROM ExamType et WHERE et.isActive = true ORDER BY et.displayOrder ASC")
    List<ExamType> findAllActiveOrderByDisplayOrder();
}

