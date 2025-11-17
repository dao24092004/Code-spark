-- ============================================
-- Analytics Database Migration Script
-- ============================================
-- Purpose: Create/Update analytics_db schema
-- Date: 2025-01-16
-- ============================================

-- Connect to analytics_db
\c analytics_db;

-- ============================================
-- 1. BACKUP EXISTING DATA (if tables exist)
-- ============================================

-- Backup exam_results
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'exam_results') THEN
        CREATE TABLE IF NOT EXISTS exam_results_backup AS SELECT * FROM exam_results;
        RAISE NOTICE 'Backed up exam_results to exam_results_backup';
    END IF;
END $$;

-- Backup proctoring_events
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'proctoring_events') THEN
        CREATE TABLE IF NOT EXISTS proctoring_events_backup AS SELECT * FROM proctoring_events;
        RAISE NOTICE 'Backed up proctoring_events to proctoring_events_backup';
    END IF;
END $$;

-- ============================================
-- 2. DROP OLD TABLES (if exist)
-- ============================================

DROP TABLE IF EXISTS exam_results CASCADE;
DROP TABLE IF EXISTS proctoring_events CASCADE;

-- Drop old cache tables (no longer needed)
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS courses CASCADE;

-- ============================================
-- 3. CREATE EXAM_RESULTS TABLE
-- ============================================

CREATE TABLE exam_results (
    id BIGSERIAL PRIMARY KEY,
    exam_id UUID NOT NULL,
    submission_id UUID,
    user_id UUID NOT NULL,
    score DOUBLE PRECISION NOT NULL CHECK (score >= 0 AND score <= 100),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    
    -- Constraints
    CONSTRAINT exam_results_score_range CHECK (score >= 0 AND score <= 100)
);

-- Indexes for exam_results
CREATE INDEX idx_exam_results_exam_id ON exam_results(exam_id);
CREATE INDEX idx_exam_results_user_id ON exam_results(user_id);
CREATE INDEX idx_exam_results_created_at ON exam_results(created_at);
CREATE INDEX idx_exam_results_score ON exam_results(score);
CREATE INDEX idx_exam_results_exam_user ON exam_results(exam_id, user_id);

-- Comments
COMMENT ON TABLE exam_results IS 'Stores exam submission results for analytics';
COMMENT ON COLUMN exam_results.exam_id IS 'Reference to exam in exam-service';
COMMENT ON COLUMN exam_results.user_id IS 'Reference to user in identity-service';
COMMENT ON COLUMN exam_results.score IS 'Score percentage (0-100)';

-- ============================================
-- 4. CREATE PROCTORING_EVENTS TABLE
-- ============================================

CREATE TABLE proctoring_events (
    id BIGSERIAL PRIMARY KEY,
    exam_id UUID NOT NULL,
    user_id UUID NOT NULL,
    submission_id UUID,
    event_type VARCHAR(100) NOT NULL,
    severity VARCHAR(50),
    description TEXT,
    event_data JSONB,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT proctoring_events_severity_check 
        CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'))
);

-- Indexes for proctoring_events
CREATE INDEX idx_proctoring_events_exam_id ON proctoring_events(exam_id);
CREATE INDEX idx_proctoring_events_user_id ON proctoring_events(user_id);
CREATE INDEX idx_proctoring_events_timestamp ON proctoring_events(timestamp);
CREATE INDEX idx_proctoring_events_event_type ON proctoring_events(event_type);
CREATE INDEX idx_proctoring_events_severity ON proctoring_events(severity);
CREATE INDEX idx_proctoring_events_exam_user ON proctoring_events(exam_id, user_id);

-- GIN index for JSONB data
CREATE INDEX idx_proctoring_events_event_data ON proctoring_events USING GIN (event_data);

