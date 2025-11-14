-- ============================================================================
-- COURSE-SERVICE INITIALIZATION SCRIPT
-- Tự động tạo bảng nếu chưa tồn tại và chèn dữ liệu mẫu
-- ============================================================================

BEGIN;

-- Đảm bảo UUID helpers tồn tại
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Tables
-- =====================================================

-- Bảng courses
CREATE TABLE IF NOT EXISTS cm_courses (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instructor_id   BIGINT      NOT NULL,
    created_by      BIGINT,
    organization_id VARCHAR(255) NOT NULL,
    title           VARCHAR(255) NOT NULL,
    slug            VARCHAR(255) UNIQUE NOT NULL,
    description     TEXT,
    thumbnail_url   VARCHAR(1024),
    visibility      VARCHAR(50) NOT NULL DEFAULT 'private',
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Bảng course_images
CREATE TABLE IF NOT EXISTS cm_course_images (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id     UUID NOT NULL REFERENCES cm_courses(id) ON DELETE CASCADE,
    image_url     TEXT NOT NULL,
    caption       VARCHAR(255),
    display_order INT NOT NULL
);

-- Bảng materials
CREATE TABLE IF NOT EXISTS cm_materials (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id     UUID NOT NULL REFERENCES cm_courses(id) ON DELETE CASCADE,
    title         VARCHAR(255) NOT NULL,
    type          VARCHAR(50) NOT NULL,
    storage_key   VARCHAR(255),
    content       TEXT,
    display_order INT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bảng quizzes
CREATE TABLE IF NOT EXISTS cm_quizzes (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id         UUID NOT NULL REFERENCES cm_courses(id) ON DELETE CASCADE,
    title             VARCHAR(255) NOT NULL,
    description       TEXT,
    time_limit_minutes INT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bảng questions
CREATE TABLE IF NOT EXISTS cm_questions (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id       UUID NOT NULL REFERENCES cm_quizzes(id) ON DELETE CASCADE,
    content       TEXT NOT NULL,
    type          VARCHAR(50) NOT NULL,
    display_order INT
);

-- Bảng question_options
CREATE TABLE IF NOT EXISTS cm_question_options (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES cm_questions(id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    is_correct  BOOLEAN NOT NULL DEFAULT FALSE
);

-- Bảng quiz_submissions
CREATE TABLE IF NOT EXISTS cm_quiz_submissions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id     UUID NOT NULL REFERENCES cm_quizzes(id) ON DELETE CASCADE,
    student_id  BIGINT NOT NULL,
    score       INT,
    answers     TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bảng progress
CREATE TABLE IF NOT EXISTS cm_progress (
    id                 BIGSERIAL PRIMARY KEY,
    student_id         BIGINT NOT NULL,
    course_id          UUID   NOT NULL REFERENCES cm_courses(id) ON DELETE CASCADE,
    percent_complete   INT    NOT NULL DEFAULT 0,
    last_material_id   UUID REFERENCES cm_materials(id),
    passed_final_exam  BOOLEAN NOT NULL DEFAULT FALSE,
    course_completed   BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_progress_student_course UNIQUE (student_id, course_id)
);

-- Bảng material_progress
CREATE TABLE IF NOT EXISTS cm_material_progress (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id   BIGINT NOT NULL,
    material_id  UUID   NOT NULL REFERENCES cm_materials(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_material_progress UNIQUE (student_id, material_id)
);

-- Bảng rewards
CREATE TABLE IF NOT EXISTS cm_rewards (
    id             BIGSERIAL PRIMARY KEY,
    student_id     BIGINT NOT NULL,
    tokens_awarded INT    NOT NULL,
    reason_code    VARCHAR(100) NOT NULL,
    related_id     VARCHAR(255),
    awarded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- Sample Data (ON CONFLICT DO NOTHING giữ cho việc chạy lại an toàn)
-- =====================================================

-- Course
INSERT INTO cm_courses (id, instructor_id, created_by, organization_id, title, slug, description, thumbnail_url, visibility)
VALUES (
    '11111111-2222-3333-4444-555555555555',
    1001,
    1001,
    'ORG-001',
    'Khóa Spring Boot cơ bản',
    'spring-boot-co-ban',
    'Giới thiệu Spring Boot và microservices',
    'https://placehold.co/600x400',
    'private'
)
ON CONFLICT (slug) DO NOTHING;

-- Course Images
INSERT INTO cm_course_images (id, course_id, image_url, caption, display_order)
VALUES (
    'img1111-2222-3333-4444-5555',
    '11111111-2222-3333-4444-555555555555',
    'https://placehold.co/800x400',
    'Spring Boot Architecture',
    1
)
ON CONFLICT (id) DO NOTHING;

-- Materials
INSERT INTO cm_materials (id, course_id, title, type, content, display_order)
VALUES
    ('aaaa1111-bbbb-2222-cccc-333333333333', '11111111-2222-3333-4444-555555555555', 'Giới thiệu dự án', 'VIDEO', 'https://youtu.be/dQw4w9WgXcQ', 1),
    ('bbbb1111-cccc-2222-dddd-333333333333', '11111111-2222-3333-4444-555555555555', 'Cấu trúc project', 'DOC', 'https://docs.example.com/structure', 2),
    ('cccc1111-dddd-2222-eeee-333333333333', '11111111-2222-3333-4444-555555555555', 'Triển khai API đầu tiên', 'VIDEO', 'https://youtu.be/z1c2d3', 3)
ON CONFLICT (id) DO NOTHING;

-- Quiz + questions/options (final exam placeholder)
INSERT INTO cm_quizzes (id, course_id, title, description, time_limit_minutes)
VALUES (
    '22222222-3333-4444-5555-666666666666',
    '11111111-2222-3333-4444-555555555555',
    'Final exam: Spring Boot Basics',
    'Đề thi cuối khóa với 2 câu hỏi trắc nghiệm.',
    15
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO cm_questions (id, quiz_id, content, type, display_order)
VALUES
    ('33333333-4444-5555-6666-777777777777', '22222222-3333-4444-5555-666666666666', 'Annotation nào giúp tạo REST controller?', 'SINGLE_CHOICE', 1),
    ('44444444-5555-6666-7777-888888888888', '22222222-3333-4444-5555-666666666666', 'Các bước cấu hình datasource là gì?', 'MULTIPLE_CHOICE', 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO cm_question_options (id, question_id, content, is_correct)
VALUES
    ('55555555-6666-7777-8888-999999999999', '33333333-4444-5555-6666-777777777777', '@RestController', TRUE),
    ('55555555-6666-7777-8888-999999999990', '33333333-4444-5555-6666-777777777777', '@Service', FALSE),
    ('66666666-7777-8888-9999-000000000001', '44444444-5555-6666-7777-888888888888', 'Cấu hình URL + username + password', TRUE),
    ('66666666-7777-8888-9999-000000000002', '44444444-5555-6666-7777-888888888888', 'Bật Hibernate ddl-auto', TRUE),
    ('66666666-7777-8888-9999-000000000003', '44444444-5555-6666-7777-888888888888', 'Cài Node.js', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Progress sample (student 2001 đã hoàn thành 1 material)
INSERT INTO cm_progress (student_id, course_id, percent_complete, last_material_id, passed_final_exam, course_completed)
VALUES (2001, '11111111-2222-3333-4444-555555555555', 33, 'aaaa1111-bbbb-2222-cccc-333333333333', FALSE, FALSE)
ON CONFLICT (student_id, course_id) DO NOTHING;

-- Material Progress sample
INSERT INTO cm_material_progress (id, student_id, material_id, completed_at)
VALUES ('mp1111-2222-3333-4444-5555', 2001, 'aaaa1111-bbbb-2222-cccc-333333333333', NOW())
ON CONFLICT (student_id, material_id) DO NOTHING;

-- Reward sample (đã tích lũy trước đó)
INSERT INTO cm_rewards (student_id, tokens_awarded, reason_code, related_id)
VALUES (2001, 50, 'WELCOME_BONUS', '11111111-2222-3333-4444-555555555555')
ON CONFLICT DO NOTHING;

COMMIT;
