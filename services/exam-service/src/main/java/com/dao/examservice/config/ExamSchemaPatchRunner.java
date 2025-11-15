package com.dao.examservice.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Ensures legacy foreign keys that still reference cm_quizzes are upgraded
 * to the new exams table so inserts do not violate FK checks.
 *
 * <p>Some databases were provisioned before the Exam entity migrated from
 * cm_quizzes -> exams. Because Hibernate's ddl-auto=update does not drop or
 * recreate existing foreign keys automatically, the join table exam_tags may
 * still point to the legacy table. We patch that on startup so that creating
 * an exam with tags succeeds.</p>
 */
@Component
public class ExamSchemaPatchRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(ExamSchemaPatchRunner.class);

    private final JdbcTemplate jdbcTemplate;

    public ExamSchemaPatchRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            jdbcTemplate.execute("""
                DO $$
                DECLARE
                    fk_record RECORD;
                BEGIN
                    FOR fk_record IN (
                        SELECT con.conname, rel.relname AS table_name
                        FROM pg_constraint con
                        JOIN pg_class rel ON rel.oid = con.conrelid
                        JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
                        JOIN pg_class conf ON conf.oid = con.confrelid
                        WHERE con.contype = 'f'
                          AND nsp.nspname = current_schema()
                          AND conf.relname = 'cm_quizzes'
                          AND rel.relname IN ('exam_tags', 'exam_questions', 'cm_exam_registrations')
                    ) LOOP
                        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', fk_record.table_name, fk_record.conname);
                    END LOOP;

                    IF EXISTS (
                        SELECT 1
                        FROM information_schema.tables
                        WHERE table_schema = current_schema()
                          AND table_name = 'exam_tags'
                    ) THEN
                        IF NOT EXISTS (
                            SELECT 1
                            FROM information_schema.table_constraints
                            WHERE constraint_schema = current_schema()
                              AND table_name = 'exam_tags'
                              AND constraint_name = 'fk_exam_tags_exams'
                        ) THEN
                            ALTER TABLE exam_tags
                            ADD CONSTRAINT fk_exam_tags_exams
                            FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE;
                        END IF;
                    END IF;

                    IF EXISTS (
                        SELECT 1
                        FROM information_schema.tables
                        WHERE table_schema = current_schema()
                          AND table_name = 'exam_questions'
                    ) THEN
                        IF NOT EXISTS (
                            SELECT 1
                            FROM information_schema.table_constraints
                            WHERE constraint_schema = current_schema()
                              AND table_name = 'exam_questions'
                              AND constraint_name = 'fk_exam_questions_exams'
                        ) THEN
                            ALTER TABLE exam_questions
                            ADD CONSTRAINT fk_exam_questions_exams
                            FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE;
                        END IF;
                    END IF;

                    IF EXISTS (
                        SELECT 1
                        FROM information_schema.tables
                        WHERE table_schema = current_schema()
                          AND table_name = 'cm_exam_registrations'
                    ) THEN
                        IF NOT EXISTS (
                            SELECT 1
                            FROM information_schema.table_constraints
                            WHERE constraint_schema = current_schema()
                              AND table_name = 'cm_exam_registrations'
                              AND constraint_name = 'fk_cm_exam_registrations_exams'
                        ) THEN
                            ALTER TABLE cm_exam_registrations
                            ADD CONSTRAINT fk_cm_exam_registrations_exams
                            FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE;
                        END IF;
                    END IF;
                END $$;
                """);
        } catch (DataAccessException ex) {
            log.warn("Could not align exam foreign keys. Legacy FK references may still exist.", ex);
        }
    }
}

