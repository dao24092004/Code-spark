-- Migration: Add mimeType and other missing fields to Copyrights table
-- Run this if the columns don't exist yet

-- Add mimeType column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Copyrights' AND column_name = 'mimeType'
    ) THEN
        ALTER TABLE "Copyrights" ADD COLUMN "mimeType" VARCHAR(255);
        COMMENT ON COLUMN "Copyrights"."mimeType" IS 'MIME type of the uploaded file (e.g., application/pdf, image/jpeg)';
    END IF;
END $$;

-- Add fileSize column (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Copyrights' AND column_name = 'fileSize'
    ) THEN
        ALTER TABLE "Copyrights" ADD COLUMN "fileSize" INTEGER;
        COMMENT ON COLUMN "Copyrights"."fileSize" IS 'File size in bytes';
    END IF;
END $$;

-- Add title column (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Copyrights' AND column_name = 'title'
    ) THEN
        ALTER TABLE "Copyrights" ADD COLUMN "title" VARCHAR(255);
        COMMENT ON COLUMN "Copyrights"."title" IS 'Document title';
    END IF;
END $$;

-- Add author column (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Copyrights' AND column_name = 'author'
    ) THEN
        ALTER TABLE "Copyrights" ADD COLUMN "author" VARCHAR(255);
        COMMENT ON COLUMN "Copyrights"."author" IS 'Document author';
    END IF;
END $$;

-- Add description column (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Copyrights' AND column_name = 'description'
    ) THEN
        ALTER TABLE "Copyrights" ADD COLUMN "description" TEXT;
        COMMENT ON COLUMN "Copyrights"."description" IS 'Document description';
    END IF;
END $$;

-- Add category column (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Copyrights' AND column_name = 'category'
    ) THEN
        ALTER TABLE "Copyrights" ADD COLUMN "category" VARCHAR(255);
        COMMENT ON COLUMN "Copyrights"."category" IS 'Document category';
    END IF;
END $$;

-- Update existing records: try to detect mimeType from filename
UPDATE "Copyrights" 
SET "mimeType" = CASE
    WHEN LOWER("filename") LIKE '%.pdf' THEN 'application/pdf'
    WHEN LOWER("filename") LIKE '%.jpg' OR LOWER("filename") LIKE '%.jpeg' THEN 'image/jpeg'
    WHEN LOWER("filename") LIKE '%.png' THEN 'image/png'
    WHEN LOWER("filename") LIKE '%.gif' THEN 'image/gif'
    WHEN LOWER("filename") LIKE '%.webp' THEN 'image/webp'
    WHEN LOWER("filename") LIKE '%.txt' THEN 'text/plain'
    WHEN LOWER("filename") LIKE '%.html' OR LOWER("filename") LIKE '%.htm' THEN 'text/html'
    WHEN LOWER("filename") LIKE '%.doc' THEN 'application/msword'
    WHEN LOWER("filename") LIKE '%.docx' THEN 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    WHEN LOWER("filename") LIKE '%.xls' THEN 'application/vnd.ms-excel'
    WHEN LOWER("filename") LIKE '%.xlsx' THEN 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    WHEN LOWER("filename") LIKE '%.ppt' THEN 'application/vnd.ms-powerpoint'
    WHEN LOWER("filename") LIKE '%.pptx' THEN 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ELSE NULL
END
WHERE "mimeType" IS NULL;

SELECT 'Migration completed successfully!' AS status;

