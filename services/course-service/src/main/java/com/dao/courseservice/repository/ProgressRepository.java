package com.dao.courseservice.repository;

import com.dao.courseservice.entity.Progress;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProgressRepository extends JpaRepository<Progress, UUID> {

    @Query("SELECT p FROM Progress p " +
           "LEFT JOIN FETCH p.course " +
           "WHERE p.studentId = :studentId AND p.course.id = :courseId")
    Optional<Progress> findByStudentIdAndCourseId(@Param("studentId") UUID studentId, @Param("courseId") UUID courseId);

    @Query("SELECT DISTINCT p FROM Progress p " +
           "LEFT JOIN FETCH p.course " +
           "WHERE p.course.id = :courseId")
    List<Progress> findByCourseId(@Param("courseId") UUID courseId);

    @Query("SELECT DISTINCT p FROM Progress p " +
           "LEFT JOIN FETCH p.course " +
           "WHERE p.course.id = :courseId")
    Page<Progress> findByCourseId(@Param("courseId") UUID courseId, Pageable pageable);

    void deleteByCourseId(UUID courseId);
}
