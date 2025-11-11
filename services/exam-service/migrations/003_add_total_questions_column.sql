-- Migration 003: Add total_questions column to exams table
-- Purpose: Track the intended number of questions for each exam
-- Date: 2025-11-03

-- Add total_questions column to exams table
ALTER TABLE exams 
ADD COLUMN total_questions INTEGER;

-- Add comment to explain the column
COMMENT ON COLUMN exams.total_questions IS 'The intended total number of questions for this exam';

-- Optional: Add default value for existing rows (can be updated later)
UPDATE exams 
SET total_questions = 0 
WHERE total_questions IS NULL;

-- Optional: Create index if needed for queries filtering by question count
-- CREATE INDEX idx_exams_total_questions ON exams(total_questions);

