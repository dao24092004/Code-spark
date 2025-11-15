-- Migration script to add missing enum values
-- Run this script to fix the enum errors for ADMIN_WARNING and terminated status

-- Add 'ADMIN_WARNING' to event_type_enum
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'ADMIN_WARNING' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'event_type_enum')
    ) THEN
        ALTER TYPE event_type_enum ADD VALUE 'ADMIN_WARNING';
    END IF;
END $$;

-- Add 'terminated' to session_status_enum
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'terminated' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'session_status_enum')
    ) THEN
        ALTER TYPE session_status_enum ADD VALUE 'terminated';
    END IF;
END $$;

-- Verify the changes
SELECT enumlabel as event_type FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'event_type_enum') ORDER BY enumsortorder;
SELECT enumlabel as session_status FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'session_status_enum') ORDER BY enumsortorder;

