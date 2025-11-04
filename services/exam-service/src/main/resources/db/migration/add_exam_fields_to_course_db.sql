-- Migration script: Add exam-service fields to existing course_db tables
-- Run this script on course_db database

-- ============================================================
-- 1. Add missing fields to cm_quizzes table
-- ============================================================
ALTER TABLE cm_quizzes 
ADD COLUMN IF NOT EXISTS start_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS end_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS pass_score INT CHECK (pass_score IS NULL OR pass_score >= 0),
ADD COLUMN IF NOT EXISTS max_attempts INT CHECK (max_attempts IS NULL OR max_attempts >= 0),
ADD COLUMN IF NOT EXISTS created_by BIGINT,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','SCHEDULED','ACTIVE','COMPLETED','CANCELLED'));

-- ============================================================
-- 2. Add missing fields to cm_questions table
-- ============================================================
ALTER TABLE cm_questions 
ADD COLUMN IF NOT EXISTS difficulty INT CHECK (difficulty IS NULL OR (difficulty >= 0 AND difficulty <= 5)),
ADD COLUMN IF NOT EXISTS explanation TEXT,
ADD COLUMN IF NOT EXISTS score INT CHECK (score IS NULL OR score >= 0),
ADD COLUMN IF NOT EXISTS text VARCHAR(2000),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- ============================================================
-- 3. Create question_tags table (for exam-service tags)
-- ============================================================
CREATE TABLE IF NOT EXISTS cm_question_tags (
    question_id UUID NOT NULL REFERENCES cm_questions(id) ON DELETE CASCADE,
    tag TEXT NOT NULL,
    PRIMARY KEY (question_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_cm_question_tags_question_id ON cm_question_tags(question_id);
CREATE INDEX IF NOT EXISTS idx_cm_question_tags_tag ON cm_question_tags(tag);

-- ============================================================
-- 4. Create cm_exam_registrations table (for exam-service)
-- ============================================================
CREATE TABLE IF NOT EXISTS cm_exam_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES cm_quizzes(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED','REGISTERED','CANCELLED'))
);

CREATE INDEX IF NOT EXISTS idx_cm_exam_registrations_exam_id ON cm_exam_registrations(exam_id);
CREATE INDEX IF NOT EXISTS idx_cm_exam_registrations_user_id ON cm_exam_registrations(user_id);

-- ============================================================
-- 5. Add missing fields to cm_quiz_submissions (for exam sessions)
-- ============================================================
ALTER TABLE cm_quiz_submissions
ADD COLUMN IF NOT EXISTS attempt_no INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) CHECK (status IN ('SCHEDULED','IN_PROGRESS','SUBMITTED','GRADED','CANCELLED','EXPIRED'));

-- Add unique constraint for exam_id, user_id, attempt_no (only if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_quiz_submission_attempt'
    ) THEN
        ALTER TABLE cm_quiz_submissions
        ADD CONSTRAINT unique_quiz_submission_attempt 
        UNIQUE (quiz_id, student_id, attempt_no);
    END IF;
END $$;

-- ============================================================
-- 6. Create indexes for better query performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_cm_quizzes_start_at_end_at ON cm_quizzes(start_at, end_at);
CREATE INDEX IF NOT EXISTS idx_cm_quizzes_created_by ON cm_quizzes(created_by);
CREATE INDEX IF NOT EXISTS idx_cm_quizzes_status ON cm_quizzes(status);
CREATE INDEX IF NOT EXISTS idx_cm_questions_difficulty ON cm_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_cm_quiz_submissions_started_at ON cm_quiz_submissions(started_at);
