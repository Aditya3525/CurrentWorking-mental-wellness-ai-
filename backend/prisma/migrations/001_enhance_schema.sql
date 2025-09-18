-- Database Migration Script for Enhanced Schema
-- Version: 2.0.0
-- Date: September 17, 2025
-- Purpose: Enhance database schema for comprehensive content and practice management

-- ============================================================================
-- PHASE 1: PREPARE FOR MIGRATION
-- ============================================================================

-- Create backup table for existing content
CREATE TABLE content_backup AS SELECT * FROM content;

-- Create migration log table
CREATE TABLE migration_log (
    id TEXT PRIMARY KEY,
    phase TEXT NOT NULL,
    operation TEXT NOT NULL,
    table_name TEXT,
    status TEXT DEFAULT 'pending',
    error_message TEXT,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    rollback_sql TEXT
);

-- Log migration start
INSERT INTO migration_log (id, phase, operation, status) 
VALUES ('migration_start', 'INIT', 'Migration Start', 'started');

-- ============================================================================
-- PHASE 2: ENHANCE USER MODEL
-- ============================================================================

-- Add admin fields to existing User model
ALTER TABLE users ADD COLUMN isAdmin BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';
ALTER TABLE users ADD COLUMN permissions TEXT; -- JSON array
ALTER TABLE users ADD COLUMN isActive BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN lastLoginAt DATETIME;

-- Log user enhancement
INSERT INTO migration_log (id, phase, operation, table_name, status, rollback_sql) 
VALUES (
    'user_enhancement', 
    'USER_MODEL', 
    'Add admin fields', 
    'users', 
    'completed',
    'ALTER TABLE users DROP COLUMN isAdmin; ALTER TABLE users DROP COLUMN role; ALTER TABLE users DROP COLUMN permissions; ALTER TABLE users DROP COLUMN isActive; ALTER TABLE users DROP COLUMN lastLoginAt;'
);

-- ============================================================================
-- PHASE 3: ENHANCE CONTENT MODEL
-- ============================================================================

-- Add new fields to existing Content model
ALTER TABLE content ADD COLUMN contentUrl TEXT;
ALTER TABLE content ADD COLUMN uploadedFileName TEXT;
ALTER TABLE content ADD COLUMN subcategory TEXT;
ALTER TABLE content ADD COLUMN status TEXT DEFAULT 'Draft';
ALTER TABLE content ADD COLUMN featured BOOLEAN DEFAULT false;
ALTER TABLE content ADD COLUMN publishedAt DATETIME;

-- Convert existing fields
-- Update duration from String to Integer (assume format like "10 min", "1 hour")
ALTER TABLE content ADD COLUMN duration_int INTEGER;

-- Update existing duration values - this is a simplified conversion
-- In real migration, you'd need more sophisticated parsing
UPDATE content SET duration_int = CASE 
    WHEN duration LIKE '%min%' THEN CAST(REPLACE(REPLACE(duration, ' min', ''), ' minutes', '') AS INTEGER)
    WHEN duration LIKE '%hour%' THEN CAST(REPLACE(REPLACE(duration, ' hour', ''), ' hours', '') AS INTEGER) * 60
    WHEN duration LIKE '%hr%' THEN CAST(REPLACE(REPLACE(duration, ' hr', ''), ' hrs', '') AS INTEGER) * 60
    ELSE 0
END;

-- Convert tags from comma-separated string to JSON array format
ALTER TABLE content ADD COLUMN tags_array TEXT; -- Will store JSON array

-- Convert existing comma-separated tags to JSON array format
UPDATE content SET tags_array = 
    CASE 
        WHEN tags IS NOT NULL AND tags != '' THEN 
            '["' || REPLACE(REPLACE(tags, ', ', '","'), ',', '","') || '"]'
        ELSE '[]'
    END;

-- Update existing content to have proper status
UPDATE content SET status = CASE 
    WHEN isPublished = true THEN 'Published'
    ELSE 'Draft'
END;

-- Set default values for required fields
UPDATE content SET createdBy = 'system' WHERE createdBy IS NULL;
UPDATE content SET severityLevel = 'Mild' WHERE severityLevel IS NULL;

