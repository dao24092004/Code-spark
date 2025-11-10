-- Migration: Create cm_quiz_rankings table
-- Date: 2025-11-03
-- Description: Create table to track student rankings and percentiles

CREATE TABLE IF NOT EXISTS cm_quiz_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES cm_quizzes(id) ON DELETE CASCADE,
  student_id BIGINT NOT NULL,
  submission_id UUID NOT NULL REFERENCES cm_quiz_submissions(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  percentile DECIMAL(5,2),
  rank INTEGER,
  total_submissions INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_quiz_rankings_quiz_id ON cm_quiz_rankings(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_rankings_student_id ON cm_quiz_rankings(student_id);
CREATE INDEX IF NOT EXISTS idx_quiz_rankings_submission_id ON cm_quiz_rankings(submission_id);
CREATE INDEX IF NOT EXISTS idx_quiz_rankings_score ON cm_quiz_rankings(quiz_id, score DESC);

-- Add comments
COMMENT ON TABLE cm_quiz_rankings IS 'Tracks student rankings and percentiles for quiz submissions';
COMMENT ON COLUMN cm_quiz_rankings.percentile IS 'Student percentile relative to all submissions (0-100)';
COMMENT ON COLUMN cm_quiz_rankings.rank IS 'Student rank for this quiz (1 = highest score)';
COMMENT ON COLUMN cm_quiz_rankings.total_submissions IS 'Total number of submissions for this quiz at the time of ranking';

