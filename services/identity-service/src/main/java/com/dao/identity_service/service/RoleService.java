package com.dao.identity_service.service;

import com.dao.identity_service.dto.CreateRoleRequest;
import com.dao.identity_service.dto.RoleDto;
import com.dao.identity_service.entity.Permission;
import com.dao.identity_service.entity.Role;
import com.dao.identity_service.exception.ResourceAlreadyExistsException;
import com.dao.identity_service.exception.ResourceNotFoundException;
import com.dao.identity_service.mapper.RoleMapper;
import com.dao.identity_service.repository.PermissionRepository;
import com.dao.identity_service.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class RoleService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
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
    public RoleDto findRoleById(Long id) {
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

        Role role = roleMapper.toEntity(request);

        // Assign permissions if provided
        if (request.getPermissionIds() != null && !request.getPermissionIds().isEmpty()) {
            Set<Permission> permissions = permissionRepository.findAllById(request.getPermissionIds())
                    .stream()
                    .collect(Collectors.toSet());
            
            if (permissions.size() != request.getPermissionIds().size()) {
                throw new ResourceNotFoundException("Permission", "ids", request.getPermissionIds());
            }
            
            role.setPermissions(permissions);
        }

        Role savedRole = roleRepository.save(role);
        log.info("Successfully created role with id: {}", savedRole.getId());
        
        return roleMapper.toDto(savedRole);
    }

    public RoleDto updateRole(Long id, CreateRoleRequest request) {
        log.info("Updating role with id: {}", id);

        Role existingRole = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "id", id));

        // Check if name is being changed and if it already exists
        if (!existingRole.getName().equals(request.getName()) && 
            roleRepository.existsByName(request.getName())) {
            throw new ResourceAlreadyExistsException("Role", "name", request.getName());
        }

        roleMapper.updateEntity(existingRole, request);

        // Update permissions if provided
        if (request.getPermissionIds() != null) {
            if (request.getPermissionIds().isEmpty()) {
                existingRole.getPermissions().clear();
            } else {
                Set<Permission> permissions = permissionRepository.findAllById(request.getPermissionIds())
                        .stream()
                        .collect(Collectors.toSet());
                
                if (permissions.size() != request.getPermissionIds().size()) {
                    throw new ResourceNotFoundException("Permission", "ids", request.getPermissionIds());
                }
                
                existingRole.setPermissions(permissions);
            }
        }

        Role savedRole = roleRepository.save(existingRole);
        log.info("Successfully updated role with id: {}", savedRole.getId());
        
        return roleMapper.toDto(savedRole);
    }

    /**
     * Thay thế toàn bộ permissions của role bằng danh sách mới
     */
    public RoleDto assignPermissions(Long roleId, Set<Long> permissionIds) {
        log.info("Replacing all permissions for role {} with: {}", roleId, permissionIds);

        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "id", roleId));

        Set<Permission> permissions = permissionRepository.findAllById(permissionIds)
                .stream()
                .collect(Collectors.toSet());

        if (permissions.size() != permissionIds.size()) {
            throw new ResourceNotFoundException("Permission", "ids", permissionIds);
        }

        role.setPermissions(permissions);
        Role savedRole = roleRepository.save(role);
        
        log.info("Successfully assigned {} permissions to role {}", permissions.size(), roleId);
        return roleMapper.toDto(savedRole);
    }
    
    /**
     * Thêm permissions vào role hiện có (không xóa permissions cũ)
     */
    public RoleDto addPermissions(Long roleId, Set<Long> permissionIds) {
        log.info("Adding permissions {} to role {}", permissionIds, roleId);

        if (permissionIds == null || permissionIds.isEmpty()) {
            return findRoleById(roleId);
        }

        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "id", roleId));

        Set<Long> existingPermissionIds = role.getPermissions().stream()
                .map(Permission::getId)
                .collect(Collectors.toSet());
                
        // Lọc ra chỉ các permission chưa có trong role
        Set<Long> newPermissionIds = permissionIds.stream()
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

        role.getPermissions().addAll(permissionsToAdd);
        Role savedRole = roleRepository.save(role);
        
        log.info("Successfully added {} new permissions to role {}", permissionsToAdd.size(), roleId);
        return roleMapper.toDto(savedRole);
    }
    
    /**
     * Thay thế toàn bộ permissions của role (tương tự assignPermissions cũ)
     * Được giữ lại để tương thích ngược
     */
    public RoleDto replacePermissions(Long roleId, Set<Long> permissionIds) {
        return assignPermissions(roleId, permissionIds);
    }

    public RoleDto removePermissions(Long roleId, Set<Long> permissionIds) {
        log.info("Removing permissions {} from role {}", permissionIds, roleId);

        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "id", roleId));

        Set<Permission> permissionsToRemove = permissionRepository.findAllById(permissionIds)
                .stream()
                .collect(Collectors.toSet());

        role.getPermissions().removeAll(permissionsToRemove);
        Role savedRole = roleRepository.save(role);
        
        log.info("Successfully removed {} permissions from role {}", permissionsToRemove.size(), roleId);
        return roleMapper.toDto(savedRole);
    }

    public void deleteRole(Long id) {
        log.info("Deleting role with id: {}", id);

        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "id", id));

        // Check if role is assigned to any users
        if (!role.getUsers().isEmpty()) {
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