-- Log content enhancement
INSERT INTO migration_log (id, phase, operation, table_name, status, rollback_sql) 
VALUES (
    'content_enhancement', 
    'CONTENT_MODEL', 
    'Add new fields and convert existing', 
    'content', 
    'completed',
    'ALTER TABLE content DROP COLUMN contentUrl; ALTER TABLE content DROP COLUMN uploadedFileName; ALTER TABLE content DROP COLUMN subcategory; ALTER TABLE content DROP COLUMN status; ALTER TABLE content DROP COLUMN featured; ALTER TABLE content DROP COLUMN publishedAt; ALTER TABLE content DROP COLUMN duration_int; ALTER TABLE content DROP COLUMN tags_array;'
);

-- ============================================================================
-- PHASE 4: CREATE PRACTICE MODEL
-- ============================================================================

-- Create the comprehensive Practice model
CREATE TABLE practices (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    instructions TEXT NOT NULL,
    
    -- Timing
    duration INTEGER NOT NULL,
    preparation_time INTEGER,
    wind_down_time INTEGER,
    
    -- Classification
    practice_type TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT,
    approach TEXT NOT NULL,
    severity_level TEXT DEFAULT 'Mild',
    
    -- Content and media
    tags TEXT NOT NULL DEFAULT '[]', -- JSON array
    audio_guide_url TEXT,
    visual_aids_url TEXT,
    video_url TEXT,
    equipment TEXT, -- JSON array
    environment TEXT,
    
    -- Metadata
    benefits TEXT, -- JSON array
    contraindications TEXT,
    modifications TEXT, -- JSON
    progress_markers TEXT, -- JSON
    
    -- Status
    status TEXT DEFAULT 'Draft',
    is_published BOOLEAN DEFAULT false,
    featured BOOLEAN DEFAULT false,
    
    -- Analytics
    view_count INTEGER DEFAULT 0,
    completion_rate REAL,
    rating REAL,
    rating_count INTEGER DEFAULT 0,
    
    -- Admin management
    admin_notes TEXT,
    created_by TEXT NOT NULL,
    last_modified_by TEXT,
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    published_at DATETIME,
    
    FOREIGN KEY (created_by) REFERENCES users (id),
    FOREIGN KEY (last_modified_by) REFERENCES users (id)
);

-- Migrate hardcoded practice data from frontend to database
-- This data was extracted from the frontend Practices.tsx file
INSERT INTO practices (
    id, title, description, instructions, duration, practice_type, difficulty, 
    category, approach, tags, audio_guide_url, created_by, status, is_published
) VALUES 
(
    'practice_1',
    '5-Minute Calm Breathing',
    'Quick and effective breathing technique to reduce anxiety and center yourself.',
    'Find a comfortable seated position. Close your eyes and focus on your breath. Inhale slowly for 4 counts, hold for 4 counts, exhale for 6 counts. Repeat this pattern throughout the practice.',
    5,
    'Breathing',
    'Beginner',
    'Stress Relief',
    'All',
    '["anxiety", "quick", "workplace"]',
    'https://example.com/audio/calm-breathing.mp3',
    'system',
    'Published',
    true
),
(
    'practice_2',
    'Body Scan Meditation',
    'Progressive relaxation technique to release tension and increase body awareness.',
    'Lie down comfortably. Start by focusing on the top of your head, gradually moving your attention down through each part of your body. Notice any tension and consciously relax each area.',
    15,
    'Meditation',
    'Beginner',
    'Relaxation',
    'Eastern',
    '["relaxation", "sleep", "tension"]',
    'https://example.com/audio/body-scan.mp3',
    'system',
    'Published',
    true
),
(
    'practice_3',
    'Gentle Morning Yoga',
    'Wake up your body with gentle stretches and mindful movement.',
    'Begin in child''s pose. Move slowly through cat-cow stretches, downward dog, and gentle forward folds. Focus on connecting breath with movement.',
    20,
    'Yoga',
    'Beginner',
    'Physical Wellness',
    'Eastern',
    '["morning", "energy", "flexibility"]',
    'https://example.com/audio/morning-yoga.mp3',
    'system',
    'Published',
    true
),
(
    'practice_4',
    'Deep Sleep Preparation',
    'Wind down with this calming practice designed to prepare your mind and body for rest.',
    'Create a peaceful environment. Practice progressive muscle relaxation starting from your toes and working up to your head. End with gentle breathing exercises.',
    25,
    'Sleep',
    'Beginner',
    'Sleep',
    'Hybrid',
    '["sleep", "evening", "insomnia"]',
    'https://example.com/audio/sleep-prep.mp3',
    'system',
    'Published',
    true
),
(
    'practice_5',
    'Loving-Kindness Meditation',
    'Cultivate compassion and self-acceptance through this traditional meditation practice.',
    'Begin by sending loving-kindness to yourself, then gradually extend these feelings to loved ones, neutral people, difficult people, and finally all beings.',
    18,
    'Meditation',
    'Intermediate',
    'Emotional Regulation',
    'Eastern',
    '["compassion", "self-love", "relationships"]',
    'https://example.com/audio/loving-kindness.mp3',
    'system',
    'Published',
    true
),
(
    'practice_6',
    '4-7-8 Breathing for Anxiety',
    'Powerful breathing pattern to quickly calm the nervous system during anxious moments.',
    'Exhale completely. Inhale through nose for 4 counts, hold breath for 7 counts, exhale through mouth for 8 counts. Repeat 3-4 cycles.',
    8,
    'Breathing',
    'Beginner',
    'Stress Relief',
    'Western',
    '["anxiety", "panic", "quick relief"]',
    'https://example.com/audio/478-breathing.mp3',
    'system',
    'Published',
    true
);

