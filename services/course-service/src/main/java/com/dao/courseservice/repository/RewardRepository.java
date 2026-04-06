package com.dao.courseservice.repository;

import com.dao.courseservice.entity.Reward;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RewardRepository extends JpaRepository<Reward, UUID> {

    List<Reward> findByStudentId(UUID studentId);

    List<Reward> findByStudentIdOrderByAwardedAtDesc(UUID studentId);

    List<Reward> findByReasonCode(String reasonCode);

    List<Reward> findByStudentIdAndReasonCode(UUID studentId, String reasonCode);

    @Query("SELECT r FROM Reward r WHERE r.course.id = :courseId")
    List<Reward> findByCourseId(@Param("courseId") UUID courseId);

    @Query("SELECT COALESCE(SUM(r.tokensAwarded), 0) FROM Reward r WHERE r.studentId = :studentId")
    Long sumTokensAwardedByStudentId(@Param("studentId") UUID studentId);
}
