-- Migration: Add submission_id to quiz_rankings table
-- Date: 2025-11-04
-- Description: Add missing submission_id column to existing quiz_rankings table

-- Check if table exists, if not create it with correct schema
DO $$
BEGIN
    -- If table doesn't exist, create it with the new schema
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quiz_rankings') THEN
        CREATE TABLE quiz_rankings (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            quiz_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
            student_id BIGINT NOT NULL,
            submission_id UUID NOT NULL REFERENCES quiz_submissions(id) ON DELETE CASCADE,
            score INTEGER NOT NULL,
            percentile DECIMAL(5, 2),
            rank INTEGER,
            total_submissions INTEGER,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE 'Created quiz_rankings table with submission_id';
    
    -- If table exists, check if submission_id column exists
    ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'quiz_rankings' AND column_name = 'submission_id'
    ) THEN
        -- Add submission_id column (allow NULL initially)
        ALTER TABLE quiz_rankings 
        ADD COLUMN submission_id UUID REFERENCES quiz_submissions(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added submission_id column to existing quiz_rankings table';
        
        -- If you have existing data, you might need to populate submission_id
        -- This is a placeholder - customize based on your data
        -- UPDATE quiz_rankings SET submission_id = ... WHERE submission_id IS NULL;
        
        -- Make it NOT NULL after populating data (uncomment when ready)
        -- ALTER TABLE quiz_rankings ALTER COLUMN submission_id SET NOT NULL;
    ELSE
        RAISE NOTICE 'submission_id column already exists in quiz_rankings';
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_quiz_rankings_quiz_id ON quiz_rankings(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_rankings_student_id ON quiz_rankings(student_id);
CREATE INDEX IF NOT EXISTS idx_quiz_rankings_submission_id ON quiz_rankings(submission_id);
CREATE INDEX IF NOT EXISTS idx_quiz_rankings_score ON quiz_rankings(quiz_id, score DESC);

-- Add percentile column if it doesn't exist (might be named 'percentage' in old schema)
DO $$
BEGIN
    -- Check if percentile column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_rankings' AND column_name = 'percentile') THEN
        -- Check if old 'percentage' column exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_rankings' AND column_name = 'percentage') THEN
            -- Rename percentage to percentile
            ALTER TABLE quiz_rankings RENAME COLUMN percentage TO percentile;
            RAISE NOTICE 'Renamed percentage column to percentile';
        ELSE
            -- Add percentile column
            ALTER TABLE quiz_rankings ADD COLUMN percentile DECIMAL(5, 2);
            RAISE NOTICE 'Added percentile column';
        END IF;
    END IF;
    
    -- Add total_submissions column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_rankings' AND column_name = 'total_submissions') THEN
        ALTER TABLE quiz_rankings ADD COLUMN total_submissions INTEGER;
        RAISE NOTICE 'Added total_submissions column';
    END IF;
END $$;

-- Drop old columns that are no longer needed (if they exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_rankings' AND column_name = 'student_name') THEN
        ALTER TABLE quiz_rankings DROP COLUMN student_name;
        RAISE NOTICE 'Dropped student_name column';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_rankings' AND column_name = 'time_spent_seconds') THEN
        ALTER TABLE quiz_rankings DROP COLUMN time_spent_seconds;
        RAISE NOTICE 'Dropped time_spent_seconds column';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_rankings' AND column_name = 'submitted_at') THEN
        ALTER TABLE quiz_rankings DROP COLUMN submitted_at;
        RAISE NOTICE 'Dropped submitted_at column';
    END IF;
END $$;

-- Add comments (only if columns exist)
DO $$
BEGIN
    COMMENT ON TABLE quiz_rankings IS 'Tracks student rankings and percentiles for quiz submissions';
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_rankings' AND column_name = 'submission_id') THEN
        COMMENT ON COLUMN quiz_rankings.submission_id IS 'Reference to the specific quiz submission';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_rankings' AND column_name = 'percentile') THEN
        COMMENT ON COLUMN quiz_rankings.percentile IS 'Student percentile relative to all submissions (0-100)';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_rankings' AND column_name = 'rank') THEN
        COMMENT ON COLUMN quiz_rankings.rank IS 'Student rank for this quiz (1 = highest score)';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_rankings' AND column_name = 'total_submissions') THEN
        COMMENT ON COLUMN quiz_rankings.total_submissions IS 'Total number of submissions for this quiz at the time of ranking';
    END IF;
END $$;

