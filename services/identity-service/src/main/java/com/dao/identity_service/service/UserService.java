package com.dao.identity_service.service;

import com.dao.identity_service.dto.RegisterRequest;
import com.dao.identity_service.dto.UpdateUserRequest;
import com.dao.identity_service.dto.UserDto;
import com.dao.identity_service.entity.Role;
import com.dao.identity_service.entity.User;
import com.dao.identity_service.entity.UserRole;
import com.dao.identity_service.exception.BadRequestException;
import com.dao.identity_service.exception.ResourceAlreadyExistsException;
import com.dao.identity_service.exception.ResourceNotFoundException;
import com.dao.identity_service.mapper.UserMapper;
import com.dao.identity_service.repository.RoleRepository;
import com.dao.identity_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String usernameOrEmail) throws UsernameNotFoundException {
        if (usernameOrEmail.contains("@")) {
            return userRepository.findByEmailWithRolesAndPermissions(usernameOrEmail)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found: " + usernameOrEmail));
        } else {
            return userRepository.findByUsernameWithRolesAndPermissions(usernameOrEmail)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found: " + usernameOrEmail));
        }
    }

    @Transactional(readOnly = true)
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    @Transactional(readOnly = true)
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Transactional(readOnly = true)
    public Optional<User> findByUsernameOrEmail(String usernameOrEmail) {
        return userRepository.findByUsernameOrEmail(usernameOrEmail, usernameOrEmail);
    }

    @Transactional(readOnly = true)
    public Optional<User> findById(UUID id) {
        return userRepository.findById(id);
    }

    public UserDto createUser(RegisterRequest request) {
        log.info("Creating new user: {}", request.getUsername());

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ResourceAlreadyExistsException("User", "username", request.getUsername());
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResourceAlreadyExistsException("User", "email", request.getEmail());
        }

        User user = userMapper.toEntity(request);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        if (user.getUserRoles() == null || user.getUserRoles().isEmpty()) {
            Role defaultRole = roleRepository.findByName("USER")
                    .orElseThrow(() -> new ResourceNotFoundException("Role", "name", "USER"));
            UserRole userRole = UserRole.builder()
                    .user(user)
                    .role(defaultRole)
                    .build();
            user.getUserRoles().add(userRole);
        }

        User savedUser = userRepository.save(user);
        log.info("Successfully created user with id: {}", savedUser.getId());

        return userMapper.toDto(savedUser);
    }

    public UserDto updateUser(UUID id, UpdateUserRequest request) {
        log.info("Updating user with id: {}", id);

        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        if (request.getEmail() != null && !request.getEmail().equals(existingUser.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new ResourceAlreadyExistsException("User", "email", request.getEmail());
            }
        }

        userMapper.updateEntity(existingUser, request);
        User savedUser = userRepository.save(existingUser);

        log.info("Successfully updated user with id: {}", savedUser.getId());
        return userMapper.toDto(savedUser);
    }

    public void updateLastLogin(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);
    }

    public UserDto assignRoles(UUID userId, Set<String> roleNames) {
        log.info("Assigning roles {} to user {}", roleNames, userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Set<Role> roles = roleRepository.findByNameInWithPermissions(roleNames);
        if (roles.size() != roleNames.size()) {
            throw new ResourceNotFoundException("Role", "names", roleNames);
        }

        for (Role role : roles) {
            UserRole userRole = UserRole.builder()
                    .user(user)
                    .role(role)
                    .build();
            user.getUserRoles().add(userRole);
        }

        User savedUser = userRepository.save(user);
        log.info("Successfully assigned {} roles to user {}", roles.size(), userId);
        return userMapper.toDto(savedUser);
    }

    public void deleteUser(UUID id) {
        log.info("Deleting user with id: {}", id);

        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User", "id", id);
        }
        userRepository.deleteById(id);
        log.info("Successfully deleted user with id: {}", id);
    }

    @Transactional(readOnly = true)
    public List<UserDto> findAllUsers() {
        if (userRepository == null) {
            throw new IllegalStateException("UserRepository is not initialized");
        }
        return userRepository.findAll().stream()
                .map(userMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<UserDto> findAllUsers(Pageable pageable) {
        if (userRepository == null) {
            throw new IllegalStateException("UserRepository is not initialized");
        }
        return userRepository.findAll(pageable)
                .map(userMapper::toDto);
    }

    @Transactional(readOnly = true)
    public UserDto findUserById(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        return userMapper.toDto(user);
    }

    public UserDto enableUser(UUID id) {
        log.info("Enabling user with id: {}", id);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        user.setIsEnabled(true);
        User savedUser = userRepository.save(user);

        log.info("Successfully enabled user with id: {}", id);
        return userMapper.toDto(savedUser);
    }

    public UserDto disableUser(UUID id) {
        log.info("Disabling user with id: {}", id);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        user.setIsEnabled(false);
        User savedUser = userRepository.save(user);

        log.info("Successfully disabled user with id: {}", id);
        return userMapper.toDto(savedUser);
    }

    public User processOAuth2User(String email, String name, String avatarUrl) {
        Optional<User> userOptional = userRepository.findByEmail(email);
        if (userOptional.isPresent()) {
            return userOptional.get();
        } else {
            return createOAuth2User(email, name, avatarUrl);
        }
    }

    private User createOAuth2User(String email, String name, String avatarUrl) {
        log.info("Creating new user from OAuth2: {}", email);

        User user = new User();
        user.setEmail(email);
        user.setUsername(email);
        user.setFirstName(name);
        user.setAvatarUrl(avatarUrl);
        user.setIsEnabled(true);
        user.setStatus("ACTIVE");
        user.setCreatedAt(LocalDateTime.now());

        Role defaultRole = roleRepository.findByName("USER")
                .orElseThrow(() -> new ResourceNotFoundException("Role", "name", "USER"));
        UserRole userRole = UserRole.builder()
                .user(user)
                .role(defaultRole)
                .build();
        user.getUserRoles().add(userRole);

        return userRepository.save(user);
    }

    public void changePassword(String username, String oldPassword, String newPassword) {
        log.info("Changing password for user: {}", username);

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        log.info("Successfully changed password for user: {}", username);
    }
}
