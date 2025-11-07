-- =====================================================================
-- INSERT TEST DATA FOR ANALYTICS SERVICE
-- Chạy script này sau khi đã tạo bảng bằng database-schema.sql
-- =====================================================================

-- Xóa dữ liệu cũ (nếu cần)
-- DELETE FROM proctoring_events;
-- DELETE FROM exam_results;

-- =====================================================================
-- INSERT SAMPLE EXAM RESULTS
-- =====================================================================

INSERT INTO exam_results (exam_id, submission_id, user_id, score, created_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 85.5, NOW()),
  ('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004', 75.0, NOW()),
  ('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 90.0, NOW()),
  ('550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440002', 65.5, NOW()),
  ('550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440004', 80.0, NOW());

-- =====================================================================
-- INSERT SAMPLE PROCTORING EVENTS
-- =====================================================================

INSERT INTO proctoring_events (created_at, event_type, event_data, exam_id, submission_id)
VALUES 
  (NOW(), 'face_detection', '{"detected": true, "confidence": 0.95}', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001'),
  (NOW(), 'tab_switch', '{"count": 2, "duration": 30}', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001'),
  (NOW(), 'suspicious_activity', '{"type": "multiple_faces", "severity": "high"}', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440003'),
  (NOW(), 'face_detection', '{"detected": true, "confidence": 0.88}', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440005'),
  (NOW(), 'tab_switch', '{"count": 1, "duration": 15}', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440005'),
  (NOW(), 'face_detection', '{"detected": true, "confidence": 0.92}', '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440007');

-- =====================================================================
-- VERIFY DATA
-- =====================================================================

SELECT 'Exam Results Count:' as info, COUNT(*) as count FROM exam_results;
SELECT 'Proctoring Events Count:' as info, COUNT(*) as count FROM proctoring_events;

SELECT 'Sample Exam Results:' as info;
SELECT * FROM exam_results LIMIT 5;

SELECT 'Sample Proctoring Events:' as info;
SELECT * FROM proctoring_events LIMIT 5;

