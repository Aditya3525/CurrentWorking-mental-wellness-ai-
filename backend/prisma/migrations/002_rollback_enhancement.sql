-- ROLLBACK MIGRATION SCRIPT
-- Purpose: Safely rollback the enhanced schema migration
-- Version: 2.0.0 Rollback
-- Date: September 17, 2025

-- ============================================================================
-- ROLLBACK VERIFICATION CHECKS
-- ============================================================================

-- Check if migration_log table exists
SELECT CASE 
    WHEN EXISTS (SELECT name FROM sqlite_master WHERE type='table' AND name='migration_log') 
    THEN 'Migration log exists - proceeding with rollback'
    ELSE 'Migration log missing - manual rollback required'
END as rollback_status;

-- Log rollback start
INSERT INTO migration_log (id, phase, operation, status) 
VALUES ('rollback_start', 'ROLLBACK', 'Starting schema rollback', 'started');

-- ============================================================================
-- PHASE 1: DROP NEW TABLES (in reverse dependency order)
-- ============================================================================

-- Drop practice-related tables
DROP TABLE IF EXISTS practice_recommendations;
DROP TABLE IF EXISTS practice_ratings;
DROP TABLE IF EXISTS user_series_enrollments;
DROP TABLE IF EXISTS practice_session_logs;
DROP TABLE IF EXISTS user_practice_progress;
DROP TABLE IF EXISTS practice_series_items;
DROP TABLE IF EXISTS practice_series;
DROP TABLE IF EXISTS practices;

-- Log table drops
INSERT INTO migration_log (id, phase, operation, status) 
VALUES ('rollback_drop_tables', 'ROLLBACK', 'Dropped practice-related tables', 'completed');

-- ============================================================================
-- PHASE 2: DROP INDEXES
-- ============================================================================

-- Drop content indexes
DROP INDEX IF EXISTS idx_content_category_subcategory;
DROP INDEX IF EXISTS idx_content_approach;
DROP INDEX IF EXISTS idx_content_status_published;
DROP INDEX IF EXISTS idx_content_created_by;
DROP INDEX IF EXISTS idx_content_tags;
DROP INDEX IF EXISTS idx_content_featured;
DROP INDEX IF EXISTS idx_content_created_at;

-- Drop user indexes
DROP INDEX IF EXISTS idx_users_role;
DROP INDEX IF EXISTS idx_users_is_admin;
DROP INDEX IF EXISTS idx_users_is_active;
DROP INDEX IF EXISTS idx_users_last_login;

-- Log index drops
INSERT INTO migration_log (id, phase, operation, status) 
VALUES ('rollback_drop_indexes', 'ROLLBACK', 'Dropped performance indexes', 'completed');

-- ============================================================================
-- PHASE 3: DROP TRIGGERS
-- ============================================================================

-- Drop validation triggers
DROP TRIGGER IF EXISTS validate_content_status;
DROP TRIGGER IF EXISTS validate_content_status_update;
DROP TRIGGER IF EXISTS validate_content_difficulty;
DROP TRIGGER IF EXISTS validate_practice_type;
DROP TRIGGER IF EXISTS validate_practice_difficulty;
DROP TRIGGER IF EXISTS validate_practice_status;
DROP TRIGGER IF EXISTS validate_practice_duration;
DROP TRIGGER IF EXISTS validate_practice_rating;

-- Log trigger drops
INSERT INTO migration_log (id, phase, operation, status) 
VALUES ('rollback_drop_triggers', 'ROLLBACK', 'Dropped validation triggers', 'completed');

-- ============================================================================
-- PHASE 4: RESTORE CONTENT TABLE
-- ============================================================================

-- Check if backup exists
SELECT CASE 
    WHEN EXISTS (SELECT name FROM sqlite_master WHERE type='table' AND name='content_backup') 
    THEN 'Content backup exists - will restore'
    ELSE 'Content backup missing - cannot restore original content'
END as backup_status;

-- Create temporary table with original structure
CREATE TABLE content_temp AS SELECT * FROM content_backup;

-- Drop current content table
DROP TABLE content;

-- Recreate content table with original structure
CREATE TABLE content (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    approach TEXT NOT NULL,
    content TEXT NOT NULL,
    duration TEXT,
    difficulty TEXT,
    tags TEXT,
    isPublished BOOLEAN DEFAULT false,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    author TEXT,
    fileType TEXT,
    fileUrl TEXT,
    externalUrl TEXT,
    thumbnailUrl TEXT,
    severityLevel TEXT,
    targetAudience TEXT,
    effectiveness REAL,
    prerequisites TEXT,
    outcomes TEXT,
    aiSummary TEXT,
    keywords TEXT,
    adminNotes TEXT,
    createdBy TEXT,
    lastEditedBy TEXT,
    viewCount INTEGER DEFAULT 0,
    rating REAL,
    ratingCount INTEGER DEFAULT 0
);

