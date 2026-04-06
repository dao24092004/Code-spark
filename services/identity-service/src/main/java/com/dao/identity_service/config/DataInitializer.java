package com.dao.identity_service.config;

import com.dao.identity_service.entity.*;
import com.dao.identity_service.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Set;

@Configuration
@RequiredArgsConstructor
@Slf4j
@Profile("!test")
public class DataInitializer {

    private final PermissionRepository permissionRepository;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    CommandLineRunner initData() {
        return args -> {
            if (roleRepository.count() > 0) {
                log.info("Data already initialized, skipping...");
                return;
            }

            log.info("Initializing default data...");

            Permission userRead = createPermissionIfNotExists("USER_READ", "users", "read");
            Permission userWrite = createPermissionIfNotExists("USER_WRITE", "users", "write");
            Permission userDelete = createPermissionIfNotExists("USER_DELETE", "users", "delete");
            Permission roleRead = createPermissionIfNotExists("ROLE_READ", "roles", "read");
            Permission roleWrite = createPermissionIfNotExists("ROLE_WRITE", "roles", "write");
            Permission roleDelete = createPermissionIfNotExists("ROLE_DELETE", "roles", "delete");
            Permission permRead = createPermissionIfNotExists("PERMISSION_READ", "permissions", "read");
            Permission permWrite = createPermissionIfNotExists("PERMISSION_WRITE", "permissions", "write");
            Permission adminPanel = createPermissionIfNotExists("ADMIN_PANEL", "admin", "access");

            Role adminRole = createRoleWithPermissions("ADMIN", "Administrator role", Set.of(userRead, userWrite, userDelete, roleRead, roleWrite, roleDelete, permRead, permWrite, adminPanel));
            Role userRole = createRoleWithPermissions("USER", "Standard user role", Set.of(userRead));
            Role teacherRole = createRoleWithPermissions("TEACHER", "Teacher role", Set.of(userRead));

            createUser("admin", "admin@codespark.com", "Admin123!", "Admin", "User", adminRole);
            createUser("teacher", "teacher@codespark.com", "Teacher123!", "Teacher", "User", teacherRole);
            createUser("user", "user@codespark.com", "User123!", "Normal", "User", userRole);

            log.info("Data initialization completed");
        };
    }

    private Permission createPermissionIfNotExists(String name, String resource, String action) {
        return permissionRepository.findByName(name).orElseGet(() -> {
            Permission permission = Permission.builder()
                    .name(name)
                    .description("Permission to " + action + " " + resource)
                    .resource(resource)
                    .action(action)
                    .build();
            return permissionRepository.save(permission);
        });
    }

    private Role createRoleWithPermissions(String name, String description, Set<Permission> permissions) {
        return roleRepository.findByName(name).orElseGet(() -> {
            Role role = Role.builder()
                    .name(name)
                    .description(description)
                    .build();
            permissions.forEach(perm -> {
                RolePermission rp = RolePermission.builder()
                        .role(role)
                        .permission(perm)
                        .build();
                role.getRolePermissions().add(rp);
            });
            return roleRepository.save(role);
        });
    }

    private User createUser(String username, String email, String password, String firstName, String lastName, Role role) {
        return userRepository.findByUsername(username).orElseGet(() -> {
            User user = User.builder()
                    .username(username)
                    .email(email)
                    .passwordHash(passwordEncoder.encode(password))
                    .firstName(firstName)
                    .lastName(lastName)
                    .status("ACTIVE")
                    .isEnabled(true)
                    .isEmailVerified(false)
                    .build();
            UserRole userRole = UserRole.builder()
                    .user(user)
                    .role(role)
                    .build();
            user.getUserRoles().add(userRole);
            return userRepository.save(user);
        });
    }
}
