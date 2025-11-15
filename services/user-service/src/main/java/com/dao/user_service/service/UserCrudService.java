package com.dao.user_service.service;

import com.dao.user_service.dto.CreateUserRequest;
import com.dao.user_service.dto.UpdateUserRequest;
import com.dao.user_service.dto.UserResponse;
import com.dao.user_service.entity.Role;
import com.dao.user_service.entity.User;
import com.dao.user_service.exception.DuplicateResourceException;
import com.dao.user_service.exception.ResourceNotFoundException;
import com.dao.user_service.mapper.UserMapper;
import com.dao.user_service.repository.RoleRepository;
import com.dao.user_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UserCrudService {

    private static final String DEFAULT_ROLE = "USER";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;

    public UserResponse createUser(CreateUserRequest request) {
        log.info("Creating user with username={} email={}", request.getUsername(), request.getEmail());

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateResourceException("User", "username", request.getUsername());
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("User", "email", request.getEmail());
        }

        User user = userMapper.toEntity(request);
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        Set<Role> roles = resolveRoles(request.getRoleNames());
        user.setRoles(roles);

        User saved = userRepository.save(user);
        log.info("Created user id={}", saved.getId());
        return userMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public Page<UserResponse> getUsers(Pageable pageable) {
        return userRepository.findAll(pageable)
                .map(userMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public UserResponse getUser(Long id) {
        User user = userRepository.findWithRolesById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        return userMapper.toResponse(user);
    }

    public UserResponse updateUser(Long id, UpdateUserRequest request) {
        log.info("Updating user id={}", id);
        User user = userRepository.findWithRolesById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        if (request.getUsername() != null && !request.getUsername().equals(user.getUsername())
                && userRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateResourceException("User", "username", request.getUsername());
        }
        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())
                && userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("User", "email", request.getEmail());
        }

        if (request.getRoleNames() != null) {
            Set<Role> roles = resolveRoles(request.getRoleNames());
            user.getRoles().clear();
            user.getRoles().addAll(roles);
        }

        if (request.getPassword() != null) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        userMapper.updateEntity(user, request);
        User saved = userRepository.save(user);
        log.info("Updated user id={}", saved.getId());
        return userMapper.toResponse(saved);
    }

    public void deleteUser(Long id) {
        log.info("Deleting user id={}", id);
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User", "id", id);
        }
        userRepository.deleteById(id);
    }

    private Set<Role> resolveRoles(Set<String> requestedRoleNames) {
        Set<String> roleNames = (requestedRoleNames == null || requestedRoleNames.isEmpty())
                ? Collections.singleton(DEFAULT_ROLE)
                : requestedRoleNames.stream()
                        .map(name -> name.trim().toUpperCase(Locale.ROOT))
                        .collect(Collectors.toSet());

        Set<Role> roles = roleRepository.findByNameIn(roleNames);
        if (roles.size() != roleNames.size()) {
            Set<String> foundRoleNames = roles.stream()
                    .map(Role::getName)
                    .collect(Collectors.toSet());
            Set<String> missingRoles = roleNames.stream()
                    .filter(name -> !foundRoleNames.contains(name))
                    .collect(Collectors.toSet());
            log.error("Roles not found: {}", missingRoles);
            throw new ResourceNotFoundException("Role", "names", missingRoles);
        }
        return roles;
    }
}