-- Log practice creation
INSERT INTO migration_log (id, phase, operation, table_name, status, rollback_sql) 
VALUES (
    'practice_creation', 
    'PRACTICE_MODEL', 
    'Create practice table and seed data', 
    'practices', 
    'completed',
    'DROP TABLE practices;'
);

-- ============================================================================
-- PHASE 5: CREATE SUPPORTING MODELS
-- ============================================================================

-- Practice Series model
CREATE TABLE practice_series (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    total_sessions INTEGER NOT NULL,
    recommended_frequency TEXT,
    estimated_duration INTEGER,
    category TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    approach TEXT NOT NULL,
    severity_level TEXT DEFAULT 'Mild',
    tags TEXT DEFAULT '[]',
    thumbnail_url TEXT,
    overview TEXT,
    prerequisites TEXT,
    status TEXT DEFAULT 'Draft',
    is_published BOOLEAN DEFAULT false,
    featured BOOLEAN DEFAULT false,
    created_by TEXT NOT NULL,
    last_modified_by TEXT,
    admin_notes TEXT,
    enrollment_count INTEGER DEFAULT 0,
    completion_rate REAL,
    rating REAL,
    rating_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    published_at DATETIME
);

-- Practice Series Items (junction table)
CREATE TABLE practice_series_items (
    id TEXT PRIMARY KEY,
    series_id TEXT NOT NULL,
    practice_id TEXT NOT NULL,
    session_number INTEGER NOT NULL,
    title TEXT,
    notes TEXT,
    is_required BOOLEAN DEFAULT true,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (series_id) REFERENCES practice_series (id) ON DELETE CASCADE,
    FOREIGN KEY (practice_id) REFERENCES practices (id) ON DELETE CASCADE,
    UNIQUE(series_id, practice_id),
    UNIQUE(series_id, session_number)
);

-- User Practice Progress
CREATE TABLE user_practice_progress (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    practice_id TEXT NOT NULL,
    total_sessions INTEGER DEFAULT 0,
    completed_sessions INTEGER DEFAULT 0,
    total_minutes INTEGER DEFAULT 0,
    average_rating REAL,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_practice_date DATETIME,
    is_favorite BOOLEAN DEFAULT false,
    user_notes TEXT,
    custom_reminders TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (practice_id) REFERENCES practices (id) ON DELETE CASCADE,
    UNIQUE(user_id, practice_id)
);

-- Practice Session Logs
CREATE TABLE practice_session_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    practice_id TEXT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    duration INTEGER,
    completed BOOLEAN DEFAULT false,
    quality INTEGER,
    mood_before TEXT,
    mood_after TEXT,
    session_notes TEXT,
    challenges TEXT,
    insights TEXT,
    environment TEXT,
    time_of_day TEXT,
    interruptions BOOLEAN DEFAULT false,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (practice_id) REFERENCES practices (id) ON DELETE CASCADE
);

-- User Series Enrollment
CREATE TABLE user_series_enrollments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    series_id TEXT NOT NULL,
    enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    started_at DATETIME,
    completed_at DATETIME,
    current_session INTEGER DEFAULT 1,
    completed_sessions INTEGER DEFAULT 0,
    total_minutes INTEGER DEFAULT 0,
    status TEXT DEFAULT 'enrolled',
    reminder_frequency TEXT,
    preferred_time TEXT,
    user_goals TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (series_id) REFERENCES practice_series (id) ON DELETE CASCADE,
    UNIQUE(user_id, series_id)
);

