package com.dao.identity_service.repository;

import com.dao.identity_service.entity.UserPermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserPermissionRepository extends JpaRepository<UserPermission, UUID> {

    List<UserPermission> findByUserId(UUID userId);

    List<UserPermission> findByPermissionId(UUID permissionId);

    Optional<UserPermission> findByUserIdAndPermissionId(UUID userId, UUID permissionId);

    @Query("SELECT up FROM UserPermission up " +
           "JOIN FETCH up.permission " +
           "WHERE up.user.id = :userId")
    List<UserPermission> findByUserIdWithPermission(@Param("userId") UUID userId);

    void deleteByUserId(UUID userId);

    void deleteByPermissionId(UUID permissionId);

    boolean existsByUserIdAndPermissionId(UUID userId, UUID permissionId);
}
