package com.dao.examservice.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.Ordered;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

/**
 * Xóa các bảng không liên quan trong exam_db theo ERD optimized.
 * 
 * Các bảng cần xóa (không có trong ERD):
 * - exam_difficulties (lookup table - không cần thiết)
 * - exam_statuses (lookup table - không cần thiết)
 * - exam_types (lookup table - không cần thiết)
 * - cm_quizzes (đã migrate sang exams)
 * 
 * Các bảng cần giữ lại (theo ERD):
 * - exams
 * - questions
 * - exam_questions
 * - cm_exam_registrations
 * - exam_tags
 * - question_tags
 * - question_options
 * - quiz_submissions
 * - answers
 * - quiz_rankings
 * - exam_sessions
 * - proctoring_events
 * - media_captures
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE) // Chạy trước các runner khác
public class DatabaseCleanupRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseCleanupRunner.class);

    private final JdbcTemplate jdbcTemplate;

    // Danh sách các bảng cần xóa (không có trong ERD)
    private static final List<String> TABLES_TO_DROP = Arrays.asList(
        "exam_difficulties",
        "exam_statuses",
        "exam_types",
        "cm_quizzes"
    );

    // Danh sách các bảng hợp lệ theo ERD
    private static final List<String> VALID_TABLES = Arrays.asList(
        "exams",
        "questions",
        "exam_questions",
        "cm_exam_registrations",
        "exam_tags",
        "question_tags",
        "question_options",
        "quiz_submissions",
        "answers",
        "quiz_rankings",
        "exam_sessions",
        "proctoring_events",
        "media_captures"
    );

    public DatabaseCleanupRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        log.info("Bắt đầu dọn dẹp database exam_db - xóa các bảng không liên quan...");

        for (String tableName : TABLES_TO_DROP) {
            try {
                // Kiểm tra bảng có tồn tại không
                Boolean tableExists = jdbcTemplate.queryForObject(
                    """
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = current_schema() 
                        AND table_name = ?
                    )
                    """,
                    Boolean.class,
                    tableName
                );

                if (Boolean.TRUE.equals(tableExists)) {
                    log.warn("Đang xóa bảng không liên quan: {}", tableName);
                    
                    // Xóa bảng (CASCADE để xóa cả foreign keys)
                    jdbcTemplate.execute("DROP TABLE IF EXISTS " + tableName + " CASCADE");
                    
                    log.info("✓ Đã xóa bảng: {}", tableName);
                } else {
                    log.debug("Bảng {} không tồn tại, bỏ qua", tableName);
                }
            } catch (DataAccessException ex) {
                log.error("Lỗi khi xóa bảng {}: {}", tableName, ex.getMessage(), ex);
                // Tiếp tục xóa các bảng khác dù có lỗi
            }
        }

        log.info("Hoàn thành dọn dẹp database exam_db");
        
        // Log danh sách bảng còn lại để kiểm tra
        try {
            List<String> existingTables = jdbcTemplate.queryForList(
                """
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = current_schema() 
                AND table_type = 'BASE TABLE'
                ORDER BY table_name
                """,
                String.class
            );
            
            log.info("Các bảng hiện có trong exam_db ({} bảng):", existingTables.size());
            for (String table : existingTables) {
                String status = VALID_TABLES.contains(table) ? "✓" : "⚠";
                log.info("  {} {}", status, table);
            }
        } catch (DataAccessException ex) {
            log.warn("Không thể liệt kê danh sách bảng: {}", ex.getMessage());
        }
    }
}
