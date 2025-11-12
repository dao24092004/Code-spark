# Database Migrations

## Overview
This directory contains SQL migration files for the Online Exam Service database.

## Migration Files

### 001_add_quiz_metadata_fields.sql
Adds metadata fields to the `cm_quizzes` table:
- `difficulty` (VARCHAR): Quiz difficulty level (easy, medium, hard)
- `subject` (VARCHAR): Subject or category
- `is_proctored` (BOOLEAN): Whether proctoring is required
- `instructions` (TEXT): JSON array of instructions

### 002_add_question_metadata_fields.sql
Adds metadata fields to the `cm_questions` table:
- `explanation` (TEXT): Detailed explanation of the correct answer
- `points` (INTEGER): Points awarded for correct answer (default: 10)

### 003_add_submission_tracking_fields.sql
Adds tracking fields to the `cm_quiz_submissions` table:
- `started_at` (TIMESTAMP): When the student started the quiz
- `time_spent_seconds` (INTEGER): Total time spent on quiz
- `correct_answers` (INTEGER): Number of correct answers
- `wrong_answers` (INTEGER): Number of wrong answers
- `total_questions` (INTEGER): Total questions in the quiz

### 004_create_quiz_rankings_table.sql
Creates the `cm_quiz_rankings` table for tracking student rankings:
- Stores percentile and rank information
- Indexed for efficient queries
- Cascades deletes when quiz/submission is deleted

## Running Migrations

### Option 1: Manual Execution (PostgreSQL)
```bash
psql -U your_username -d your_database -f migrations/001_add_quiz_metadata_fields.sql
psql -U your_username -d your_database -f migrations/002_add_question_metadata_fields.sql
psql -U your_username -d your_database -f migrations/003_add_submission_tracking_fields.sql
psql -U your_username -d your_database -f migrations/004_create_quiz_rankings_table.sql
```

### Option 2: Run All Migrations
```bash
for file in migrations/*.sql; do
  psql -U your_username -d your_database -f "$file"
done
```

### Option 3: Using Node.js Script
Create a migration runner script or use a migration tool like:
- [node-pg-migrate](https://github.com/salsita/node-pg-migrate)
- [db-migrate](https://github.com/db-migrate/node-db-migrate)
- [sequelize-cli](https://github.com/sequelize/cli)

## Rollback

To rollback migrations, you would need to drop the added columns/tables:

```sql
-- Rollback 004
DROP TABLE IF EXISTS cm_quiz_rankings;

-- Rollback 003
ALTER TABLE cm_quiz_submissions 
DROP COLUMN IF EXISTS started_at,
DROP COLUMN IF EXISTS time_spent_seconds,
DROP COLUMN IF EXISTS correct_answers,
DROP COLUMN IF EXISTS wrong_answers,
DROP COLUMN IF EXISTS total_questions;

-- Rollback 002
ALTER TABLE cm_questions 
DROP COLUMN IF EXISTS explanation,
DROP COLUMN IF EXISTS points;

-- Rollback 001
ALTER TABLE cm_quizzes 
DROP COLUMN IF EXISTS difficulty,
DROP COLUMN IF EXISTS subject,
DROP COLUMN IF EXISTS is_proctored,
DROP COLUMN IF EXISTS instructions;
```

## Notes
- All migrations use `IF NOT EXISTS` / `IF EXISTS` clauses to be idempotent
- Safe to run multiple times without errors
- Check data types match your PostgreSQL version
- Backup database before running migrations in production

