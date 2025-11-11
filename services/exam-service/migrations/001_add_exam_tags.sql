-- Migration: Add tags support to Exam entity
-- Date: 2025-11-03
-- Description: Creates exam_tags junction table to store tags/subjects for exams
-- Note: This migration is for documentation purposes. 
--       Spring Boot JPA with ddl-auto=update will create this table automatically.

-- ==================== Create exam_tags table ====================

CREATE TABLE IF NOT EXISTS exam_tags (
    exam_id UUID NOT NULL,
    tag VARCHAR(255) NOT NULL,
    CONSTRAINT fk_exam_tags_exam_id FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_exam_tags_exam_id ON exam_tags(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_tags_tag ON exam_tags(tag);

-- ==================== Comments ====================

COMMENT ON TABLE exam_tags IS 'Junction table storing tags/subjects for exams';
COMMENT ON COLUMN exam_tags.exam_id IS 'Foreign key to exams table';
COMMENT ON COLUMN exam_tags.tag IS 'Tag/subject name (e.g., "Lập trình Web", "Cơ sở dữ liệu")';

-- ==================== Sample Data (Optional) ====================

-- Example: Add tags to existing exams (if any)
-- INSERT INTO exam_tags (exam_id, tag) VALUES 
--   ((SELECT id FROM exams LIMIT 1), 'Lập trình Web'),
--   ((SELECT id FROM exams LIMIT 1), 'Java');

-- ==================== Rollback Script ====================

-- To rollback this migration:
-- DROP INDEX IF EXISTS idx_exam_tags_tag;
-- DROP INDEX IF EXISTS idx_exam_tags_exam_id;
-- DROP TABLE IF EXISTS exam_tags;

