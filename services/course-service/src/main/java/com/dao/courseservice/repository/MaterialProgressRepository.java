// src/main/java/com/dao/courseservice/repository/MaterialProgressRepository.java

package com.dao.courseservice.repository;

import com.dao.courseservice.entity.MaterialProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param; // (THÊM MỚI)
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface MaterialProgressRepository extends JpaRepository<MaterialProgress, UUID> {

    /**
     * (HÀM MỚI) Đếm số bài học mà học viên đã hoàn thành trong 1 khóa
     */
    @Query("SELECT COUNT(mp) FROM MaterialProgress mp WHERE mp.studentId = :studentId AND mp.material.course.id = :courseId")
    long countByStudentIdAndCourseId(@Param("studentId") Long studentId, @Param("courseId") UUID courseId);

    /**
     * (HÀM MỚI) Kiểm tra xem học viên đã học bài này chưa
     */
    boolean existsByStudentIdAndMaterialId(Long studentId, UUID materialId);
}