package com.dao.identity_service.service;

import com.dao.identity_service.dto.CreatePermissionRequest;
import com.dao.identity_service.dto.PermissionDto;
import com.dao.identity_service.entity.Permission;
import com.dao.identity_service.exception.ResourceAlreadyExistsException;
import com.dao.identity_service.exception.ResourceNotFoundException;
import com.dao.identity_service.mapper.PermissionMapper;
import com.dao.identity_service.repository.PermissionRepository;
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
public class PermissionService {

    private final PermissionRepository permissionRepository;
    private final PermissionMapper permissionMapper;

    @Transactional(readOnly = true)
    public List<PermissionDto> findAllPermissions() {
        return permissionRepository.findAll().stream()
                .map(permissionMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<PermissionDto> findAllPermissions(Pageable pageable) {
        return permissionRepository.findAll(pageable)
                .map(permissionMapper::toDto);
    }

    @Transactional(readOnly = true)
    public PermissionDto findPermissionById(Long id) {
        Permission permission = permissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Permission", "id", id));
        return permissionMapper.toDto(permission);
    }

    @Transactional(readOnly = true)
    public PermissionDto findPermissionByName(String name) {
        Permission permission = permissionRepository.findByName(name)
                .orElseThrow(() -> new ResourceNotFoundException("Permission", "name", name));
        return permissionMapper.toDto(permission);
    }

    @Transactional(readOnly = true)
    public List<PermissionDto> findPermissionsByResource(String resource) {
        return permissionRepository.findByResource(resource).stream()
                .map(permissionMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PermissionDto> findPermissionsByResourceAndAction(String resource, String action) {
        return permissionRepository.findByResourceAndAction(resource, action).stream()
                .map(permissionMapper::toDto)
                .collect(Collectors.toList());
    }

    public PermissionDto createPermission(CreatePermissionRequest request) {
        log.info("Creating new permission: {}", request.getName());

        if (permissionRepository.existsByName(request.getName())) {
            throw new ResourceAlreadyExistsException("Permission", "name", request.getName());
        }

        Permission permission = permissionMapper.toEntity(request);
        Permission savedPermission = permissionRepository.save(permission);
        
        log.info("Successfully created permission with id: {}", savedPermission.getId());
        return permissionMapper.toDto(savedPermission);
    }

    public PermissionDto updatePermission(Long id, CreatePermissionRequest request) {
        log.info("Updating permission with id: {}", id);

        Permission existingPermission = permissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Permission", "id", id));

        // Check if name is being changed and if it already exists
        if (!existingPermission.getName().equals(request.getName()) && 
            permissionRepository.existsByName(request.getName())) {
            throw new ResourceAlreadyExistsException("Permission", "name", request.getName());
        }

        permissionMapper.updateEntity(existingPermission, request);
        Permission savedPermission = permissionRepository.save(existingPermission);
        
        log.info("Successfully updated permission with id: {}", savedPermission.getId());
        return permissionMapper.toDto(savedPermission);
    }

    public void deletePermission(Long id) {
        log.info("Deleting permission with id: {}", id);

        Permission permission = permissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Permission", "id", id));

        // Check if permission is assigned to any roles
        if (!permission.getRoles().isEmpty()) {
            throw new RuntimeException("Cannot delete permission that is assigned to roles. Please remove from roles first.");
        }

        permissionRepository.deleteById(id);
        log.info("Successfully deleted permission with id: {}", id);
    }

    @Transactional(readOnly = true)
    public boolean existsByName(String name) {
        return permissionRepository.existsByName(name);
    }

    @Transactional(readOnly = true)
    public List<PermissionDto> findPermissionsByIds(Set<Long> ids) {
        return permissionRepository.findAllById(ids).stream()
                .map(permissionMapper::toDto)
                .collect(Collectors.toList());
    }
}