-- Comments
COMMENT ON TABLE proctoring_events IS 'Stores proctoring events for cheating detection';
COMMENT ON COLUMN proctoring_events.event_type IS 'Type of event (e.g., face_not_detected, multiple_faces)';
COMMENT ON COLUMN proctoring_events.severity IS 'Severity level: LOW, MEDIUM, HIGH, CRITICAL';
COMMENT ON COLUMN proctoring_events.event_data IS 'Additional event data in JSON format';

-- ============================================
-- 5. INSERT SAMPLE DATA (for testing)
-- ============================================

-- Sample exam results
INSERT INTO exam_results (exam_id, submission_id, user_id, score, created_at)
VALUES 
    ('750e8400-e29b-41d4-a716-446655440000', '850e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', 85.5, NOW() - INTERVAL '1 day'),
    ('750e8400-e29b-41d4-a716-446655440000', '850e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 78.0, NOW() - INTERVAL '2 days'),
    ('750e8400-e29b-41d4-a716-446655440000', '850e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 92.5, NOW() - INTERVAL '3 days'),
    ('750e8400-e29b-41d4-a716-446655440001', '850e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 88.0, NOW() - INTERVAL '4 days'),
    ('750e8400-e29b-41d4-a716-446655440001', '850e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 75.5, NOW() - INTERVAL '5 days'),
    ('750e8400-e29b-41d4-a716-446655440002', '850e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 95.0, NOW() - INTERVAL '6 days'),
    ('750e8400-e29b-41d4-a716-446655440002', '850e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440003', 82.0, NOW() - INTERVAL '7 days'),
    ('750e8400-e29b-41d4-a716-446655440003', '850e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440000', 90.5, NOW() - INTERVAL '8 days'),
    ('750e8400-e29b-41d4-a716-446655440003', '850e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440001', 87.5, NOW() - INTERVAL '9 days'),
    ('750e8400-e29b-41d4-a716-446655440004', '850e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440002', 79.0, NOW() - INTERVAL '10 days');

-- Sample proctoring events
INSERT INTO proctoring_events (exam_id, user_id, submission_id, event_type, severity, description, timestamp)
VALUES 
    ('750e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', '850e8400-e29b-41d4-a716-446655440000', 'face_not_detected', 'HIGH', 'Face not detected for 5 seconds', NOW() - INTERVAL '1 day'),
    ('750e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', '850e8400-e29b-41d4-a716-446655440000', 'multiple_faces', 'CRITICAL', 'Multiple faces detected', NOW() - INTERVAL '1 day'),
    ('750e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', '850e8400-e29b-41d4-a716-446655440001', 'tab_switch', 'MEDIUM', 'User switched tabs', NOW() - INTERVAL '2 days'),
    ('750e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', '850e8400-e29b-41d4-a716-446655440001', 'suspicious_movement', 'LOW', 'Suspicious head movement detected', NOW() - INTERVAL '2 days'),
    ('750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', '850e8400-e29b-41d4-a716-446655440003', 'face_not_detected', 'HIGH', 'Face not detected for 3 seconds', NOW() - INTERVAL '4 days');

-- ============================================
-- 6. CREATE VIEWS (for easier querying)
-- ============================================

-- View: Exam statistics
CREATE OR REPLACE VIEW exam_statistics AS
SELECT 
    exam_id,
    COUNT(*) as total_attempts,
    COUNT(DISTINCT user_id) as unique_participants,
    AVG(score) as average_score,
    MIN(score) as min_score,
    MAX(score) as max_score,
    STDDEV(score) as score_stddev,
    MIN(created_at) as first_attempt,
    MAX(created_at) as last_attempt
FROM exam_results
GROUP BY exam_id;

COMMENT ON VIEW exam_statistics IS 'Aggregated statistics per exam';

-- View: User performance
CREATE OR REPLACE VIEW user_performance AS
SELECT 
    user_id,
    COUNT(*) as total_exams_taken,
    AVG(score) as average_score,
    MIN(score) as min_score,
    MAX(score) as max_score,
    COUNT(CASE WHEN score >= 50 THEN 1 END) as passed_exams,
    COUNT(CASE WHEN score < 50 THEN 1 END) as failed_exams,
    ROUND(COUNT(CASE WHEN score >= 50 THEN 1 END)::numeric / COUNT(*)::numeric * 100, 2) as pass_rate
FROM exam_results
GROUP BY user_id;

COMMENT ON VIEW user_performance IS 'Aggregated performance metrics per user';

-- View: Cheating risk by exam
CREATE OR REPLACE VIEW cheating_risk_by_exam AS
SELECT 
    exam_id,
    COUNT(*) as total_events,
    COUNT(CASE WHEN severity IN ('HIGH', 'CRITICAL') THEN 1 END) as suspicious_events,
    COUNT(DISTINCT user_id) as users_with_events,
    ROUND(COUNT(CASE WHEN severity IN ('HIGH', 'CRITICAL') THEN 1 END)::numeric / COUNT(*)::numeric, 2) as risk_score
FROM proctoring_events
GROUP BY exam_id;

COMMENT ON VIEW cheating_risk_by_exam IS 'Cheating risk metrics per exam';

-- View: Daily exam activity
CREATE OR REPLACE VIEW daily_exam_activity AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_attempts,
    COUNT(DISTINCT exam_id) as unique_exams,
    COUNT(DISTINCT user_id) as unique_users,
    AVG(score) as average_score
FROM exam_results
GROUP BY DATE(created_at)
ORDER BY date DESC;

COMMENT ON VIEW daily_exam_activity IS 'Daily exam activity metrics';

-- ============================================
-- 7. CREATE FUNCTIONS (for analytics)
-- ============================================

-- Function: Get score distribution for an exam
CREATE OR REPLACE FUNCTION get_score_distribution(p_exam_id UUID)
RETURNS TABLE (
    range TEXT,
    count BIGINT,
    percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH total AS (
        SELECT COUNT(*) as total_count
        FROM exam_results
        WHERE exam_id = p_exam_id
    )
    SELECT 
        CASE 
            WHEN score < 20 THEN '0-20'
            WHEN score < 40 THEN '20-40'
            WHEN score < 60 THEN '40-60'
            WHEN score < 80 THEN '60-80'
            ELSE '80-100'
        END as range,
        COUNT(*) as count,
        ROUND(COUNT(*)::numeric / total.total_count * 100, 2) as percentage
    FROM exam_results, total
    WHERE exam_id = p_exam_id
    GROUP BY range, total.total_count
    ORDER BY range;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_score_distribution IS 'Get score distribution for a specific exam';

-- Function: Get top performers
CREATE OR REPLACE FUNCTION get_top_performers(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    user_id UUID,
    average_score NUMERIC,
    total_attempts BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        er.user_id,
        ROUND(AVG(er.score)::numeric, 1) as average_score,
        COUNT(*) as total_attempts
    FROM exam_results er
    GROUP BY er.user_id
    ORDER BY average_score DESC, total_attempts DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_top_performers IS 'Get top performing users';

-- ============================================
-- 8. GRANT PERMISSIONS
-- ============================================

-- Grant permissions to analytics service user
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO analytics_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO analytics_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO analytics_user;

-- ============================================
-- 9. VERIFICATION QUERIES
-- ============================================

-- Check tables
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name IN ('exam_results', 'proctoring_events')
ORDER BY table_name;

-- Check indexes
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN ('exam_results', 'proctoring_events')
ORDER BY tablename, indexname;

-- Check views
SELECT 
    table_name as view_name
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check data counts
SELECT 'exam_results' as table_name, COUNT(*) as row_count FROM exam_results
UNION ALL
SELECT 'proctoring_events', COUNT(*) FROM proctoring_events;

-- ============================================
-- 10. CLEANUP (optional)
-- ============================================

-- Drop backup tables after verification
-- DROP TABLE IF EXISTS exam_results_backup;
-- DROP TABLE IF EXISTS proctoring_events_backup;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

SELECT 'Migration completed successfully!' as status;
