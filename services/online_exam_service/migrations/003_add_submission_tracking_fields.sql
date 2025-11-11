-- Migration: Add tracking fields to cm_quiz_submissions table
-- Date: 2025-11-03
-- Description: Add time tracking and answer breakdown fields

-- Add time tracking fields
ALTER TABLE cm_quiz_submissions 
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP;

ALTER TABLE cm_quiz_submissions 
ADD COLUMN IF NOT EXISTS time_spent_seconds INTEGER;

-- Add answer breakdown fields
ALTER TABLE cm_quiz_submissions 
ADD COLUMN IF NOT EXISTS correct_answers INTEGER;

ALTER TABLE cm_quiz_submissions 
ADD COLUMN IF NOT EXISTS wrong_answers INTEGER;

ALTER TABLE cm_quiz_submissions 
ADD COLUMN IF NOT EXISTS total_questions INTEGER;

-- Add comments
COMMENT ON COLUMN cm_quiz_submissions.started_at IS 'Timestamp when the student started the quiz';
COMMENT ON COLUMN cm_quiz_submissions.time_spent_seconds IS 'Total time spent on quiz in seconds';
COMMENT ON COLUMN cm_quiz_submissions.correct_answers IS 'Number of correct answers';
COMMENT ON COLUMN cm_quiz_submissions.wrong_answers IS 'Number of wrong answers';
COMMENT ON COLUMN cm_quiz_submissions.total_questions IS 'Total number of questions in the quiz';

