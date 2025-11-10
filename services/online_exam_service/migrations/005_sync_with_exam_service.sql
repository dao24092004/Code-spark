-- Migration: Sync online_exam_service with exam-service tables
-- This migration aligns the Node.js service to use Java service's tables

-- =============================================
-- 1. CREATE SHARED TABLES (if not exist via exam-service)
-- =============================================

-- Exams table (managed by exam-service)
CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_at TIMESTAMP WITH TIME ZONE,
    end_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    pass_score INTEGER,
    max_attempts INTEGER,
    created_by UUID NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Questions table (managed by exam-service)
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL,
    content JSONB NOT NULL,
    difficulty INTEGER,
    explanation TEXT,
    score INTEGER,
    text VARCHAR(2000),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Question tags (managed by exam-service)
CREATE TABLE IF NOT EXISTS question_tags (
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    tag VARCHAR(255) NOT NULL,
    PRIMARY KEY (question_id, tag)
);

-- Exam registrations (managed by exam-service)
CREATE TABLE IF NOT EXISTS exam_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED'
);

-- =============================================
-- 2. RENAME OLD TABLES (backup old data)
-- =============================================

-- Rename old quiz/question tables to backup
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cm_quizzes') THEN
        ALTER TABLE cm_quizzes RENAME TO cm_quizzes_backup_old;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cm_questions') THEN
        ALTER TABLE cm_questions RENAME TO cm_questions_backup_old;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cm_question_options') THEN
        ALTER TABLE cm_question_options RENAME TO cm_question_options_backup_old;
    END IF;
END $$;

-- =============================================
-- 3. CREATE EXAM-QUESTION MAPPING TABLE
-- =============================================
-- This table links exams with questions and defines display order
-- Managed by online_exam_service when admin assigns questions to exams

CREATE TABLE IF NOT EXISTS exam_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(exam_id, question_id)
);

-- =============================================
-- 4. CREATE QUESTION OPTIONS TABLE
-- =============================================
-- This table is used by online_exam_service to store MCQ options
-- It references the shared 'questions' table

CREATE TABLE IF NOT EXISTS question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE
);

-- =============================================
-- 5. CREATE SUBMISSION TABLES
-- =============================================
-- These tables are used by online_exam_service for student submissions

CREATE TABLE IF NOT EXISTS quiz_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_id BIGINT NOT NULL,
    score INTEGER,
    submitted_at TIMESTAMP WITH TIME ZONE,
    answers TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    time_spent_seconds INTEGER,
    correct_answers INTEGER,
    wrong_answers INTEGER,
    total_questions INTEGER
);

CREATE TABLE IF NOT EXISTS answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES quiz_submissions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    selected_answer TEXT,
    score DECIMAL(5, 2),
    instructor_comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 6. CREATE QUIZ RANKINGS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS quiz_rankings (
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

-- =============================================
-- 7. CREATE INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_exams_org_id ON exams(org_id);
CREATE INDEX IF NOT EXISTS idx_exams_status ON exams(status);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(type);
CREATE INDEX IF NOT EXISTS idx_exam_questions_exam_id ON exam_questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_questions_question_id ON exam_questions(question_id);
CREATE INDEX IF NOT EXISTS idx_question_options_question_id ON question_options(question_id);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_quiz_id ON quiz_submissions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_student_id ON quiz_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_answers_submission_id ON answers(submission_id);
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON answers(question_id);
CREATE INDEX IF NOT EXISTS idx_quiz_rankings_quiz_id ON quiz_rankings(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_rankings_student_id ON quiz_rankings(student_id);
CREATE INDEX IF NOT EXISTS idx_quiz_rankings_submission_id ON quiz_rankings(submission_id);
CREATE INDEX IF NOT EXISTS idx_quiz_rankings_score ON quiz_rankings(quiz_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_exam_registrations_exam_id ON exam_registrations(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_registrations_user_id ON exam_registrations(user_id);

-- =============================================
-- 8. MIGRATE OLD DATA (if needed)
-- =============================================

-- Note: This is a manual step - you need to map old quiz/question data
-- to the new exams/questions tables format
-- Example migration (customize based on your data):

-- INSERT INTO exams (id, org_id, title, description, duration_minutes, created_by, status, created_at)
-- SELECT 
--     id,
--     course_id as org_id,
--     title,
--     description,
--     time_limit_minutes as duration_minutes,
--     '00000000-0000-0000-0000-000000000000'::uuid as created_by, -- Set default creator
--     'ACTIVE' as status,
--     created_at
-- FROM cm_quizzes_backup_old
-- WHERE NOT EXISTS (SELECT 1 FROM exams WHERE exams.id = cm_quizzes_backup_old.id);

COMMENT ON TABLE exams IS 'Shared exam table between exam-service (Java) and online_exam_service (Node.js)';
COMMENT ON TABLE questions IS 'Shared questions table - content stored as JSONB for flexibility';
COMMENT ON TABLE question_options IS 'Multiple choice options - used by online_exam_service';
COMMENT ON TABLE quiz_submissions IS 'Student exam submissions - managed by online_exam_service';
COMMENT ON TABLE answers IS 'Individual question answers - managed by online_exam_service';

