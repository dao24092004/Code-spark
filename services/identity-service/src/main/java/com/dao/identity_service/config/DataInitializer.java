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
import java.util.stream.Collectors;
import java.util.stream.Stream;

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

            log.info("Initializing default data with comprehensive microservices permissions...");

            // ==========================================
            // A. BACKEND — Spring Boot Services
            // ==========================================

            // 1. Identity & 6. User Service
            Permission userRead = createPermissionIfNotExists("USER_READ", "users", "read");
            Permission userWrite = createPermissionIfNotExists("USER_WRITE", "users", "write");
            Permission userDelete = createPermissionIfNotExists("USER_DELETE", "users", "delete");
            Permission roleRead = createPermissionIfNotExists("ROLE_READ", "roles", "read");
            Permission roleWrite = createPermissionIfNotExists("ROLE_WRITE", "roles", "write");
            Permission roleDelete = createPermissionIfNotExists("ROLE_DELETE", "roles", "delete");
            Permission permRead = createPermissionIfNotExists("PERMISSION_READ", "permissions", "read");
            Permission permWrite = createPermissionIfNotExists("PERMISSION_WRITE", "permissions", "write");
            Permission adminPanel = createPermissionIfNotExists("ADMIN_PANEL", "admin", "access");

            // 2. Analytics Service
            Permission analyticsAdmin = createPermissionIfNotExists("ADMIN", "analytics", "admin_access");

            // 3. Course Service
            Permission courseRead = createPermissionIfNotExists("COURSE_READ", "courses", "read");
            Permission courseWrite = createPermissionIfNotExists("COURSE_WRITE", "courses", "write");
            Permission courseCreate = createPermissionIfNotExists("COURSE_CREATE", "courses", "create");
            Permission courseDelete = createPermissionIfNotExists("COURSE_DELETE", "courses", "delete");
            Permission courseAdmin = createPermissionIfNotExists("COURSE_ADMIN", "courses", "admin");
            Permission examServiceInter = createPermissionIfNotExists("EXAM_SERVICE", "services", "inter-service");
            Permission materialWrite = createPermissionIfNotExists("MATERIAL_WRITE", "materials", "write");
            Permission materialDelete = createPermissionIfNotExists("MATERIAL_DELETE", "materials", "delete");

            // 4. Profile Service
            Permission profileUser = createPermissionIfNotExists("PROFILE_USER", "profiles", "own_access");
            Permission profileAdmin = createPermissionIfNotExists("PROFILE_ADMIN", "profiles", "manage_all");

            // 5. Exam Service
            Permission examRoleAdmin = createPermissionIfNotExists("ROLE_ADMIN", "exams", "import_excel");

            // ==========================================
            // B. BACKEND — Node.js Services
            // ==========================================

            // 7. AI Service
            Permission aiGenerate = createPermissionIfNotExists("AI_GENERATE", "ai", "generate_content");
            Permission aiAnalyze = createPermissionIfNotExists("AI_ANALYZE", "ai", "analyze_data");
            Permission aiGenerateQuiz = createPermissionIfNotExists("AI_GENERATE_QUIZ", "ai", "generate_quiz");
            Permission aiChat = createPermissionIfNotExists("AI_CHAT", "ai", "chat");

            // 8. Copyright Service
            Permission fileRead = createPermissionIfNotExists("FILE_READ", "files", "read_stats");
            Permission fileWrite = createPermissionIfNotExists("FILE_WRITE", "files", "create_check_similarity");
            Permission fileDelete = createPermissionIfNotExists("FILE_DELETE", "files", "delete");

            // 9. Proctoring Service
            Permission proctoringEventsRead = createPermissionIfNotExists("proctoring:events:read", "proctoring",
                    "read_events");
            Permission proctoringSessionTerminate = createPermissionIfNotExists("PROCTORING_SESSION_TERMINATE",
                    "proctoring", "terminate_session");
            Permission proctoringSessionWarning = createPermissionIfNotExists("PROCTORING_SESSION_WARNING",
                    "proctoring", "send_warning");

            // 11. Token Reward Service
            Permission tokenGrant = createPermissionIfNotExists("token:grant", "tokens", "grant_reward");

            // 12. Online Exam Service
            Permission gradingManual = createPermissionIfNotExists("grading:manual", "grading", "manual_grade");

            // ==========================================
            // C. FRONTEND — Admin Panel (TypeScript)
            // ==========================================

            // 14. Admin Permissions
            Permission feUserMgmt = createPermissionIfNotExists("user_management", "admin_fe", "manage_users");
            Permission feContentMgmt = createPermissionIfNotExists("content_management", "admin_fe", "manage_content");
            Permission feSystemSettings = createPermissionIfNotExists("system_settings", "admin_fe", "manage_system");
            Permission feSecuritySettings = createPermissionIfNotExists("security_settings", "admin_fe",
                    "manage_security");
            Permission feAuditLogs = createPermissionIfNotExists("audit_logs", "admin_fe", "view_audit_logs");
            Permission feBackupRestore = createPermissionIfNotExists("backup_restore", "admin_fe", "backup_restore");
            Permission feDbMgmt = createPermissionIfNotExists("database_management", "admin_fe", "manage_database");
            Permission feApiMgmt = createPermissionIfNotExists("api_management", "admin_fe", "manage_apis");
            Permission feNotificationMgmt = createPermissionIfNotExists("notification_management", "admin_fe",
                    "manage_notifications");
            Permission feReportGen = createPermissionIfNotExists("report_generation", "admin_fe", "generate_reports");
            Permission feCertMgmt = createPermissionIfNotExists("certificate_management", "admin_fe",
                    "manage_certificates");
            Permission feOrgMgmt = createPermissionIfNotExists("organization_management", "admin_fe",
                    "manage_organizations");
            Permission feCourseMgmt = createPermissionIfNotExists("course_management", "admin_fe", "manage_courses");
            Permission feExamMgmt = createPermissionIfNotExists("exam_management", "admin_fe", "manage_exams");
            Permission feProctoringMgmt = createPermissionIfNotExists("proctoring_management", "admin_fe",
                    "manage_proctoring");
            Permission feBlockchainMgmt = createPermissionIfNotExists("blockchain_management", "admin_fe",
                    "manage_blockchain");
            Permission feTokenMgmt = createPermissionIfNotExists("token_management", "admin_fe", "manage_tokens");
            Permission feAnalyticsAccess = createPermissionIfNotExists("analytics_access", "admin_fe",
                    "access_analytics");
            Permission feExportData = createPermissionIfNotExists("export_data", "admin_fe", "export_data");
            Permission feImportData = createPermissionIfNotExists("import_data", "admin_fe", "import_data");

            // ==========================================
            // ROLE ASSIGNMENTS
            // ==========================================

            // Super Admin: Cấp toàn bộ quyền
            Set<Permission> adminPermissions = Stream.of(
                    userRead, userWrite, userDelete, roleRead, roleWrite, roleDelete, permRead, permWrite, adminPanel,
                    analyticsAdmin, courseRead, courseWrite, courseCreate, courseDelete, courseAdmin, examServiceInter,
                    materialWrite, materialDelete,
                    profileUser, profileAdmin, examRoleAdmin,
                    aiGenerate, aiAnalyze, aiGenerateQuiz, aiChat,
                    fileRead, fileWrite, fileDelete,
                    proctoringEventsRead, proctoringSessionTerminate, proctoringSessionWarning,
                    tokenGrant, gradingManual,
                    feUserMgmt, feContentMgmt, feSystemSettings, feSecuritySettings, feAuditLogs, feBackupRestore,
                    feDbMgmt, feApiMgmt, feNotificationMgmt, feReportGen, feCertMgmt, feOrgMgmt, feCourseMgmt,
                    feExamMgmt, feProctoringMgmt, feBlockchainMgmt, feTokenMgmt, feAnalyticsAccess, feExportData,
                    feImportData).collect(Collectors.toSet());

            // Teacher: Cấp quyền quản lý khóa học, chấm thi, AI, bản quyền và giám sát
            Set<Permission> teacherPermissions = Stream.of(
                    userRead, profileUser,
                    courseRead, courseWrite, courseCreate, courseDelete, materialWrite, materialDelete,
                    examRoleAdmin, gradingManual,
                    aiGenerate, aiAnalyze, aiGenerateQuiz, aiChat,
                    fileRead, fileWrite,
                    proctoringEventsRead, proctoringSessionTerminate, proctoringSessionWarning,
                    feContentMgmt, feCourseMgmt, feExamMgmt, feProctoringMgmt, feReportGen, adminPanel)
                    .collect(Collectors.toSet());

            // Standard User: Cấp quyền cơ bản
            Set<Permission> userPermissions = Stream.of(
                    userRead, profileUser, courseRead, aiChat).collect(Collectors.toSet());

            Role adminRole = createRoleWithPermissions("ADMIN", "Administrator role (super_admin)", adminPermissions);
            Role teacherRole = createRoleWithPermissions("TEACHER", "Teacher role (content & proctoring admin)",
                    teacherPermissions);
            Role userRole = createRoleWithPermissions("USER", "Standard user role", userPermissions);

            createUser("admin", "admin@codespark.com", "Admin123!", "Admin", "User", adminRole);
            createUser("teacher", "teacher@codespark.com", "Teacher123!", "Teacher", "User", teacherRole);
            createUser("user", "user@codespark.com", "User123!", "Normal", "User", userRole);

            log.info("Data initialization completed with all cross-service permissions");
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

    private User createUser(String username, String email, String password, String firstName, String lastName,
            Role role) {
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
// package com.dao.identity_service.config;

// import com.dao.identity_service.entity.*;
// import com.dao.identity_service.repository.*;
// import lombok.RequiredArgsConstructor;
// import lombok.extern.slf4j.Slf4j;
// import org.springframework.boot.CommandLineRunner;
// import org.springframework.context.annotation.Bean;
// import org.springframework.context.annotation.Configuration;
// import org.springframework.context.annotation.Profile;
// import org.springframework.security.crypto.password.PasswordEncoder;

// import java.util.Set;

// @Configuration
// @RequiredArgsConstructor
// @Slf4j
// @Profile("!test")
// public class DataInitializer {

// private final PermissionRepository permissionRepository;
// private final RoleRepository roleRepository;
// private final UserRepository userRepository;
// private final PasswordEncoder passwordEncoder;

// @Bean
// CommandLineRunner initData() {
// return args -> {
// if (roleRepository.count() > 0) {
// log.info("Data already initialized, skipping...");
// return;
// }

// log.info("Initializing default data...");

// Permission userRead = createPermissionIfNotExists("USER_READ", "users",
// "read");
// Permission userWrite = createPermissionIfNotExists("USER_WRITE", "users",
// "write");
// Permission userDelete = createPermissionIfNotExists("USER_DELETE", "users",
// "delete");
// Permission roleRead = createPermissionIfNotExists("ROLE_READ", "roles",
// "read");
// Permission roleWrite = createPermissionIfNotExists("ROLE_WRITE", "roles",
// "write");
// Permission roleDelete = createPermissionIfNotExists("ROLE_DELETE", "roles",
// "delete");
// Permission permRead = createPermissionIfNotExists("PERMISSION_READ",
// "permissions", "read");
// Permission permWrite = createPermissionIfNotExists("PERMISSION_WRITE",
// "permissions", "write");
// Permission adminPanel = createPermissionIfNotExists("ADMIN_PANEL", "admin",
// "access");

// Role adminRole = createRoleWithPermissions("ADMIN", "Administrator role",
// Set.of(userRead, userWrite, userDelete, roleRead, roleWrite, roleDelete,
// permRead, permWrite, adminPanel));
// Role userRole = createRoleWithPermissions("USER", "Standard user role",
// Set.of(userRead));
// Role teacherRole = createRoleWithPermissions("TEACHER", "Teacher role",
// Set.of(userRead));

// createUser("admin", "admin@codespark.com", "Admin123!", "Admin", "User",
// adminRole);
// createUser("teacher", "teacher@codespark.com", "Teacher123!", "Teacher",
// "User", teacherRole);
// createUser("user", "user@codespark.com", "User123!", "Normal", "User",
// userRole);

// log.info("Data initialization completed");
// };
// }

// private Permission createPermissionIfNotExists(String name, String resource,
// String action) {
// return permissionRepository.findByName(name).orElseGet(() -> {
// Permission permission = Permission.builder()
// .name(name)
// .description("Permission to " + action + " " + resource)
// .resource(resource)
// .action(action)
// .build();
// return permissionRepository.save(permission);
// });
// }

// private Role createRoleWithPermissions(String name, String description,
// Set<Permission> permissions) {
// return roleRepository.findByName(name).orElseGet(() -> {
// Role role = Role.builder()
// .name(name)
// .description(description)
// .build();
// permissions.forEach(perm -> {
// RolePermission rp = RolePermission.builder()
// .role(role)
// .permission(perm)
// .build();
// role.getRolePermissions().add(rp);
// });
// return roleRepository.save(role);
// });
// }

// private User createUser(String username, String email, String password,
// String firstName, String lastName, Role role) {
// return userRepository.findByUsername(username).orElseGet(() -> {
// User user = User.builder()
// .username(username)
// .email(email)
// .passwordHash(passwordEncoder.encode(password))
// .firstName(firstName)
// .lastName(lastName)
// .status("ACTIVE")
// .isEnabled(true)
// .isEmailVerified(false)
// .build();
// UserRole userRole = UserRole.builder()
// .user(user)
// .role(role)
// .build();
// user.getUserRoles().add(userRole);
// return userRepository.save(user);
// });
// }
// }
