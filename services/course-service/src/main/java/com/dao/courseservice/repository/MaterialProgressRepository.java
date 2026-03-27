package com.dao.courseservice.repository;

import com.dao.courseservice.entity.MaterialProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface MaterialProgressRepository extends JpaRepository<MaterialProgress, UUID> {

    @Query("SELECT COUNT(mp) FROM MaterialProgress mp WHERE mp.studentId = :studentId AND mp.material.course.id = :courseId")
    long countByStudentIdAndCourseId(@Param("studentId") UUID studentId, @Param("courseId") UUID courseId);

    boolean existsByStudentIdAndMaterialId(UUID studentId, UUID materialId);
}
