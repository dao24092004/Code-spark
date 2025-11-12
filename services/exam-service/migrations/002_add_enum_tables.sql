-- Migration: Add enum lookup tables for Exam entities
-- Date: 2025-11-03
-- Description: Creates lookup tables for exam types, difficulties, and statuses
-- Benefit: Centralize enum values in database instead of hardcoding in frontend

-- ==================== Exam Types ====================

CREATE TABLE IF NOT EXISTS exam_types (
    code VARCHAR(50) PRIMARY KEY,
    label VARCHAR(100) NOT NULL,
    label_vi VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed data for exam types
INSERT INTO exam_types (code, label, label_vi, description, display_order) VALUES
    ('practice', 'Practice', 'Luyện tập', 'Practice exam for self-study', 1),
    ('quiz', 'Quiz', 'Kiểm tra', 'Short quiz assessment', 2),
    ('midterm', 'Midterm', 'Giữa kỳ', 'Midterm examination', 3),
    ('final', 'Final', 'Cuối kỳ', 'Final examination', 4),
    ('assignment', 'Assignment', 'Bài tập', 'Take-home assignment', 5)
ON CONFLICT (code) DO NOTHING;

-- ==================== Exam Difficulties ====================

CREATE TABLE IF NOT EXISTS exam_difficulties (
    code VARCHAR(50) PRIMARY KEY,
    label VARCHAR(100) NOT NULL,
    label_vi VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed data for difficulties
INSERT INTO exam_difficulties (code, label, label_vi, description, display_order) VALUES
    ('easy', 'Easy', 'Dễ', 'Basic level questions', 1),
    ('medium', 'Medium', 'Trung bình', 'Intermediate level questions', 2),
    ('hard', 'Hard', 'Khó', 'Advanced level questions', 3)
ON CONFLICT (code) DO NOTHING;

-- ==================== Exam Statuses ====================

CREATE TABLE IF NOT EXISTS exam_statuses (
    code VARCHAR(50) PRIMARY KEY,
    label VARCHAR(100) NOT NULL,
    label_vi VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed data for statuses
INSERT INTO exam_statuses (code, label, label_vi, description, display_order) VALUES
    ('draft', 'Draft', 'Nháp', 'Exam is being drafted', 1),
    ('published', 'Published', 'Đã xuất bản', 'Exam is published and available', 2),
    ('ongoing', 'Ongoing', 'Đang diễn ra', 'Exam is currently in progress', 3),
    ('ended', 'Ended', 'Đã kết thúc', 'Exam has ended', 4),
    ('archived', 'Archived', 'Lưu trữ', 'Exam is archived', 5)
ON CONFLICT (code) DO NOTHING;

-- ==================== Comments ====================

COMMENT ON TABLE exam_types IS 'Lookup table for exam types (practice, quiz, midterm, etc.)';
COMMENT ON TABLE exam_difficulties IS 'Lookup table for difficulty levels (easy, medium, hard)';
COMMENT ON TABLE exam_statuses IS 'Lookup table for exam statuses (draft, published, etc.)';

COMMENT ON COLUMN exam_types.code IS 'Unique code used in application (e.g., "practice")';
COMMENT ON COLUMN exam_types.label IS 'English label for display';
COMMENT ON COLUMN exam_types.label_vi IS 'Vietnamese label for display';
COMMENT ON COLUMN exam_types.display_order IS 'Order to display in dropdowns';
COMMENT ON COLUMN exam_types.is_active IS 'Whether this type is currently active/available';

-- ==================== Rollback Script ====================

-- To rollback this migration:
-- DROP TABLE IF EXISTS exam_statuses;
-- DROP TABLE IF EXISTS exam_difficulties;
-- DROP TABLE IF EXISTS exam_types;

