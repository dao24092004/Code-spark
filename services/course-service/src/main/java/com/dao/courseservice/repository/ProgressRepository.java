package com.dao.courseservice.repository;

import com.dao.courseservice.entity.Progress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository để truy vấn dữ liệu cho bảng cm_progress (UC33).
 */
@Repository
public interface ProgressRepository extends JpaRepository<Progress, Long> {

    /**
     * Tìm kiếm tiến độ học tập của một học sinh trong một khóa học.
     */
    Optional<Progress> findByStudentIdAndCourseId(Long studentId, UUID courseId);
    
    /**
     * Tìm tất cả tiến độ học tập trong một khóa học (dành cho dashboard của giảng viên).
     */
    List<Progress> findByCourseId(UUID courseId);
}