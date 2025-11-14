// src/main/java/com/dao/courseservice/repository/CourseImageRepository.java

package com.dao.courseservice.repository;

import com.dao.courseservice.entity.CourseImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface CourseImageRepository extends JpaRepository<CourseImage, UUID> {
}