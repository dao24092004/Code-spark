package com.dao.identity_service.repository;

import com.dao.identity_service.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRoleRepository extends JpaRepository<UserRole, UUID> {

    List<UserRole> findByUserId(UUID userId);

    List<UserRole> findByRoleId(UUID roleId);

    Optional<UserRole> findByUserIdAndRoleIdAndOrganizationId(
            UUID userId, UUID roleId, UUID organizationId);

    @Query("SELECT ur FROM UserRole ur " +
           "JOIN FETCH ur.role r " +
           "LEFT JOIN FETCH r.rolePermissions rp " +
           "LEFT JOIN FETCH rp.permission " +
           "WHERE ur.user.id = :userId " +
           "AND (ur.organizationId = :orgId OR ur.organizationId IS NULL)")
    List<UserRole> findByUserIdAndOrganizationIdWithPermissions(
            @Param("userId") UUID userId,
            @Param("orgId") UUID orgId);

    @Query("SELECT ur FROM UserRole ur " +
           "JOIN FETCH ur.role r " +
           "LEFT JOIN FETCH r.rolePermissions rp " +
           "LEFT JOIN FETCH rp.permission " +
           "WHERE ur.user.id = :userId")
    List<UserRole> findByUserIdWithPermissions(@Param("userId") UUID userId);

    void deleteByUserId(UUID userId);

    void deleteByRoleId(UUID roleId);
}
