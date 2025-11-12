-- Migration 004: Add exam_questions junction table
-- Purpose: Store many-to-many relationship between exams and questions
-- Date: 2025-11-04
-- Author: AI Assistant

-- ==================== Create exam_questions Table ====================

CREATE TABLE IF NOT EXISTS exam_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL,
    question_id UUID NOT NULL,
    display_order INTEGER,
    score INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Foreign keys with cascade delete
    CONSTRAINT fk_exam_questions_exam_id 
        FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    
    CONSTRAINT fk_exam_questions_question_id 
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    
    -- Prevent duplicate questions in same exam
    CONSTRAINT unique_exam_question 
        UNIQUE (exam_id, question_id)
);

-- ==================== Indexes for Performance ====================

-- Index for finding all questions in an exam (most common query)
CREATE INDEX IF NOT EXISTS idx_exam_questions_exam_id 
    ON exam_questions(exam_id);

-- Index for finding which exams contain a question
CREATE INDEX IF NOT EXISTS idx_exam_questions_question_id 
    ON exam_questions(question_id);

-- Index for ordering questions by display_order
CREATE INDEX IF NOT EXISTS idx_exam_questions_display_order 
    ON exam_questions(exam_id, display_order);

-- ==================== Comments ====================

COMMENT ON TABLE exam_questions IS 
    'Junction table for many-to-many relationship between exams and questions. Stores which questions belong to which exam, with metadata like order and score.';

COMMENT ON COLUMN exam_questions.id IS 
    'Primary key UUID';

COMMENT ON COLUMN exam_questions.exam_id IS 
    'Foreign key to exams table (CASCADE DELETE)';

COMMENT ON COLUMN exam_questions.question_id IS 
    'Foreign key to questions table (CASCADE DELETE)';

COMMENT ON COLUMN exam_questions.display_order IS 
    'Order/position of question in exam (1-indexed). Allows admin to reorder questions.';

COMMENT ON COLUMN exam_questions.score IS 
    'Score for this question in this specific exam. Overrides default score in questions table if set.';

COMMENT ON COLUMN exam_questions.created_at IS 
    'Timestamp when question was added to exam';

-- ==================== Sample Query Examples ====================

-- Example 1: Get all questions for an exam (ordered)
-- SELECT eq.*, q.* 
-- FROM exam_questions eq
-- JOIN questions q ON eq.question_id = q.id
-- WHERE eq.exam_id = 'some-uuid'
-- ORDER BY eq.display_order;

-- Example 2: Count questions in an exam
-- SELECT COUNT(*) FROM exam_questions WHERE exam_id = 'some-uuid';

-- Example 3: Find exams that use a specific question
-- SELECT e.* 
-- FROM exam_questions eq
-- JOIN exams e ON eq.exam_id = e.id
-- WHERE eq.question_id = 'some-uuid';

-- ==================== Rollback Script ====================

-- To rollback this migration:
-- DROP INDEX IF EXISTS idx_exam_questions_display_order;
-- DROP INDEX IF EXISTS idx_exam_questions_question_id;
-- DROP INDEX IF EXISTS idx_exam_questions_exam_id;
-- DROP TABLE IF EXISTS exam_questions;