-- Practice Ratings
CREATE TABLE practice_ratings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    practice_id TEXT NOT NULL,
    rating INTEGER NOT NULL,
    review TEXT,
    helpful BOOLEAN,
    difficulty_rating INTEGER,
    clarity_rating INTEGER,
    is_verified BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT true,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (practice_id) REFERENCES practices (id) ON DELETE CASCADE,
    UNIQUE(user_id, practice_id)
);

-- Practice Recommendations
CREATE TABLE practice_recommendations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    practice_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    relevance_score REAL NOT NULL,
    priority INTEGER NOT NULL,
    category TEXT NOT NULL,
    based_on TEXT,
    confidence REAL,
    viewed BOOLEAN DEFAULT false,
    accepted BOOLEAN DEFAULT false,
    dismissed BOOLEAN DEFAULT false,
    recommended_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    FOREIGN KEY (practice_id) REFERENCES practices (id) ON DELETE CASCADE
);

-- Log supporting models creation
INSERT INTO migration_log (id, phase, operation, table_name, status) 
VALUES 
('practice_series_creation', 'SUPPORTING_MODELS', 'Create practice series tables', 'practice_series', 'completed'),
('practice_progress_creation', 'SUPPORTING_MODELS', 'Create practice progress tables', 'user_practice_progress', 'completed'),
('practice_ratings_creation', 'SUPPORTING_MODELS', 'Create practice ratings table', 'practice_ratings', 'completed');

-- ============================================================================
-- PHASE 6: CREATE PERFORMANCE INDEXES
-- ============================================================================

-- Content model indexes
CREATE INDEX idx_content_category_subcategory ON content(category, subcategory);
CREATE INDEX idx_content_approach ON content(approach);
CREATE INDEX idx_content_status_published ON content(status, isPublished);
CREATE INDEX idx_content_created_by ON content(createdBy);
CREATE INDEX idx_content_tags ON content(tags_array);
CREATE INDEX idx_content_featured ON content(featured);
CREATE INDEX idx_content_created_at ON content(createdAt);

-- Practice model indexes
CREATE INDEX idx_practices_type_category ON practices(practice_type, category);
CREATE INDEX idx_practices_difficulty_approach ON practices(difficulty, approach);
CREATE INDEX idx_practices_status_published ON practices(status, is_published);
CREATE INDEX idx_practices_created_by ON practices(created_by);
CREATE INDEX idx_practices_tags ON practices(tags);
CREATE INDEX idx_practices_featured ON practices(featured);
CREATE INDEX idx_practices_duration ON practices(duration);

-- User practice progress indexes
CREATE INDEX idx_user_practice_progress_user ON user_practice_progress(user_id);
CREATE INDEX idx_user_practice_progress_practice ON user_practice_progress(practice_id);
CREATE INDEX idx_user_practice_progress_streak ON user_practice_progress(current_streak);
CREATE INDEX idx_user_practice_progress_last_practice ON user_practice_progress(last_practice_date);

-- Practice session logs indexes
CREATE INDEX idx_practice_sessions_user_practice ON practice_session_logs(user_id, practice_id);
CREATE INDEX idx_practice_sessions_start_time ON practice_session_logs(start_time);
CREATE INDEX idx_practice_sessions_completed ON practice_session_logs(completed);

-- Practice recommendations indexes
CREATE INDEX idx_practice_recommendations_user_priority ON practice_recommendations(user_id, priority);
CREATE INDEX idx_practice_recommendations_recommended_at ON practice_recommendations(recommended_at);
CREATE INDEX idx_practice_recommendations_expires_at ON practice_recommendations(expires_at);

-- User model indexes for admin functionality
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_admin ON users(isAdmin);
CREATE INDEX idx_users_is_active ON users(isActive);
CREATE INDEX idx_users_last_login ON users(lastLoginAt);

-- Log index creation
INSERT INTO migration_log (id, phase, operation, status) 
VALUES ('index_creation', 'PERFORMANCE', 'Create performance indexes', 'completed');

-- ============================================================================
-- PHASE 7: DATA VALIDATION AND CONSTRAINTS
-- ============================================================================

-- Add check constraints for data validation

