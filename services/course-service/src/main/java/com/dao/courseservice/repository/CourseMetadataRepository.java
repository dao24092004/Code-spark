package com.dao.courseservice.repository;

import com.dao.courseservice.entity.CourseMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CourseMetadataRepository extends JpaRepository<CourseMetadata, UUID> {

    @Query("SELECT cm FROM CourseMetadata cm WHERE cm.course.id = :courseId")
    Optional<CourseMetadata> findByCourseId(@Param("courseId") UUID courseId);
}
