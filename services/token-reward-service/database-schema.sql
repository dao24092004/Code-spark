-- =====================================================================
-- DATABASE SCHEMA FOR TOKEN REWARD SERVICE
-- Database: token_reward_db
-- Port: 5433 (localhost)
-- =====================================================================

-- Drop tables if exists (for fresh start)
DROP TABLE IF EXISTS cm_answers CASCADE;
DROP TABLE IF EXISTS cm_progress CASCADE;
DROP TABLE IF EXISTS cm_quiz_submissions CASCADE;
DROP TABLE IF EXISTS cm_question_options CASCADE;
DROP TABLE IF EXISTS cm_questions CASCADE;
DROP TABLE IF EXISTS cm_quizzes CASCADE;
DROP TABLE IF EXISTS cm_materials CASCADE;
DROP TABLE IF EXISTS cm_rewards CASCADE;
DROP TABLE IF EXISTS cm_courses CASCADE;
DROP TABLE IF EXISTS cm_users CASCADE;

-- =====================================================================
-- BẢNG 1: cm_users (User token balance)
-- =====================================================================
CREATE TABLE cm_users (
    id BIGINT PRIMARY KEY,
    token_balance INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE cm_users IS 'Lưu số dư token của user (off-chain balance)';
COMMENT ON COLUMN cm_users.id IS 'User ID từ Identity Service';
COMMENT ON COLUMN cm_users.token_balance IS 'Số dư token hiện tại của user';

-- =====================================================================
-- BẢNG 2: cm_courses (Quản lý thông tin cốt lõi của khóa học)
-- =====================================================================
CREATE TABLE cm_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    thumbnail_url VARCHAR(255),
    visibility VARCHAR(20) NOT NULL DEFAULT 'private' 
        CHECK (visibility IN ('public', 'private', 'unlisted')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE cm_courses IS 'Thông tin khóa học';
COMMENT ON COLUMN cm_courses.instructor_id IS 'ID giảng viên từ Identity Service';
COMMENT ON COLUMN cm_courses.slug IS 'URL-friendly identifier';
COMMENT ON COLUMN cm_courses.visibility IS 'Trạng thái hiển thị: public/private/unlisted';

-- =====================================================================
-- BẢNG 3: cm_materials (Quản lý học liệu: PDF, text...)
-- =====================================================================
CREATE TABLE cm_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES cm_courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    storage_key TEXT,
    content TEXT,
    display_order INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE cm_materials IS 'Học liệu của khóa học (PDF, text, quiz)';
COMMENT ON COLUMN cm_materials.type IS 'Loại: pdf, text, quiz';
COMMENT ON COLUMN cm_materials.storage_key IS 'Key file trên Cloud Storage';
COMMENT ON COLUMN cm_materials.content IS 'Nội dung text trực tiếp';

-- =====================================================================
-- BẢNG 4: cm_quizzes (Định nghĩa các bài kiểm tra)
-- =====================================================================
CREATE TABLE cm_quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES cm_courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    time_limit_minutes INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE cm_quizzes IS 'Bài kiểm tra/quiz trong khóa học';
COMMENT ON COLUMN cm_quizzes.time_limit_minutes IS 'Thời gian làm bài (phút), NULL = không giới hạn';

-- =====================================================================
-- BẢNG 5: cm_questions (Định nghĩa câu hỏi cho các bài quiz)
-- =====================================================================
CREATE TABLE cm_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES cm_quizzes(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'single_choice',
    display_order INT
);

COMMENT ON TABLE cm_questions IS 'Câu hỏi trong quiz';
COMMENT ON COLUMN cm_questions.type IS 'Loại: single_choice, multiple_choice';

-- =====================================================================
-- BẢNG 6: cm_question_options (Các lựa chọn trả lời cho câu hỏi)
-- =====================================================================
CREATE TABLE cm_question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES cm_questions(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE
);

COMMENT ON TABLE cm_question_options IS 'Các đáp án cho câu hỏi';
COMMENT ON COLUMN cm_question_options.is_correct IS 'Đánh dấu đáp án đúng';

-- =====================================================================
-- BẢNG 7: cm_quiz_submissions (Lưu kết quả làm bài của học sinh)
-- =====================================================================
CREATE TABLE cm_quiz_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES cm_quizzes(id) ON DELETE CASCADE,
    student_id BIGINT NOT NULL,
    score INT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    answers JSONB
);

COMMENT ON TABLE cm_quiz_submissions IS 'Bài làm quiz của học sinh';
COMMENT ON COLUMN cm_quiz_submissions.answers IS 'Câu trả lời dạng JSON';

-- =====================================================================
-- BẢNG 8: cm_answers (Chi tiết từng câu trả lời)
-- =====================================================================
CREATE TABLE cm_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES cm_quiz_submissions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES cm_questions(id),
    selected_answer TEXT,
    score NUMERIC(5, 2),
    instructor_comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE cm_answers IS 'Chi tiết từng câu trả lời trong bài làm';

-- =====================================================================
-- BẢNG 9: cm_progress (Theo dõi tiến độ học tập tổng thể)
-- =====================================================================
CREATE TABLE cm_progress (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL,
    course_id UUID NOT NULL REFERENCES cm_courses(id) ON DELETE CASCADE,
    percent_complete SMALLINT NOT NULL DEFAULT 0 
        CHECK (percent_complete >= 0 AND percent_complete <= 100),
    last_material_id UUID REFERENCES cm_materials(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, course_id)
);

COMMENT ON TABLE cm_progress IS 'Tiến độ học tập của student';
COMMENT ON COLUMN cm_progress.percent_complete IS 'Phần trăm hoàn thành (0-100)';

-- =====================================================================
-- BẢNG 10: cm_rewards (Ghi lại lịch sử nhận/tiêu token thưởng)
-- =====================================================================
CREATE TABLE cm_rewards (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL,
    tokens_awarded INT NOT NULL CHECK (tokens_awarded > 0),
    reason_code VARCHAR(100) NOT NULL,
    related_id VARCHAR(255),
    awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    transaction_type VARCHAR(10) NOT NULL DEFAULT 'EARN'
        CHECK (transaction_type IN ('EARN', 'SPEND'))
);

COMMENT ON TABLE cm_rewards IS 'Lịch sử giao dịch token (EARN/SPEND)';
COMMENT ON COLUMN cm_rewards.tokens_awarded IS 'Số token (luôn dương)';
COMMENT ON COLUMN cm_rewards.transaction_type IS 'EARN = nhận token, SPEND = tiêu token';
COMMENT ON COLUMN cm_rewards.reason_code IS 'Mã lý do: COURSE_COMPLETION, EXAM_PASS, PURCHASE, WITHDRAW, etc.';

-- =====================================================================
-- TẠO INDEX (CHỈ MỤC) ĐỂ TĂNG TỐC ĐỘ TRUY VẤN
-- =====================================================================
CREATE INDEX idx_cm_courses_instructor_id ON cm_courses(instructor_id);
CREATE INDEX idx_cm_courses_visibility ON cm_courses(visibility);
CREATE INDEX idx_cm_courses_created_at ON cm_courses(created_at DESC);

CREATE INDEX idx_cm_materials_course_id ON cm_materials(course_id);
CREATE INDEX idx_cm_materials_type ON cm_materials(type);
CREATE INDEX idx_cm_materials_display_order ON cm_materials(course_id, display_order);

CREATE INDEX idx_cm_quizzes_course_id ON cm_quizzes(course_id);

CREATE INDEX idx_cm_questions_quiz_id ON cm_questions(quiz_id);
CREATE INDEX idx_cm_questions_display_order ON cm_questions(quiz_id, display_order);

CREATE INDEX idx_cm_question_options_question_id ON cm_question_options(question_id);

CREATE INDEX idx_cm_quiz_submissions_student_id ON cm_quiz_submissions(student_id, quiz_id);
CREATE INDEX idx_cm_quiz_submissions_quiz_id ON cm_quiz_submissions(quiz_id);
CREATE INDEX idx_cm_quiz_submissions_submitted_at ON cm_quiz_submissions(submitted_at DESC);

CREATE INDEX idx_cm_answers_submission_id ON cm_answers(submission_id);
CREATE INDEX idx_cm_answers_question_id ON cm_answers(question_id);

CREATE INDEX idx_cm_progress_student_id ON cm_progress(student_id);
CREATE INDEX idx_cm_progress_course_id ON cm_progress(course_id);
CREATE INDEX idx_cm_progress_student_course ON cm_progress(student_id, course_id);

CREATE INDEX idx_cm_rewards_student_id ON cm_rewards(student_id);
CREATE INDEX idx_cm_rewards_awarded_at ON cm_rewards(awarded_at DESC);
CREATE INDEX idx_cm_rewards_transaction_type ON cm_rewards(transaction_type);

-- =====================================================================
-- INSERT SAMPLE DATA FOR TESTING
-- =====================================================================

-- Insert sample users
INSERT INTO cm_users (id, token_balance, "createdAt", "updatedAt") VALUES 
(1, 100, NOW(), NOW()),
(2, 50, NOW(), NOW()),
(3, 200, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert sample rewards
INSERT INTO cm_rewards (student_id, tokens_awarded, reason_code, related_id, awarded_at, transaction_type) VALUES 
(1, 10, 'COMPLETE_LESSON', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', NOW() - INTERVAL '2 hours', 'EARN'),
(1, 50, 'EXAM_PASS', 'b2c3d4e5-f6a7-8901-2345-67890abcdef1', NOW() - INTERVAL '1 day', 'EARN'),
(2, 20, 'COMPLETE_CHALLENGE', 'c3d4e5f6-a7b8-9012-3456-7890abcdef12', NOW() - INTERVAL '30 minutes', 'EARN'),
(2, 30, 'ADMIN_BONUS', NULL, NOW() - INTERVAL '3 days', 'EARN'),
(3, 100, 'COURSE_COMPLETION', 'd4e5f6a7-b8c9-0123-4567-890abcdef123', NOW() - INTERVAL '1 week', 'EARN'),
(3, 50, 'PURCHASE', 'gift-voucher-amazon', NOW() - INTERVAL '2 days', 'SPEND')
ON CONFLICT DO NOTHING;

-- Insert sample course
INSERT INTO cm_courses (id, instructor_id, title, slug, description, thumbnail_url, visibility, created_at, updated_at) VALUES 
('a1b2c3d4-e5f6-7890-1234-567890abcdef'::UUID, 1, 'Python Programming Fundamentals', 'python-fundamentals', 'Learn Python from scratch', '/images/python.jpg', 'public', NOW(), NOW()),
('b2c3d4e5-f6a7-8901-2345-67890abcdef1'::UUID, 1, 'Web Development with React', 'react-web-dev', 'Modern web development', '/images/react.jpg', 'public', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert sample materials
INSERT INTO cm_materials (id, course_id, title, type, storage_key, content, display_order, created_at) VALUES 
(gen_random_uuid(), 'a1b2c3d4-e5f6-7890-1234-567890abcdef'::UUID, 'Introduction to Python', 'text', NULL, 'Welcome to Python programming...', 1, NOW()),
(gen_random_uuid(), 'a1b2c3d4-e5f6-7890-1234-567890abcdef'::UUID, 'Python Basics PDF', 'pdf', 's3://bucket/python-basics.pdf', NULL, 2, NOW()),
(gen_random_uuid(), 'b2c3d4e5-f6a7-8901-2345-67890abcdef1'::UUID, 'React Components', 'text', NULL, 'Understanding React components...', 1, NOW())
ON CONFLICT DO NOTHING;

-- Insert sample quiz
INSERT INTO cm_quizzes (id, course_id, title, description, time_limit_minutes, created_at) VALUES 
('q1b2c3d4-e5f6-7890-1234-567890abcdef'::UUID, 'a1b2c3d4-e5f6-7890-1234-567890abcdef'::UUID, 'Python Basics Quiz', 'Test your Python knowledge', 30, NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert sample questions
INSERT INTO cm_questions (id, quiz_id, content, type, display_order) VALUES 
('ques1111-1111-1111-1111-111111111111'::UUID, 'q1b2c3d4-e5f6-7890-1234-567890abcdef'::UUID, 'What is Python?', 'single_choice', 1),
('ques2222-2222-2222-2222-222222222222'::UUID, 'q1b2c3d4-e5f6-7890-1234-567890abcdef'::UUID, 'Which are valid Python data types?', 'multiple_choice', 2)
ON CONFLICT (id) DO NOTHING;

-- Insert sample question options
INSERT INTO cm_question_options (id, question_id, content, is_correct) VALUES 
-- Options for question 1
(gen_random_uuid(), 'ques1111-1111-1111-1111-111111111111'::UUID, 'A programming language', TRUE),
(gen_random_uuid(), 'ques1111-1111-1111-1111-111111111111'::UUID, 'A type of snake', FALSE),
(gen_random_uuid(), 'ques1111-1111-1111-1111-111111111111'::UUID, 'A database', FALSE),
-- Options for question 2
(gen_random_uuid(), 'ques2222-2222-2222-2222-222222222222'::UUID, 'int', TRUE),
(gen_random_uuid(), 'ques2222-2222-2222-2222-222222222222'::UUID, 'str', TRUE),
(gen_random_uuid(), 'ques2222-2222-2222-2222-222222222222'::UUID, 'char', FALSE)
ON CONFLICT DO NOTHING;

-- Insert sample quiz submission
INSERT INTO cm_quiz_submissions (id, quiz_id, student_id, score, submitted_at, answers) VALUES 
('sub11111-1111-1111-1111-111111111111'::UUID, 'q1b2c3d4-e5f6-7890-1234-567890abcdef'::UUID, 2, 85, NOW() - INTERVAL '1 day', 
 '{"question1": "option1", "question2": ["option1", "option2"]}'::JSONB)
ON CONFLICT (id) DO NOTHING;

-- Insert sample answers
INSERT INTO cm_answers (id, submission_id, question_id, selected_answer, score, instructor_comment, created_at, updated_at) VALUES 
(gen_random_uuid(), 'sub11111-1111-1111-1111-111111111111'::UUID, 'ques1111-1111-1111-1111-111111111111'::UUID, 'A programming language', 10.00, 'Correct!', NOW(), NOW()),
(gen_random_uuid(), 'sub11111-1111-1111-1111-111111111111'::UUID, 'ques2222-2222-2222-2222-222222222222'::UUID, 'int, str', 10.00, 'Well done!', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Insert sample progress
INSERT INTO cm_progress (student_id, course_id, percent_complete, last_material_id, updated_at) VALUES 
(2, 'a1b2c3d4-e5f6-7890-1234-567890abcdef'::UUID, 65, NULL, NOW()),
(2, 'b2c3d4e5-f6a7-8901-2345-67890abcdef1'::UUID, 30, NULL, NOW())
ON CONFLICT (student_id, course_id) DO NOTHING;

-- =====================================================================
-- VERIFICATION QUERIES
-- =====================================================================

-- Check tables created
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Check sample data
SELECT 'cm_users' as table_name, COUNT(*) as row_count FROM cm_users
UNION ALL
SELECT 'cm_courses', COUNT(*) FROM cm_courses
UNION ALL
SELECT 'cm_materials', COUNT(*) FROM cm_materials
UNION ALL
SELECT 'cm_quizzes', COUNT(*) FROM cm_quizzes
UNION ALL
SELECT 'cm_questions', COUNT(*) FROM cm_questions
UNION ALL
SELECT 'cm_question_options', COUNT(*) FROM cm_question_options
UNION ALL
SELECT 'cm_quiz_submissions', COUNT(*) FROM cm_quiz_submissions
UNION ALL
SELECT 'cm_answers', COUNT(*) FROM cm_answers
UNION ALL
SELECT 'cm_progress', COUNT(*) FROM cm_progress
UNION ALL
SELECT 'cm_rewards', COUNT(*) FROM cm_rewards
ORDER BY table_name;

-- =====================================================================
-- DONE! 
-- All tables created and sample data inserted
-- =====================================================================

