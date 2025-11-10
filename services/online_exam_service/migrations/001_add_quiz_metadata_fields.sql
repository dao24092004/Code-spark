-- Migration: Add metadata fields to cm_quizzes table
-- Date: 2025-11-03
-- Description: Add difficulty, subject, is_proctored, and instructions fields

-- Add difficulty field (easy, medium, hard)
ALTER TABLE cm_quizzes 
ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard'));

-- Add subject field
ALTER TABLE cm_quizzes 
ADD COLUMN IF NOT EXISTS subject VARCHAR(100);

-- Add is_proctored field
ALTER TABLE cm_quizzes 
ADD COLUMN IF NOT EXISTS is_proctored BOOLEAN DEFAULT FALSE;

-- Add instructions field (JSON array stored as TEXT)
ALTER TABLE cm_quizzes 
ADD COLUMN IF NOT EXISTS instructions TEXT;

-- Add comment
COMMENT ON COLUMN cm_quizzes.difficulty IS 'Quiz difficulty level: easy, medium, or hard';
COMMENT ON COLUMN cm_quizzes.subject IS 'Subject or category of the quiz';
COMMENT ON COLUMN cm_quizzes.is_proctored IS 'Whether the quiz requires proctoring';
COMMENT ON COLUMN cm_quizzes.instructions IS 'JSON array of instruction strings for the quiz';

