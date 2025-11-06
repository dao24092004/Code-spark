-- =====================================================================
-- DATABASE SETUP SCRIPT FOR SERVICE 8 (ORGANIZATION MANAGEMENT)
-- CHẠY SCRIPT NÀY TRONG profile_db
-- =====================================================================

-- NHÓM 1: QUẢN LÝ TỔ CHỨC & THÀNH VIÊN
CREATE TABLE organizations (
    id BIGSERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL,
    owner_id BIGINT NOT NULL, image_url TEXT, org_type VARCHAR(100),
    org_size VARCHAR(100), industry VARCHAR(100), package VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    is_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE organization_members (
    id BIGSERIAL PRIMARY KEY,
    organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL, org_role VARCHAR(50) NOT NULL,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);
-- NHÓM 2: QUẢN LÝ LỚP HỌC & LIÊN KẾT KHÓA HỌC
CREATE TABLE organization_groups (
    id BIGSERIAL PRIMARY KEY,
    organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    instructor_id BIGINT REFERENCES organization_members(id),
    name VARCHAR(255) NOT NULL, description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE group_members (
    id BIGSERIAL PRIMARY KEY,
    group_id BIGINT NOT NULL REFERENCES organization_groups(id) ON DELETE CASCADE,
    member_id BIGINT NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(group_id, member_id)
);
CREATE TABLE group_courses (
    id BIGSERIAL PRIMARY KEY,
    group_id BIGINT NOT NULL REFERENCES organization_groups(id) ON DELETE CASCADE,
    course_id UUID NOT NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(group_id, course_id)
);
-- NHÓM 3: HỆ THỐNG TEST TUYỂN DỤNG ĐỘC LẬP
CREATE TABLE recruitment_tests (
    id BIGSERIAL PRIMARY KEY,
    organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL, description TEXT,
    duration_minutes INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE recruitment_questions (
    id BIGSERIAL PRIMARY KEY,
    test_id BIGINT NOT NULL REFERENCES recruitment_tests(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL DEFAULT 'multiple_choice'
);
CREATE TABLE recruitment_answers (
    id BIGSERIAL PRIMARY KEY,
    question_id BIGINT NOT NULL REFERENCES recruitment_questions(id) ON DELETE CASCADE,
    content TEXT NOT NULL, is_correct BOOLEAN NOT NULL DEFAULT false
);
CREATE TABLE recruitment_assignments (
    id BIGSERIAL PRIMARY KEY,
    test_id BIGINT NOT NULL REFERENCES recruitment_tests(id) ON DELETE CASCADE,
    candidate_id BIGINT NOT NULL,
    organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'assigned',
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE recruitment_submissions (
    id BIGSERIAL PRIMARY KEY,
    assignment_id BIGINT NOT NULL REFERENCES recruitment_assignments(id) ON DELETE CASCADE,
    score FLOAT NOT NULL, started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);