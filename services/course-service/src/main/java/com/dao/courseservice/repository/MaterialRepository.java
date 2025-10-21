package com.dao.courseservice.repository;

import com.dao.courseservice.entity.Material;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository để truy vấn dữ liệu cho bảng cm_materials (UC30).
 */
@Repository
public interface MaterialRepository extends JpaRepository<Material, UUID> {

    /**
     * Tìm tất cả học liệu của một khóa học, sắp xếp theo thứ tự hiển thị.
     */
    List<Material> findByCourseIdOrderByDisplayOrderAsc(UUID courseId);
}