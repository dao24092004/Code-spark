-- =====================================================================
-- INSERT TEST DATA FOR ANALYTICS SERVICE
-- Chạy script này sau khi đã tạo bảng bằng database-schema.sql
-- =====================================================================

-- Script giả lập dữ liệu trong 30 ngày gần nhất cho các API analytics mới.
-- YÊU CẦU: kích hoạt extension uuid-ossp để tạo UUID ngẫu nhiên.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Xóa dữ liệu cũ (nếu cần reset)
TRUNCATE TABLE proctoring_events RESTART IDENTITY CASCADE;
TRUNCATE TABLE exam_results RESTART IDENTITY CASCADE;

-- Danh sách các exam mẫu và người dùng mẫu sẽ được quay vòng trong quá trình sinh dữ liệu.
WITH params AS (
    SELECT 
        ARRAY[
            '550e8400-e29b-41d4-a716-446655440000'::uuid, -- ReactJS Specialist
            '550e8400-e29b-41d4-a716-44665544000A'::uuid, -- Spring Boot Architect
            '550e8400-e29b-41d4-a716-44665544000B'::uuid, -- Data Science Advanced
            '550e8400-e29b-41d4-a716-44665544000C'::uuid  -- UI/UX Certification
        ] AS exam_ids,
        ARRAY[
            '550e8400-e29b-41d4-a716-111111111111'::uuid,
            '550e8400-e29b-41d4-a716-222222222222'::uuid,
            '550e8400-e29b-41d4-a716-333333333333'::uuid,
            '550e8400-e29b-41d4-a716-444444444444'::uuid,
            '550e8400-e29b-41d4-a716-555555555555'::uuid,
            '550e8400-e29b-41d4-a716-666666666666'::uuid,
            '550e8400-e29b-41d4-a716-777777777777'::uuid,
            '550e8400-e29b-41d4-a716-888888888888'::uuid
        ] AS user_ids
)
-- Sinh dữ liệu exam_results cho 30 ngày, mỗi ngày 4 lượt thi
INSERT INTO exam_results (exam_id, submission_id, user_id, score, created_at)
SELECT 
    params.exam_ids[(day_offset % array_length(params.exam_ids, 1)) + 1],
    uuid_generate_v4(),
    params.user_ids[((day_offset + attempt) % array_length(params.user_ids, 1)) + 1],
    GREATEST(45.0, LEAST(100.0, 60 + (random() * 35) + (attempt * 2) - (day_offset % 5))),
    NOW() - (day_offset || ' days')::interval + make_interval(minutes => attempt * 10)
FROM params,
     generate_series(0, 29) AS day_offset,
     generate_series(1, 4) AS attempt;

-- Sinh dữ liệu proctoring_events tương ứng, mỗi submission có 2-3 event
DO $$
DECLARE
    evt_types TEXT[] := ARRAY['face_detection', 'tab_switch', 'suspicious_activity', 'audio_noise'];
    rec RECORD;
    evt_count INTEGER;
    idx INTEGER;
BEGIN
    FOR rec IN SELECT id, exam_id, submission_id, created_at FROM exam_results LOOP
        evt_count := 2 + (random() * 2);
        FOR idx IN 1..evt_count LOOP
            INSERT INTO proctoring_events (created_at, event_type, event_data, exam_id, submission_id)
            VALUES (
                rec.created_at + make_interval(minutes => idx * 2),
                evt_types[ ((rec.id + idx) % array_length(evt_types, 1)) + 1 ],
                json_build_object(
                    'severity', CASE WHEN idx = evt_count AND random() > 0.7 THEN 'high' ELSE 'normal' END,
                    'confidence', round(random()::numeric, 2)
                )::text,
                rec.exam_id,
                rec.submission_id
            );
        END LOOP;
    END LOOP;
END $$;

-- =====================================================================
-- VERIFY DATA
-- =====================================================================

SELECT 'Exam Results Count:' as info, COUNT(*) as count FROM exam_results;
SELECT 'Proctoring Events Count:' as info, COUNT(*) as count FROM proctoring_events;

SELECT 'Score overview (avg / min / max):' AS info,
       ROUND(AVG(score),2) AS avg_score,
        MIN(score) AS min_score,
        MAX(score) AS max_score
FROM exam_results;

SELECT 'Recent Exam Results:' AS info;
SELECT exam_id, user_id, score, created_at
FROM exam_results
ORDER BY created_at DESC
LIMIT 10;

SELECT 'Recent Proctoring Events:' AS info;
SELECT exam_id, submission_id, event_type, created_at
FROM proctoring_events
ORDER BY created_at DESC
LIMIT 10;
