package com.dao.profileservice.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.Optional;

/**
 * Profile Schema Migration Runner.
 *
 * <p>Chạy SAU Hibernate để tạo các bảng con (profile_certificates, profile_badges,
 * profile_completed_courses, profile_skills) theo đúng ERD.
 *
 * <p>Sử dụng DataSource RIÊNG (DriverManager) để không chiếm Hikari pool của Hibernate,
 * tránh lỗi "Connection is not available" khi pool bị exhaust.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1) // Chạy sau EntityManagerFactory creation
public class ProfileSchemaPatchRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(ProfileSchemaPatchRunner.class);

    private final DataSourceProperties dataSourceProperties;

    public ProfileSchemaPatchRunner(DataSourceProperties dataSourceProperties) {
        this.dataSourceProperties = dataSourceProperties;
    }

    @Override
    public void run(ApplicationArguments args) {
        log.info("=== Profile Schema Migration: BIGINT → UUID + ERD Schema ===");

        try {
            createNewSchema();
            ensureProfileChildForeignKeys();
            log.info("=== Profile Schema Migration completed ===");
        } catch (Exception ex) {
            log.error("Schema migration failed: {}", ex.getMessage(), ex);
        }
    }

    // ============================================================
    // CREATE bảng mới theo ERD — dùng connection riêng
    // ============================================================

    private void createNewSchema() {
        createProfilesTable();
        createProfileCertificatesTable();
        createProfileBadgesTable();
        createProfileCompletedCoursesTable();
        createProfileSkillsTable();
    }

    private void createProfilesTable() {
        if (tableExists("profiles")) {
            log.info("  Table 'profiles' already exists, skipping creation.");
            return;
        }
        log.info("  Creating table: profiles");
        execute("""
            CREATE TABLE profiles (
                id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id         UUID        NOT NULL UNIQUE,
                first_name      VARCHAR(100),
                last_name       VARCHAR(100),
                email           VARCHAR(255) NOT NULL,
                bio             TEXT,
                avatar_url      TEXT,
                token_balance   DECIMAL(20,2) DEFAULT 0,
                total_points    INTEGER     NOT NULL DEFAULT 0,
                courses_completed INTEGER   NOT NULL DEFAULT 0,
                exams_passed    INTEGER     NOT NULL DEFAULT 0,
                created_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """);
        execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id)");
        log.info("  ✓ Created table: profiles");
    }

    private void createProfileCertificatesTable() {
        if (tableExists("profile_certificates")) {
            log.info("  Table 'profile_certificates' already exists, skipping.");
            return;
        }
        log.info("  Creating table: profile_certificates");
        execute("""
            CREATE TABLE profile_certificates (
                id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                profile_id      UUID        NOT NULL,
                certificate_id  UUID        NOT NULL,
                title           VARCHAR(500),
                issuer          VARCHAR(255),
                issued_at       TIMESTAMP,
                credential_url  TEXT,
                created_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_pc_profile FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
            )
            """);
        execute("CREATE INDEX IF NOT EXISTS idx_profile_certificates_profile_id ON profile_certificates(profile_id)");
        execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_pc_profile_cert ON profile_certificates(profile_id, certificate_id)");
        log.info("  ✓ Created table: profile_certificates");
    }

    private void createProfileBadgesTable() {
        if (tableExists("profile_badges")) {
            log.info("  Table 'profile_badges' already exists, skipping.");
            return;
        }
        log.info("  Creating table: profile_badges");
        execute("""
            CREATE TABLE profile_badges (
                id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                profile_id      UUID        NOT NULL,
                badge_name      VARCHAR(100),
                badge_icon      VARCHAR(255),
                description     TEXT,
                earned_at       TIMESTAMP,
                certificate_id  UUID,
                course_id       UUID,
                created_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_pb_profile FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
            )
            """);
        execute("CREATE INDEX IF NOT EXISTS idx_profile_badges_profile_id ON profile_badges(profile_id)");
        execute("CREATE INDEX IF NOT EXISTS idx_profile_badges_badge_name ON profile_badges(badge_name)");
        log.info("  ✓ Created table: profile_badges");
    }

    private void createProfileCompletedCoursesTable() {
        if (tableExists("profile_completed_courses")) {
            log.info("  Table 'profile_completed_courses' already exists, skipping.");
            return;
        }
        log.info("  Creating table: profile_completed_courses");
        execute("""
            CREATE TABLE profile_completed_courses (
                id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                profile_id      UUID        NOT NULL,
                course_id       UUID        NOT NULL,
                completed_at    TIMESTAMP,
                final_score     INTEGER,
                created_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_pcc_profile FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
            )
            """);
        execute("CREATE INDEX IF NOT EXISTS idx_profile_completed_courses_profile_id ON profile_completed_courses(profile_id)");
        execute("CREATE INDEX IF NOT EXISTS idx_profile_completed_courses_course_id ON profile_completed_courses(course_id)");
        log.info("  ✓ Created table: profile_completed_courses");
    }

    private void createProfileSkillsTable() {
        if (tableExists("profile_skills")) {
            log.info("  Table 'profile_skills' already exists, skipping.");
            return;
        }
        log.info("  Creating table: profile_skills");
        execute("""
            CREATE TABLE profile_skills (
                id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                profile_id      UUID        NOT NULL,
                skill_name      VARCHAR(100),
                proficiency_level VARCHAR(50),
                certificate_id  UUID,
                earned_at       TIMESTAMP,
                created_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_ps_profile FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
            )
            """);
        execute("CREATE INDEX IF NOT EXISTS idx_profile_skills_profile_id ON profile_skills(profile_id)");
        execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_profile_skills_profile_skill ON profile_skills(profile_id, skill_name)");
        log.info("  ✓ Created table: profile_skills");
    }

    /**
     * Hibernate {@code ddl-auto: update} có thể tạo bảng con mà không có FK; IDE ERD đọc từ DB sẽ không vẽ nối tới {@code profiles}.
     * Bổ sung FK nếu thiếu (đặc biệt {@code profile_skills}), khớp tên constraint với DDL tạo bảng mới.
     */
    private void ensureProfileChildForeignKeys() {
        if (!tableExists("profiles")) {
            return;
        }
        record FkSpec(String table, String constraintName) {}
        FkSpec[] fks = new FkSpec[]{
                new FkSpec("profile_certificates", "fk_pc_profile"),
                new FkSpec("profile_badges", "fk_pb_profile"),
                new FkSpec("profile_completed_courses", "fk_pcc_profile"),
                new FkSpec("profile_skills", "fk_ps_profile")
        };
        log.info("  Ensuring profile_id foreign keys on child tables...");
        try (Connection conn = openMigrationConnection()) {
            if (!isProfilesPrimaryKeyUuid(conn)) {
                log.error("""
                        profiles.id KHÔNG phải kiểu uuid (còn schema BIGINT cũ). \
                        Các bảng con do Hibernate tạo dùng profile_id uuid → không thể thêm FK, ERD sẽ không có quan hệ. \
                        Hãy: DROP TABLE profile_skills, profile_completed_courses, profile_badges, profile_certificates, profiles; rồi khởi động lại service.""");
                return;
            }
            for (FkSpec fk : fks) {
                if (!tableExists(conn, fk.table())) {
                    continue;
                }
                Optional<String> existing = findProfileIdFkToProfiles(conn, fk.table());
                if (existing.isPresent()) {
                    if (!fk.constraintName().equalsIgnoreCase(existing.get())) {
                        log.info("  Table {} already has FK profile_id→profiles(id) as '{}'; ERD/DB đã đúng, bỏ qua đặt tên {}",
                                fk.table(), existing.get(), fk.constraintName());
                    }
                    continue;
                }
                String sql = "ALTER TABLE " + fk.table() + " ADD CONSTRAINT " + fk.constraintName()
                        + " FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE";
                try (Statement stmt = conn.createStatement()) {
                    stmt.execute(sql);
                    log.info("  ✓ Added missing FK {} on {}", fk.constraintName(), fk.table());
                } catch (Exception e) {
                    log.warn("  Could not add FK {} on {}: {}",
                            fk.constraintName(), fk.table(), e.getMessage());
                }
            }
        } catch (Exception e) {
            log.warn("  ensureProfileChildForeignKeys connection failed: {}", e.getMessage());
        }
    }

    /**
     * Bất kỳ FK nào từ {@code profile_id} trỏ tới {@code profiles.id} (Hibernate thường đặt tên khác {@code fk_ps_profile}).
     */
    private Optional<String> findProfileIdFkToProfiles(Connection conn, String tableName) throws Exception {
        String sql = """
                SELECT tc.constraint_name
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu
                  ON tc.constraint_schema = kcu.constraint_schema
                 AND tc.constraint_name = kcu.constraint_name
                JOIN information_schema.constraint_column_usage ccu
                  ON tc.constraint_schema = ccu.constraint_schema
                 AND tc.constraint_name = ccu.constraint_name
                WHERE tc.table_schema = 'public'
                  AND tc.table_name = ?
                  AND tc.constraint_type = 'FOREIGN KEY'
                  AND kcu.column_name = 'profile_id'
                  AND ccu.table_schema = 'public'
                  AND ccu.table_name = 'profiles'
                  AND ccu.column_name = 'id'
                """;
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, tableName.toLowerCase());
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(rs.getString(1));
                }
            }
        }
        return Optional.empty();
    }

    /** JPA dùng UUID; nếu DB còn bảng profiles cũ (id bigint) thì FK tới profile_id uuid là không hợp lệ. */
    private boolean isProfilesPrimaryKeyUuid(Connection conn) throws Exception {
        String sql = """
                SELECT c.data_type
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu
                  ON tc.constraint_schema = kcu.constraint_schema
                 AND tc.constraint_name = kcu.constraint_name
                JOIN information_schema.columns c
                  ON c.table_schema = kcu.table_schema
                 AND c.table_name = kcu.table_name
                 AND c.column_name = kcu.column_name
                WHERE tc.table_schema = 'public'
                  AND tc.table_name = 'profiles'
                  AND tc.constraint_type = 'PRIMARY KEY'
                  AND kcu.column_name = 'id'
                """;
        try (Statement st = conn.createStatement();
             ResultSet rs = st.executeQuery(sql)) {
            if (!rs.next()) {
                return false;
            }
            String dt = rs.getString(1);
            return dt != null && dt.toLowerCase().contains("uuid");
        }
    }

    // ============================================================
    // Helpers — mỗi lần lấy connection MỚI từ DriverManager
    // ============================================================

    /**
     * Một JDBC connection tạm (DriverManager), không tạo thêm Hikari pool — tránh leak pool như
     * {@code initializeDataSourceBuilder().build()} mỗi lần gọi.
     */
    private Connection openMigrationConnection() throws Exception {
        return DriverManager.getConnection(
                dataSourceProperties.getUrl(),
                dataSourceProperties.getUsername(),
                dataSourceProperties.getPassword());
    }

    private void execute(String sql) {
        try (Connection conn = openMigrationConnection();
             Statement stmt = conn.createStatement()) {
            stmt.execute(sql);
        } catch (Exception e) {
            throw new RuntimeException("Failed to execute: " + sql, e);
        }
    }

    private boolean tableExists(String tableName) {
        try (Connection conn = openMigrationConnection()) {
            return tableExists(conn, tableName);
        } catch (Exception e) {
            log.debug("tableExists check failed for {}: {}", tableName, e.getMessage());
            return false;
        }
    }

    private boolean tableExists(Connection conn, String tableName) throws Exception {
        DatabaseMetaData meta = conn.getMetaData();
        try (ResultSet rs = meta.getTables(null, "public", tableName.toLowerCase(), new String[]{"TABLE"})) {
            return rs.next();
        }
    }
}