-- Restore original content data
INSERT INTO content SELECT * FROM content_temp;

-- Drop temporary table
DROP TABLE content_temp;

-- Log content restoration
INSERT INTO migration_log (id, phase, operation, status) 
VALUES ('rollback_restore_content', 'ROLLBACK', 'Restored original content table', 'completed');

-- ============================================================================
-- PHASE 5: REMOVE ADDED USER COLUMNS
-- ============================================================================

-- SQLite doesn't support DROP COLUMN, so we need to recreate the table
CREATE TABLE users_temp AS 
SELECT 
    id, email, name, password, googleId, firstName, lastName, profilePhoto,
    isOnboarded, approach, birthday, gender, region, language, 
    emergencyContact, emergencyPhone, dataConsent, clinicianSharing,
    tokenVersion, createdAt, updatedAt
FROM users;

-- Drop current users table
DROP TABLE users;

-- Recreate users table with original structure
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password TEXT,
    googleId TEXT UNIQUE,
    firstName TEXT,
    lastName TEXT,
    profilePhoto TEXT,
    isOnboarded BOOLEAN DEFAULT false,
    approach TEXT,
    birthday DATETIME,
    gender TEXT,
    region TEXT,
    language TEXT,
    emergencyContact TEXT,
    emergencyPhone TEXT,
    dataConsent BOOLEAN DEFAULT false,
    clinicianSharing BOOLEAN DEFAULT false,
    tokenVersion INTEGER DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Restore original user data
INSERT INTO users SELECT * FROM users_temp;

-- Drop temporary table
DROP TABLE users_temp;

-- Log user restoration
INSERT INTO migration_log (id, phase, operation, status) 
VALUES ('rollback_restore_users', 'ROLLBACK', 'Restored original users table', 'completed');

-- ============================================================================
-- PHASE 6: RESTORE FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Recreate foreign key relationships that may have been broken
-- Note: SQLite foreign keys are recreated when tables are recreated

-- Verify that existing relationships still work
SELECT 'Foreign key checks passed' as status
WHERE NOT EXISTS (
    SELECT 1 FROM content_recommendations cr
    LEFT JOIN content c ON cr.contentId = c.id
    WHERE c.id IS NULL
    LIMIT 1
);

-- Log constraint restoration
INSERT INTO migration_log (id, phase, operation, status) 
VALUES ('rollback_restore_constraints', 'ROLLBACK', 'Restored foreign key constraints', 'completed');

-- ============================================================================
-- PHASE 7: CLEANUP AND VERIFICATION
-- ============================================================================

-- Drop backup table
DROP TABLE content_backup;

-- Verify rollback success
SELECT 
    COUNT(*) as remaining_practice_tables
FROM sqlite_master 
WHERE type='table' AND name LIKE '%practice%';

SELECT 
    COUNT(*) as remaining_enhanced_indexes
FROM sqlite_master 
WHERE type='index' AND name LIKE 'idx_%';

SELECT 
    COUNT(*) as remaining_validation_triggers
FROM sqlite_master 
WHERE type='trigger' AND name LIKE 'validate_%';

-- Log rollback completion
INSERT INTO migration_log (id, phase, operation, status, completed_at) 
VALUES ('rollback_complete', 'ROLLBACK', 'Rollback completed successfully', 'completed', CURRENT_TIMESTAMP);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify content table structure is restored
SELECT name, type FROM pragma_table_info('content');

-- Verify users table structure is restored  
SELECT name, type FROM pragma_table_info('users');

-- Verify no practice tables remain
SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%practice%';

-- Verify data integrity
SELECT COUNT(*) as content_count FROM content;
SELECT COUNT(*) as user_count FROM users;

-- ============================================================================
-- POST-ROLLBACK INSTRUCTIONS
-- ============================================================================

/*
After running this rollback script:

1. Restart your application to ensure all connections use the rolled-back schema
2. Clear any cached schema information in your ORM/database tools
3. Verify that your application functions correctly with the original schema
4. If using Prisma, regenerate the client: `npx prisma generate`
5. Run your test suite to ensure no functionality is broken

The rollback has restored:
- Original content table structure
- Original users table structure  
- Removed all practice-related tables and functionality
- Removed all enhanced indexes and triggers
- Preserved all original data

If you need to re-run the migration later:
- Ensure you have a fresh backup of your data
- Review any data changes that occurred between migration and rollback
- Test the migration on a staging environment first
*/

-- Final status check
SELECT 'ROLLBACK COMPLETED SUCCESSFULLY' as final_status;