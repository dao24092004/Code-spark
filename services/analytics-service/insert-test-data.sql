-- =====================================================================
-- INSERT TEST DATA FOR ANALYTICS SERVICE (V5 - Ultra Compatible)
-- =====================================================================

-- Xóa dữ liệu cũ (nếu cần reset)
TRUNCATE TABLE proctoring_events RESTART IDENTITY CASCADE;
TRUNCATE TABLE exam_results RESTART IDENTITY CASCADE;

-- Sinh dữ liệu chỉ cho bảng exam_results để đảm bảo tương thích tối đa.
INSERT INTO exam_results (exam_id, submission_id, user_id, score, created_at)
SELECT
    -- Chọn exam_id từ một danh sách có sẵn
    CASE (floor(random() * 4))
        WHEN 0 THEN '550e8400-e29b-41d4-a716-446655440000'::uuid
        WHEN 1 THEN '550e8400-e29b-41d4-a716-44665544000A'::uuid
        WHEN 2 THEN '550e8400-e29b-41d4-a716-44665544000B'::uuid
        ELSE '550e8400-e29b-41d4-a716-44665544000C'::uuid
    END,
    -- Tạo UUID tương thích
    md5(random()::text)::uuid,
    -- Chọn user_id từ một danh sách có sẵn
    CASE (floor(random() * 8))
        WHEN 0 THEN '550e8400-e29b-41d4-a716-111111111111'::uuid
        WHEN 1 THEN '550e8400-e29b-41d4-a716-222222222222'::uuid
        WHEN 2 THEN '550e8400-e29b-41d4-a716-333333333333'::uuid
        WHEN 3 THEN '550e8400-e29b-41d4-a716-444444444444'::uuid
        WHEN 4 THEN '550e8400-e29b-41d4-a716-555555555555'::uuid
        WHEN 5 THEN '550e8400-e29b-41d4-a716-666666666666'::uuid
        WHEN 6 THEN '550e8400-e29b-41d4-a716-777777777777'::uuid
        ELSE '550e8400-e29b-41d4-a716-888888888888'::uuid
    END,
    -- Tạo điểm ngẫu nhiên
    60 + (random() * 40),
    -- Tạo ngày ngẫu nhiên trong 30 ngày qua
    NOW() - (floor(random() * 30) * interval '1 day')
FROM generate_series(1, 120); -- Tạo 120 bản ghi