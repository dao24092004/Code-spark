package com.dao.courseservice.repository;

import com.dao.courseservice.entity.Material;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MaterialRepository extends JpaRepository<Material, UUID> {

    @Query("SELECT m FROM Material m " +
           "WHERE m.course.id = :courseId " +
           "ORDER BY m.displayOrder ASC")
    List<Material> findByCourseIdOrderByDisplayOrderAsc(@Param("courseId") UUID courseId);

    @Query("SELECT m FROM Material m " +
           "LEFT JOIN FETCH m.course " +
           "WHERE m.id = :materialId")
    Optional<Material> findByIdWithCourse(@Param("materialId") UUID materialId);

    @Query("SELECT m FROM Material m " +
           "WHERE m.id = :materialId")
    Optional<Material> findActiveById(@Param("materialId") UUID materialId);
}
