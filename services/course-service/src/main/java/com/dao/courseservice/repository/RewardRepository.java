package com.dao.courseservice.repository;

import com.dao.courseservice.entity.Reward;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository để truy vấn dữ liệu cho bảng cm_rewards (UC32).
 */
@Repository
public interface RewardRepository extends JpaRepository<Reward, Long> {

    /**
     * Tìm tất cả phần thưởng của một học sinh.
     */
    List<Reward> findByStudentId(Long studentId);
}