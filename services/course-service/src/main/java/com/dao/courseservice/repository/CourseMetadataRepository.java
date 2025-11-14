package com.dao.courseservice.repository;

import com.dao.courseservice.entity.CourseMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CourseMetadataRepository extends JpaRepository<CourseMetadata, UUID> {
    CourseMetadata findByCourseId(UUID courseId);
}
