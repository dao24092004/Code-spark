package com.dao.examservice.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 1) Gỡ FK legacy trỏ tới {@code cm_quizzes} (trước khi migrate sang {@code exams}).
 * 2) Đảm bảo mỗi bảng con chỉ có <strong>một</strong> FK {@code exam_id} → {@code exams(id)} —
 *    tránh trùng do Hibernate tạo FK tên ngẫu nhiên + script cũ ADD CONSTRAINT tên cố định
 *    (ERD/DataGrip có thể vẽ 2 đường nối giữa cùng hai bảng).
 *
 * <p>Tên FK khớp {@code @JoinColumn(foreignKey = @ForeignKey(name = ...))} trên entity.</p>
 */
@Component
public class ExamSchemaPatchRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(ExamSchemaPatchRunner.class);

    private static final Set<String> EXAM_CHILD_TABLES = Set.of(
            "exam_tags", "exam_questions", "cm_exam_registrations");

    private static final String[][] TABLE_AND_FK = {
            {"exam_tags", "fk_exam_tags_exams"},
            {"exam_questions", "fk_exam_questions_exams"},
            {"cm_exam_registrations", "fk_cm_exam_registrations_exams"}
    };

    private final JdbcTemplate jdbcTemplate;

    public ExamSchemaPatchRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            dropForeignKeysReferencingCmQuizzes();
            for (String[] pair : TABLE_AND_FK) {
                ensureSingleExamIdForeignKey(pair[0], pair[1]);
            }
        } catch (DataAccessException ex) {
            log.warn("Could not align exam foreign keys.", ex);
        }
    }

    private void dropForeignKeysReferencingCmQuizzes() {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT con.conname AS conname, rel.relname AS table_name
                FROM pg_constraint con
                JOIN pg_class rel ON rel.oid = con.conrelid
                JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
                JOIN pg_class conf ON conf.oid = con.confrelid
                WHERE con.contype = 'f'
                  AND nsp.nspname = current_schema()
                  AND conf.relname = 'cm_quizzes'
                  AND rel.relname IN ('exam_tags', 'exam_questions', 'cm_exam_registrations')
                """);
        for (Map<String, Object> row : rows) {
            String table = (String) row.get("table_name");
            String conname = (String) row.get("conname");
            if (table == null || conname == null || !EXAM_CHILD_TABLES.contains(table)) {
                continue;
            }
            jdbcTemplate.execute(
                    "ALTER TABLE \"" + table + "\" DROP CONSTRAINT \"" + conname.replace("\"", "") + "\"");
            log.info("Dropped legacy FK {} on {}", conname, table);
        }
    }

    /**
     * Liệt kê mọi FK trên {@code exam_id} trỏ tới {@code exams.id} (information_schema).
     */
    private List<String> findExamIdForeignKeyNames(String tableName) {
        return jdbcTemplate.queryForList("""
                        SELECT tc.constraint_name
                        FROM information_schema.table_constraints tc
                        JOIN information_schema.key_column_usage kcu
                          ON tc.constraint_schema = kcu.constraint_schema
                         AND tc.constraint_name = kcu.constraint_name
                        JOIN information_schema.constraint_column_usage ccu
                          ON tc.constraint_schema = ccu.constraint_schema
                         AND tc.constraint_name = ccu.constraint_name
                        WHERE tc.table_schema = current_schema()
                          AND tc.table_name = ?
                          AND tc.constraint_type = 'FOREIGN KEY'
                          AND kcu.column_name = 'exam_id'
                          AND ccu.table_schema = current_schema()
                          AND ccu.table_name = 'exams'
                          AND ccu.column_name = 'id'
                        """,
                String.class,
                tableName);
    }

    private boolean tableExists(String tableName) {
        Integer n = jdbcTemplate.queryForObject("""
                        SELECT COUNT(*)::int
                        FROM information_schema.tables
                        WHERE table_schema = current_schema()
                          AND table_name = ?
                        """,
                Integer.class,
                tableName);
        return n != null && n > 0;
    }

    private void ensureSingleExamIdForeignKey(String tableName, String desiredName) {
        if (!tableExists(tableName) || !tableExists("exams")) {
            return;
        }
        List<String> existing = findExamIdForeignKeyNames(tableName);
        if (existing.isEmpty()) {
            addFk(tableName, desiredName);
            return;
        }
        boolean onlyOurs = existing.size() == 1 && desiredName.equalsIgnoreCase(existing.get(0));
        if (onlyOurs) {
            return;
        }
        if (existing.size() > 1) {
            log.warn("Table {} has {} FKs on exam_id→exams; removing duplicates, keeping {}",
                    tableName, existing.size(), desiredName);
        } else {
            log.info("Renaming/normalizing exam FK on {} from {} to {}",
                    tableName, existing.get(0), desiredName);
        }
        for (String conname : existing) {
            jdbcTemplate.execute(
                    "ALTER TABLE \"" + tableName + "\" DROP CONSTRAINT \"" + conname.replace("\"", "") + "\"");
        }
        addFk(tableName, desiredName);
    }

    private void addFk(String tableName, String constraintName) {
        jdbcTemplate.execute("""
                ALTER TABLE "%s" ADD CONSTRAINT %s
                FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
                """.formatted(tableName, constraintName));
        log.info("Added FK {} on {}", constraintName, tableName);
    }
}
