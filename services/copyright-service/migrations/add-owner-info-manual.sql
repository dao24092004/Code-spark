-- Manual SQL migration to add ownerUsername and ownerEmail to Copyrights table
-- Run this in PostgreSQL if not using Sequelize migrations

-- Add columns
ALTER TABLE "Copyrights" 
ADD COLUMN IF NOT EXISTS "ownerUsername" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "ownerEmail" VARCHAR(255);

-- Add comments for documentation
COMMENT ON COLUMN "Copyrights"."ownerUsername" IS 'Username of the person who uploaded the document';
COMMENT ON COLUMN "Copyrights"."ownerEmail" IS 'Email of the person who uploaded the document';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS "idx_copyrights_owner_username" ON "Copyrights" ("ownerUsername");
CREATE INDEX IF NOT EXISTS "idx_copyrights_owner_email" ON "Copyrights" ("ownerEmail");

-- Verify columns added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Copyrights'
AND column_name IN ('ownerUsername', 'ownerEmail');

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Successfully added ownerUsername and ownerEmail columns to Copyrights table';
END $$;

