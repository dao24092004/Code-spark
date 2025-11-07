package com.dao.identity_service.config;

import com.dao.identity_service.entity.Permission;
import com.dao.identity_service.entity.Role;
import com.dao.identity_service.entity.User;
import com.dao.identity_service.repository.PermissionRepository;
import com.dao.identity_service.repository.RoleRepository;
import com.dao.identity_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        initializePermissions();
        initializeRoles();
        initializeUsers();
    }

    private void initializePermissions() {
        createPermissionIfNotExists("USER_READ", "Read user information", "USER", "READ");
        createPermissionIfNotExists("USER_WRITE", "Create and update users", "USER", "WRITE");
        createPermissionIfNotExists("USER_DELETE", "Delete users", "USER", "DELETE");
        createPermissionIfNotExists("ROLE_READ", "Read role information", "ROLE", "READ");
        createPermissionIfNotExists("ROLE_WRITE", "Create and update roles", "ROLE", "WRITE");
        createPermissionIfNotExists("ROLE_DELETE", "Delete roles", "ROLE", "DELETE");
        createPermissionIfNotExists("FILE_READ", "Read files", "FILE", "READ");
        createPermissionIfNotExists("FILE_WRITE", "Upload and update files", "FILE", "WRITE");
        createPermissionIfNotExists("FILE_DELETE", "Delete files", "FILE", "DELETE");
        createPermissionIfNotExists("NOTIFICATION_STREAM", "Open notification stream (SSE)", "NOTIFICATION", "STREAM");
        createPermissionIfNotExists("PROFILE_ADMIN", "Create infomation for user", "PROFILE", "WRITE");
        createPermissionIfNotExists("PROFILE_USER", "Create infomation for user", "PROFILE", "WRITE");
        createPermissionIfNotExists("COURSE_READ", "Read course information", "COURSE", "READ");
        createPermissionIfNotExists("COURSE_CREATE", "Create courses", "COURSE", "CREATE");
        createPermissionIfNotExists("COURSE_WRITE", "Update courses", "COURSE", "WRITE");
        createPermissionIfNotExists("COURSE_DELETE", "Delete courses", "COURSE", "DELETE");
        createPermissionIfNotExists("MATERIAL_WRITE", "Create and update materials", "MATERIAL", "WRITE");
        createPermissionIfNotExists("MATERIAL_DELETE", "Delete materials", "MATERIAL", "DELETE");
        createPermissionIfNotExists("MULTISIG_READ", "Read course multisig wallet", "MULTISIG", "READ");
        createPermissionIfNotExists("MULTISIG_CREATE", "Create multisig wallet", "MULTISIG", "CREATE");
        createPermissionIfNotExists("MULTISIG_WRITE", "Update multisig wallet", "MULTISIG", "WRITE");
    }

    private void initializeRoles() {
        // Admin role with all permissions
        Role adminRole = createRoleIfNotExists("ADMIN", "System administrator with full access");
        if (adminRole != null) {
            Set<Permission> allPermissions = Set.of(
                    permissionRepository.findByName("USER_READ").orElseThrow(),
                    permissionRepository.findByName("USER_WRITE").orElseThrow(),
                    permissionRepository.findByName("USER_DELETE").orElseThrow(),
                    permissionRepository.findByName("ROLE_READ").orElseThrow(),
                    permissionRepository.findByName("ROLE_WRITE").orElseThrow(),
                    permissionRepository.findByName("ROLE_DELETE").orElseThrow(),
                    permissionRepository.findByName("FILE_READ").orElseThrow(),
                    permissionRepository.findByName("FILE_WRITE").orElseThrow(),
                    permissionRepository.findByName("FILE_DELETE").orElseThrow(),
                    permissionRepository.findByName("PROFILE_ADMIN").orElseThrow(),
                    permissionRepository.findByName("PROFILE_USER").orElseThrow(),
                    permissionRepository.findByName("NOTIFICATION_STREAM").orElseThrow(),
                    permissionRepository.findByName("COURSE_READ").orElseThrow(),
                    permissionRepository.findByName("COURSE_CREATE").orElseThrow(),
                    permissionRepository.findByName("COURSE_WRITE").orElseThrow(),
                    permissionRepository.findByName("COURSE_DELETE").orElseThrow(),
                    permissionRepository.findByName("MATERIAL_WRITE").orElseThrow(),
                    permissionRepository.findByName("MATERIAL_DELETE").orElseThrow(),
                    permissionRepository.findByName("MULTISIG_READ").orElseThrow(),
                    permissionRepository.findByName("MULTISIG_CREATE").orElseThrow(),
                    permissionRepository.findByName("MULTISIG_WRITE").orElseThrow()
            );
            adminRole.setPermissions(allPermissions);
            roleRepository.save(adminRole);
        }

        // User role with basic permissions
        Role userRole = createRoleIfNotExists("USER", "Regular user with basic permissions");
        if (userRole != null) {
            Set<Permission> userPermissions = Set.of(
                    permissionRepository.findByName("USER_READ").orElseThrow(),
                    permissionRepository.findByName("FILE_READ").orElseThrow(),
                    permissionRepository.findByName("FILE_WRITE").orElseThrow(),
                    permissionRepository.findByName("PROFILE_USER").orElseThrow(),
                    permissionRepository.findByName("NOTIFICATION_STREAM").orElseThrow(),
                    permissionRepository.findByName("COURSE_READ").orElseThrow(),
                    permissionRepository.findByName("MULTISIG_READ").orElseThrow()
            );
            userRole.setPermissions(userPermissions);
            roleRepository.save(userRole);
        }

        // Manager role with moderate permissions
        Role managerRole = createRoleIfNotExists("MANAGER", "Manager with user management permissions");
        if (managerRole != null) {
            Set<Permission> managerPermissions = Set.of(
                    permissionRepository.findByName("USER_READ").orElseThrow(),
                    permissionRepository.findByName("USER_WRITE").orElseThrow(),
                    permissionRepository.findByName("ROLE_READ").orElseThrow(),
                    permissionRepository.findByName("FILE_READ").orElseThrow(),
                    permissionRepository.findByName("FILE_WRITE").orElseThrow(),
                    permissionRepository.findByName("FILE_DELETE").orElseThrow()
            );
            managerRole.setPermissions(managerPermissions);
            roleRepository.save(managerRole);
        }
    }

    private void initializeUsers() {
        // Create default admin user
        if (!userRepository.existsByUsername("admin")) {
            Role adminRole = roleRepository.findByName("ADMIN").orElseThrow();
            User admin = User.builder()
                    .username("admin")
                    .email("admin@codespark.com")
                    .password(passwordEncoder.encode("admin123"))
                    .firstName("System")
                    .lastName("Administrator")
                    .roles(Set.of(adminRole))
                    .build();
            userRepository.save(admin);
            log.info("Created default admin user: admin@codespark.com / admin123");
        }

        // Create default regular user
        if (!userRepository.existsByUsername("user")) {
            Role userRole = roleRepository.findByName("USER").orElseThrow();
            User user = User.builder()
                    .username("user")
                    .email("user@codespark.com")
                    .password(passwordEncoder.encode("user123"))
                    .firstName("Regular")
                    .lastName("User")
                    .roles(Set.of(userRole))
                    .build();
            userRepository.save(user);
            log.info("Created default user: user@codespark.com / user123");
        }
    }

    private Permission createPermissionIfNotExists(String name, String description, String resource, String action) {
        if (!permissionRepository.existsByName(name)) {
            Permission permission = Permission.builder()
                    .name(name)
                    .description(description)
                    .resource(resource)
                    .action(action)
                    .build();
            return permissionRepository.save(permission);
        }
        return null;
    }

    private Role createRoleIfNotExists(String name, String description) {
        if (!roleRepository.existsByName(name)) {
            Role role = Role.builder()
                    .name(name)
                    .description(description)
                    .build();
            return roleRepository.save(role);
        }
        return roleRepository.findByName(name).orElse(null);
    }
}