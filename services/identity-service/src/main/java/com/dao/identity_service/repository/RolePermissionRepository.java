package com.dao.identity_service.repository;

import com.dao.identity_service.entity.RolePermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RolePermissionRepository extends JpaRepository<RolePermission, UUID> {

    List<RolePermission> findByRoleId(UUID roleId);

    List<RolePermission> findByPermissionId(UUID permissionId);

    Optional<RolePermission> findByRoleIdAndPermissionId(UUID roleId, UUID permissionId);

    @Query("SELECT rp FROM RolePermission rp " +
           "JOIN FETCH rp.permission " +
           "WHERE rp.role.id = :roleId")
    List<RolePermission> findByRoleIdWithPermission(@Param("roleId") UUID roleId);

    void deleteByRoleId(UUID roleId);

    void deleteByPermissionId(UUID permissionId);

    boolean existsByRoleIdAndPermissionId(UUID roleId, UUID permissionId);
}
