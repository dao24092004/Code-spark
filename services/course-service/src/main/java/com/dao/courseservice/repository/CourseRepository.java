package com.dao.courseservice.repository;

import com.dao.courseservice.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository để truy vấn dữ liệu cho bảng cm_courses (UC29).
 */
@Repository
public interface CourseRepository extends JpaRepository<Course, UUID> {

    /**
     * Tìm kiếm một khóa học dựa trên 'slug' (chuỗi định danh trên URL).
     */
    Optional<Course> findBySlug(String slug);

    /**
     * Tìm tất cả khóa học được tạo bởi một giảng viên cụ thể (UC33).
     */
    List<Course> findByInstructorId(Long instructorId);

    /**
     * Kiểm tra xem một slug đã tồn tại hay chưa.
     */
    boolean existsBySlug(String slug);
    
    /**
     * Lấy một khóa học cùng với tất cả học liệu của nó chỉ trong một câu truy vấn.
     * 'LEFT JOIN FETCH' giúp giải quyết vấn đề N+1 query, tăng hiệu năng.
     */
    @Query("SELECT c FROM Course c LEFT JOIN FETCH c.materials WHERE c.id = :courseId")
    Optional<Course> findByIdWithMaterials(@Param("courseId") UUID courseId);
}