-- Content constraints
-- Note: SQLite has limited constraint support, so we'll create triggers for validation

-- Trigger to validate content status
CREATE TRIGGER validate_content_status
    BEFORE INSERT ON content
    WHEN NEW.status NOT IN ('Draft', 'Published', 'Archived', 'Under Review')
BEGIN
    SELECT RAISE(ABORT, 'Invalid content status. Must be: Draft, Published, Archived, or Under Review');
END;

CREATE TRIGGER validate_content_status_update
    BEFORE UPDATE ON content
    WHEN NEW.status NOT IN ('Draft', 'Published', 'Archived', 'Under Review')
BEGIN
    SELECT RAISE(ABORT, 'Invalid content status. Must be: Draft, Published, Archived, or Under Review');
END;

-- Trigger to validate content difficulty
CREATE TRIGGER validate_content_difficulty
    BEFORE INSERT ON content
    WHEN NEW.difficulty IS NOT NULL AND NEW.difficulty NOT IN ('Beginner', 'Intermediate', 'Advanced')
BEGIN
    SELECT RAISE(ABORT, 'Invalid content difficulty. Must be: Beginner, Intermediate, or Advanced');
END;

-- Practice constraints
CREATE TRIGGER validate_practice_type
    BEFORE INSERT ON practices
    WHEN NEW.practice_type NOT IN ('Meditation', 'Breathing', 'Yoga', 'Mindfulness', 'Visualization', 'Movement')
BEGIN
    SELECT RAISE(ABORT, 'Invalid practice type');
END;

CREATE TRIGGER validate_practice_difficulty
    BEFORE INSERT ON practices
    WHEN NEW.difficulty NOT IN ('Beginner', 'Intermediate', 'Advanced')
BEGIN
    SELECT RAISE(ABORT, 'Invalid practice difficulty');
END;

CREATE TRIGGER validate_practice_status
    BEFORE INSERT ON practices
    WHEN NEW.status NOT IN ('Draft', 'Published', 'Archived', 'Under Review')
BEGIN
    SELECT RAISE(ABORT, 'Invalid practice status');
END;

-- Trigger to validate practice duration (must be positive)
CREATE TRIGGER validate_practice_duration
    BEFORE INSERT ON practices
    WHEN NEW.duration <= 0
BEGIN
    SELECT RAISE(ABORT, 'Practice duration must be positive');
END;

-- Rating validation triggers
CREATE TRIGGER validate_practice_rating
    BEFORE INSERT ON practice_ratings
    WHEN NEW.rating < 1 OR NEW.rating > 5
BEGIN
    SELECT RAISE(ABORT, 'Rating must be between 1 and 5');
END;

-- Log validation creation
INSERT INTO migration_log (id, phase, operation, status) 
VALUES ('validation_creation', 'VALIDATION', 'Create data validation triggers', 'completed');

-- ============================================================================
-- PHASE 8: FINALIZE MIGRATION
-- ============================================================================

-- Update migration completion log
UPDATE migration_log 
SET status = 'completed', completed_at = CURRENT_TIMESTAMP 
WHERE id = 'migration_start';

-- Insert final migration status
INSERT INTO migration_log (id, phase, operation, status, completed_at) 
VALUES ('migration_complete', 'FINALIZE', 'Migration completed successfully', 'completed', CURRENT_TIMESTAMP);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify content table structure
SELECT name, type FROM pragma_table_info('content') WHERE name IN ('contentUrl', 'status', 'featured', 'duration_int');

-- Verify practices table exists and has data
SELECT COUNT(*) as practice_count FROM practices;

-- Verify indexes exist
SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%';

-- Verify triggers exist
SELECT name FROM sqlite_master WHERE type='trigger' AND name LIKE 'validate_%';

-- ============================================================================
-- ROLLBACK PROCEDURES (if needed)
-- ============================================================================

-- To rollback this migration, run:
-- 1. DROP TABLE practices;
-- 2. DROP TABLE practice_series;
-- 3. DROP TABLE practice_series_items;
-- 4. DROP TABLE user_practice_progress;
-- 5. DROP TABLE practice_session_logs;
-- 6. DROP TABLE user_series_enrollments;
-- 7. DROP TABLE practice_ratings;
-- 8. DROP TABLE practice_recommendations;
-- 9. Restore content table from content_backup
-- 10. Remove added columns from users table

-- Complete rollback script available in rollback_migration.sql