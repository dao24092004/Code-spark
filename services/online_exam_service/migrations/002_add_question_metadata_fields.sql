-- Migration: Add metadata fields to cm_questions table
-- Date: 2025-11-03
-- Description: Add explanation and points fields to questions

-- Add explanation field (for answer feedback)
ALTER TABLE cm_questions 
ADD COLUMN IF NOT EXISTS explanation TEXT;

-- Add points field (default 10 points per question)
ALTER TABLE cm_questions 
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 10;

-- Add comment
COMMENT ON COLUMN cm_questions.explanation IS 'Detailed explanation of the correct answer';
COMMENT ON COLUMN cm_questions.points IS 'Points awarded for correct answer (default: 10)';

