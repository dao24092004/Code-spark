package com.dao.examservice.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Patches the database schema after Hibernate has finished initialization.
 * Uses LOWEST precedence to run last among ApplicationRunners.
 *
 * <p>This handles NULL values and type mismatches that occurred during
 * Hibernate's ddl-auto=update. While those DDL errors are non-fatal (Hibernate
 * continues), they can leave the schema in a state where some columns have
 * wrong types or NULL in NOT NULL columns. This patcher fixes those lingering
 * data issues.</p>
 *
 * <p>Handles:</p>
 * <ul>
 *   <li>exams.randomize_question_order = NULL -> false</li>
 *   <li>exams.show_correct_answers = NULL -> true</li>
 *   <li>exams.partial_scoring_enabled = NULL -> false</li>
 *   <li>exams.randomize_option_order = NULL -> false</li>
 *   <li>question_tags.id = NULL -> gen_random_uuid()</li>
 *   <li>quiz_submissions.is_final = NULL -> false</li>
 *   <li>quiz_rankings.student_id / quiz_submissions.student_id type conversion to uuid</li>
 * </ul>
 */
@Component
@Order(Ordered.LOWEST_PRECEDENCE - 100)
public class DatabaseSchemaPatchRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseSchemaPatchRunner.class);

    private final JdbcTemplate jdbcTemplate;

    public DatabaseSchemaPatchRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        log.info("Running database schema patch (after Hibernate init)...");

        try {
            patchExamsTable();
            patchQuestionTagsTable();
            patchQuizRankingsTable();
            patchQuizSubmissionsTable();
            log.info("Database schema patch completed successfully.");
        } catch (DataAccessException ex) {
            log.warn("Schema patch encountered an error (will continue anyway): {}", ex.getMessage());
        }
    }

    private void patchExamsTable() {
        patchNullableBoolean("exams", "randomize_question_order",
                "UPDATE exams SET randomize_question_order = false WHERE randomize_question_order IS NULL");
        patchNullableBoolean("exams", "show_correct_answers",
                "UPDATE exams SET show_correct_answers = true WHERE show_correct_answers IS NULL");
        patchNullableBoolean("exams", "partial_scoring_enabled",
                "UPDATE exams SET partial_scoring_enabled = false WHERE partial_scoring_enabled IS NULL");
        patchNullableBoolean("exams", "randomize_option_order",
                "UPDATE exams SET randomize_option_order = false WHERE randomize_option_order IS NULL");
        log.info("Exams table patch done.");
    }

    private void patchQuestionTagsTable() {
        patchNullableUuid("question_tags", "id",
                "UPDATE question_tags SET id = gen_random_uuid() WHERE id IS NULL");
        log.info("QuestionTags table patch done.");
    }

    private void patchQuizRankingsTable() {
        fixUuidType("quiz_rankings", "student_id",
                "UPDATE quiz_rankings SET student_id = student_id::uuid WHERE student_id IS NOT NULL");
        fixUuidType("quiz_rankings", "submission_id",
                "UPDATE quiz_rankings SET submission_id = submission_id::uuid WHERE submission_id IS NOT NULL");
        log.info("QuizRankings table patch done.");
    }

    private void patchQuizSubmissionsTable() {
        patchNullableBoolean("quiz_submissions", "is_final",
                "UPDATE quiz_submissions SET is_final = false WHERE is_final IS NULL");
        fixUuidType("quiz_submissions", "student_id",
                "UPDATE quiz_submissions SET student_id = student_id::uuid WHERE student_id IS NOT NULL");
        fixUuidType("quiz_submissions", "quiz_id",
                "UPDATE quiz_submissions SET quiz_id = quiz_id::uuid WHERE quiz_id IS NOT NULL");
        fixUuidType("quiz_submissions", "organization_id",
                "UPDATE quiz_submissions SET organization_id = organization_id::uuid WHERE organization_id IS NOT NULL");
        log.info("QuizSubmissions table patch done.");
    }

    private void patchNullableBoolean(String table, String column, String updateSql) {
        try {
            String countSql = String.format(
                "SELECT COUNT(*) FROM %s WHERE %s IS NULL", table, column);
            Integer nullCount = jdbcTemplate.queryForObject(countSql, Integer.class);

            if (nullCount != null && nullCount > 0) {
                log.info("  Filling {} NULL values in {}.{}", nullCount, table, column);
                jdbcTemplate.execute(updateSql);
            } else {
                log.debug("  Column {}.{} already has no NULLs", table, column);
            }
        } catch (DataAccessException ex) {
            log.debug("  Could not patch {}.{}: {}", table, column, ex.getMessage());
        }
    }

    private void patchNullableUuid(String table, String column, String updateSql) {
        try {
            String countSql = String.format(
                "SELECT COUNT(*) FROM %s WHERE %s IS NULL", table, column);
            Integer nullCount = jdbcTemplate.queryForObject(countSql, Integer.class);

            if (nullCount != null && nullCount > 0) {
                log.info("  Filling {} NULL UUIDs in {}.{}", nullCount, table, column);
                jdbcTemplate.execute(updateSql);
            } else {
                log.debug("  Column {}.{} already has no NULLs", table, column);
            }
        } catch (DataAccessException ex) {
            log.debug("  Could not patch {}.{} UUID: {}", table, column, ex.getMessage());
        }
    }

    private void fixUuidType(String table, String column, String updateSql) {
        try {
            String typeSql = String.format(
                "SELECT data_type FROM information_schema.columns " +
                "WHERE table_name = '%s' AND column_name = '%s'",
                table, column);
            String dataType = jdbcTemplate.queryForObject(typeSql, String.class);

            if (dataType != null && !dataType.equals("uuid")) {
                log.info("  Converting {}.{} from '{}' to uuid", table, column, dataType);
                jdbcTemplate.execute(updateSql);
            } else {
                log.debug("  Column {}.{} already is uuid type", table, column);
            }
        } catch (DataAccessException ex) {
            log.debug("  Could not fix {}.{} type: {}", table, column, ex.getMessage());
        }
    }
}
