package com.dao.identity_service.service;

import com.dao.identity_service.dto.CreateRoleRequest;
import com.dao.identity_service.dto.RoleDto;
import com.dao.identity_service.entity.Permission;
import com.dao.identity_service.entity.Role;
import com.dao.identity_service.entity.RolePermission;
import com.dao.identity_service.exception.ResourceAlreadyExistsException;
import com.dao.identity_service.exception.ResourceNotFoundException;
import com.dao.identity_service.mapper.RoleMapper;
import com.dao.identity_service.repository.PermissionRepository;
import com.dao.identity_service.repository.RoleRepository;
import com.dao.identity_service.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class RoleService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final UserRoleRepository userRoleRepository;
    private final RoleMapper roleMapper;

    @Transactional(readOnly = true)
    public List<RoleDto> findAllRoles() {
        return roleRepository.findAll().stream()
                .map(roleMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<RoleDto> findAllRoles(Pageable pageable) {
        return roleRepository.findAll(pageable)
                .map(roleMapper::toDto);
    }

    @Transactional(readOnly = true)
    public RoleDto findRoleById(UUID id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "id", id));
        return roleMapper.toDto(role);
    }

    @Transactional(readOnly = true)
    public RoleDto findRoleByName(String name) {
        Role role = roleRepository.findByNameWithPermissions(name)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "name", name));
        return roleMapper.toDto(role);
    }

    public RoleDto createRole(CreateRoleRequest request) {
        log.info("Creating new role: {}", request.getName());

        if (roleRepository.existsByName(request.getName())) {
            throw new ResourceAlreadyExistsException("Role", "name", request.getName());
        }

        Role role = Role.builder()
                .name(request.getName())
                .description(request.getDescription())
                .build();

        if (request.getPermissionIds() != null && !request.getPermissionIds().isEmpty()) {
            Set<Permission> permissions = permissionRepository.findAllById(request.getPermissionIds())
                    .stream()
                    .collect(Collectors.toSet());

            if (permissions.size() != request.getPermissionIds().size()) {
                throw new ResourceNotFoundException("Permission", "ids", request.getPermissionIds());
            }

            for (Permission permission : permissions) {
                RolePermission rp = RolePermission.builder()
                        .role(role)
                        .permission(permission)
                        .build();
                role.getRolePermissions().add(rp);
            }
        }

        Role savedRole = roleRepository.save(role);
        log.info("Successfully created role with id: {}", savedRole.getId());

        return roleMapper.toDto(savedRole);
    }

    public RoleDto updateRole(UUID id, CreateRoleRequest request) {
        log.info("Updating role with id: {}", id);

        Role existingRole = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "id", id));

        if (!existingRole.getName().equals(request.getName()) &&
            roleRepository.existsByName(request.getName())) {
            throw new ResourceAlreadyExistsException("Role", "name", request.getName());
        }

        existingRole.setName(request.getName());
        existingRole.setDescription(request.getDescription());

        if (request.getPermissionIds() != null) {
            if (request.getPermissionIds().isEmpty()) {
                existingRole.getRolePermissions().clear();
            } else {
                Set<Permission> permissions = permissionRepository.findAllById(request.getPermissionIds())
                        .stream()
                        .collect(Collectors.toSet());

                if (permissions.size() != request.getPermissionIds().size()) {
                    throw new ResourceNotFoundException("Permission", "ids", request.getPermissionIds());
                }

                existingRole.getRolePermissions().clear();

                for (Permission permission : permissions) {
                    RolePermission rp = RolePermission.builder()
                            .role(existingRole)
                            .permission(permission)
                            .build();
                    existingRole.getRolePermissions().add(rp);
                }
            }
        }

        Role savedRole = roleRepository.save(existingRole);
        log.info("Successfully updated role with id: {}", savedRole.getId());

        return roleMapper.toDto(savedRole);
    }

    public RoleDto assignPermissions(UUID roleId, Set<UUID> permissionIds) {
        log.info("Replacing all permissions for role {} with: {}", roleId, permissionIds);

        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "id", roleId));

        Set<Permission> permissions = permissionRepository.findAllById(permissionIds)
                .stream()
                .collect(Collectors.toSet());

        if (permissions.size() != permissionIds.size()) {
            throw new ResourceNotFoundException("Permission", "ids", permissionIds);
        }

        role.getRolePermissions().clear();

        for (Permission permission : permissions) {
            RolePermission rp = RolePermission.builder()
                    .role(role)
                    .permission(permission)
                    .build();
            role.getRolePermissions().add(rp);
        }

        Role savedRole = roleRepository.save(role);
        log.info("Successfully assigned {} permissions to role {}", permissions.size(), roleId);
        return roleMapper.toDto(savedRole);
    }

    public RoleDto addPermissions(UUID roleId, Set<UUID> permissionIds) {
        log.info("Adding permissions {} to role {}", permissionIds, roleId);

        if (permissionIds == null || permissionIds.isEmpty()) {
            return findRoleById(roleId);
        }

        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "id", roleId));

        Set<UUID> existingPermissionIds = role.getRolePermissions().stream()
                .map(rp -> rp.getPermission().getId())
                .collect(Collectors.toSet());

        Set<UUID> newPermissionIds = permissionIds.stream()
                .filter(id -> !existingPermissionIds.contains(id))
                .collect(Collectors.toSet());

        if (newPermissionIds.isEmpty()) {
            log.info("No new permissions to add to role {}", roleId);
            return roleMapper.toDto(role);
        }

        Set<Permission> permissionsToAdd = permissionRepository.findAllById(newPermissionIds)
                .stream()
                .collect(Collectors.toSet());

        if (permissionsToAdd.size() != newPermissionIds.size()) {
            throw new ResourceNotFoundException("Permission", "ids", newPermissionIds);
        }

        for (Permission permission : permissionsToAdd) {
            RolePermission rp = RolePermission.builder()
                    .role(role)
                    .permission(permission)
                    .build();
            role.getRolePermissions().add(rp);
        }

        Role savedRole = roleRepository.save(role);
        log.info("Successfully added {} new permissions to role {}", permissionsToAdd.size(), roleId);
        return roleMapper.toDto(savedRole);
    }

    public RoleDto replacePermissions(UUID roleId, Set<UUID> permissionIds) {
        return assignPermissions(roleId, permissionIds);
    }

    public RoleDto removePermissions(UUID roleId, Set<UUID> permissionIds) {
        log.info("Removing permissions {} from role {}", permissionIds, roleId);

        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "id", roleId));

        role.getRolePermissions().removeIf(rp ->
                permissionIds.contains(rp.getPermission().getId()));

        Role savedRole = roleRepository.save(role);
        log.info("Successfully removed {} permissions from role {}", permissionIds.size(), roleId);
        return roleMapper.toDto(savedRole);
    }

    public void deleteRole(UUID id) {
        log.info("Deleting role with id: {}", id);

        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "id", id));

        if (!userRoleRepository.findByRoleId(id).isEmpty()) {
            throw new RuntimeException("Cannot delete role that is assigned to users. Please reassign users first.");
        }

        roleRepository.deleteById(id);
        log.info("Successfully deleted role with id: {}", id);
    }

    @Transactional(readOnly = true)
    public boolean existsByName(String name) {
        return roleRepository.existsByName(name);
    }
}
