package com.dao.identity_service.repository;

import com.dao.identity_service.entity.AdminAuditTrail;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.UUID;

@Repository
public interface AdminAuditTrailRepository extends JpaRepository<AdminAuditTrail, UUID> {

    Page<AdminAuditTrail> findByUserId(UUID userId, Pageable pageable);

    Page<AdminAuditTrail> findByTargetTypeAndTargetId(String targetType, UUID targetId, Pageable pageable);

    Page<AdminAuditTrail> findByAction(String action, Pageable pageable);

    @Query("SELECT a FROM AdminAuditTrail a " +
           "WHERE a.user.id = :userId " +
           "AND a.createdAt BETWEEN :startDate AND :endDate")
    Page<AdminAuditTrail> findByUserIdAndDateRange(
            @Param("userId") UUID userId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable);

    @Query("SELECT a FROM AdminAuditTrail a " +
           "WHERE a.createdAt BETWEEN :startDate AND :endDate")
    Page<AdminAuditTrail> findByDateRange(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable);

    @Query("SELECT a FROM AdminAuditTrail a " +
           "JOIN FETCH a.user " +
           "WHERE a.targetType = :targetType " +
           "AND a.targetId = :targetId " +
           "ORDER BY a.createdAt DESC")
    Page<AdminAuditTrail> findByTargetWithUser(
            @Param("targetType") String targetType,
            @Param("targetId") UUID targetId,
            Pageable pageable);
}
