-- =====================================================================
-- DATABASE SCHEMA FOR ANALYTICS SERVICE
-- Database: analytics_db
-- Port: 5433 (localhost) / 5432 (docker)
-- =====================================================================

-- Drop tables if exists (for fresh start)
DROP TABLE IF EXISTS proctoring_events CASCADE;
DROP TABLE IF EXISTS exam_results CASCADE;

-- =====================================================================
-- BẢNG 1: exam_results (Kết quả bài thi)
-- =====================================================================
CREATE TABLE exam_results (
    id BIGSERIAL PRIMARY KEY,
    exam_id UUID NOT NULL,
    submission_id UUID NOT NULL,
    user_id UUID NOT NULL,
    score DOUBLE PRECISION NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE exam_results IS 'Lưu trữ kết quả bài thi của học viên';
COMMENT ON COLUMN exam_results.id IS 'ID tự động tăng (Primary Key)';
COMMENT ON COLUMN exam_results.exam_id IS 'ID của bài thi từ exam-service (UUID)';
COMMENT ON COLUMN exam_results.submission_id IS 'ID của bài nộp từ exam-service (UUID)';
COMMENT ON COLUMN exam_results.user_id IS 'ID của học viên từ identity-service (UUID)';
COMMENT ON COLUMN exam_results.score IS 'Điểm số bài thi (DOUBLE PRECISION)';
COMMENT ON COLUMN exam_results.created_at IS 'Thời gian tạo bản ghi (TIMESTAMP)';

-- =====================================================================
-- BẢNG 2: proctoring_events (Sự kiện giám sát thi)
-- =====================================================================
CREATE TABLE proctoring_events (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    event_type VARCHAR(255) NOT NULL,
    event_data TEXT,
    exam_id UUID NOT NULL,
    submission_id UUID NOT NULL
);

COMMENT ON TABLE proctoring_events IS 'Lưu trữ các sự kiện giám sát thi từ proctoring-service';
COMMENT ON COLUMN proctoring_events.id IS 'ID tự động tăng (Primary Key)';
COMMENT ON COLUMN proctoring_events.created_at IS 'Thời gian xảy ra sự kiện (TIMESTAMP)';
COMMENT ON COLUMN proctoring_events.event_type IS 'Loại sự kiện (ví dụ: face_detection, tab_switch, suspicious_activity, etc.)';
COMMENT ON COLUMN proctoring_events.event_data IS 'Dữ liệu chi tiết của sự kiện dạng JSON (TEXT)';
COMMENT ON COLUMN proctoring_events.exam_id IS 'ID của bài thi từ exam-service (UUID)';
COMMENT ON COLUMN proctoring_events.submission_id IS 'ID của bài nộp từ exam-service (UUID)';

-- =====================================================================
-- BẢNG 3: courses (Cache dữ liệu khóa học)
-- =====================================================================
CREATE TABLE courses (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    enrollment_count INT DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE courses IS 'Cache dữ liệu khóa học từ course-service để giảm gọi API';
COMMENT ON COLUMN courses.id IS 'UUID của khóa học, đồng bộ với course-service';
COMMENT ON COLUMN courses.title IS 'Tiêu đề khóa học';
COMMENT ON COLUMN courses.description IS 'Mô tả khóa học';
COMMENT ON COLUMN courses.enrollment_count IS 'Số lượng học viên đã đăng ký';
COMMENT ON COLUMN courses.created_at IS 'Thời gian tạo bản ghi cache';
COMMENT ON COLUMN courses.updated_at IS 'Thời gian cập nhật bản ghi cache';


-- =====================================================================
-- BẢNG 4: users (Cache dữ liệu người dùng)
-- =====================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    avatar_url VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE users IS 'Cache dữ liệu người dùng từ identity-service để giảm gọi API';
COMMENT ON COLUMN users.id IS 'UUID của người dùng, đồng bộ với identity-service';
COMMENT ON COLUMN users.username IS 'Tên đăng nhập';
COMMENT ON COLUMN users.full_name IS 'Họ và tên đầy đủ';
COMMENT ON COLUMN users.avatar_url IS 'URL ảnh đại diện';
COMMENT ON COLUMN users.created_at IS 'Thời gian tạo bản ghi cache';
COMMENT ON COLUMN users.updated_at IS 'Thời gian cập nhật bản ghi cache';


-- =====================================================================
-- TẠO INDEX (CHỈ MỤC) ĐỂ TĂNG TỐC ĐỘ TRUY VẤN
-- =====================================================================

-- Indexes cho bảng exam_results
CREATE INDEX idx_exam_results_exam_id ON exam_results(exam_id);
CREATE INDEX idx_exam_results_submission_id ON exam_results(submission_id);
CREATE INDEX idx_exam_results_user_id ON exam_results(user_id);
CREATE INDEX idx_exam_results_exam_user ON exam_results(exam_id, user_id);
CREATE INDEX idx_exam_results_created_at ON exam_results(created_at DESC);

-- Indexes cho bảng proctoring_events
CREATE INDEX idx_proctoring_events_exam_id ON proctoring_events(exam_id);
CREATE INDEX idx_proctoring_events_submission_id ON proctoring_events(submission_id);
CREATE INDEX idx_proctoring_events_exam_submission ON proctoring_events(exam_id, submission_id);
CREATE INDEX idx_proctoring_events_event_type ON proctoring_events(event_type);
CREATE INDEX idx_proctoring_events_created_at ON proctoring_events(created_at DESC);

-- Indexes cho bảng courses
CREATE INDEX idx_courses_title ON courses(title);
CREATE INDEX idx_courses_updated_at ON courses(updated_at DESC);

-- Indexes cho bảng users
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_updated_at ON users(updated_at DESC);


-- =====================================================================
-- RÀNG BUỘC DỮ LIỆU (CONSTRAINTS)
-- =====================================================================

-- Đảm bảo score không âm
ALTER TABLE exam_results 
ADD CONSTRAINT chk_exam_results_score_non_negative 
CHECK (score >= 0);

-- =====================================================================
-- GHI CHÚ
-- =====================================================================
-- 1. JPA/Hibernate tự động map camelCase field names sang snake_case column names:
--    - examId -> exam_id
--    - submissionId -> submission_id
--    - userId -> user_id
--    - createdAt -> created_at
--    - eventType -> event_type
--    - eventData -> event_data
-- 2. LocalDateTime được map sang TIMESTAMP trong PostgreSQL
-- 3. Các index được tạo để tối ưu hóa các truy vấn từ repository methods:
--    - findByExamId, findByUserId, findBySubmissionId
