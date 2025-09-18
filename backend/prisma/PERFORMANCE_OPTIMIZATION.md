# Database Performance Optimization & Validation Rules
## Mental Wellbeing AI App - Enhanced Schema

## Overview
This document outlines the performance optimization strategies, indexing decisions, and data validation rules for the enhanced database schema.

## ============================================================================
## INDEX STRATEGY & PERFORMANCE OPTIMIZATION
## ============================================================================

### Primary Performance Indexes

#### Content Model Indexes
```sql
-- Core content discovery and filtering
CREATE INDEX idx_content_category_subcategory ON content(category, subcategory);
CREATE INDEX idx_content_approach ON content(approach);
CREATE INDEX idx_content_status_published ON content(status, isPublished);
CREATE INDEX idx_content_difficulty_severity ON content(difficulty, severityLevel);

-- Admin management and analytics
CREATE INDEX idx_content_created_by ON content(createdBy);
CREATE INDEX idx_content_created_at ON content(createdAt);
CREATE INDEX idx_content_featured ON content(featured);
CREATE INDEX idx_content_view_count ON content(viewCount);

-- Search and discovery
CREATE INDEX idx_content_tags ON content(tags); -- For JSON array searches
CREATE INDEX idx_content_title_search ON content(title); -- Full-text search support
CREATE INDEX idx_content_duration ON content(duration);

-- Performance metrics
CREATE INDEX idx_content_rating ON content(rating);
CREATE INDEX idx_content_published_at ON content(publishedAt);
```

#### Practice Model Indexes
```sql
-- Practice discovery and filtering
CREATE INDEX idx_practices_type_category ON practices(practiceType, category);
CREATE INDEX idx_practices_difficulty_approach ON practices(difficulty, approach);
CREATE INDEX idx_practices_duration_difficulty ON practices(duration, difficulty);
CREATE INDEX idx_practices_severity_category ON practices(severityLevel, category);

-- Admin management
CREATE INDEX idx_practices_status_published ON practices(status, isPublished);
CREATE INDEX idx_practices_created_by ON practices(createdBy);
CREATE INDEX idx_practices_featured ON practices(featured);

-- Performance and analytics
CREATE INDEX idx_practices_view_count ON practices(viewCount);
CREATE INDEX idx_practices_rating ON practices(rating);
CREATE INDEX idx_practices_completion_rate ON practices(completionRate);

-- Search optimization
CREATE INDEX idx_practices_tags ON practices(tags);
CREATE INDEX idx_practices_title_search ON practices(title);
```

#### User Practice Progress Indexes
```sql
-- User activity tracking
CREATE INDEX idx_user_practice_progress_user ON userPracticeProgress(userId);
CREATE INDEX idx_user_practice_progress_practice ON userPracticeProgress(practiceId);
CREATE INDEX idx_user_practice_progress_user_practice ON userPracticeProgress(userId, practiceId);

-- Progress analytics
CREATE INDEX idx_user_practice_progress_streak ON userPracticeProgress(currentStreak);
CREATE INDEX idx_user_practice_progress_last_practice ON userPracticeProgress(lastPracticeDate);
CREATE INDEX idx_user_practice_progress_total_minutes ON userPracticeProgress(totalMinutes);
CREATE INDEX idx_user_practice_progress_favorite ON userPracticeProgress(isFavorite);
```

#### Practice Session Logs Indexes
```sql
-- Session analytics and tracking
CREATE INDEX idx_practice_sessions_user_practice ON practiceSessionLogs(userId, practiceId);
CREATE INDEX idx_practice_sessions_start_time ON practiceSessionLogs(startTime);
CREATE INDEX idx_practice_sessions_date_range ON practiceSessionLogs(startTime, endTime);
CREATE INDEX idx_practice_sessions_completed ON practiceSessionLogs(completed);
CREATE INDEX idx_practice_sessions_quality ON practiceSessionLogs(quality);

-- Mood tracking analysis
CREATE INDEX idx_practice_sessions_mood_before ON practiceSessionLogs(moodBefore);
CREATE INDEX idx_practice_sessions_mood_after ON practiceSessionLogs(moodAfter);
```

#### User Model Admin Indexes
```sql
-- Admin user management
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_admin ON users(isAdmin);
CREATE INDEX idx_users_is_active ON users(isActive);
CREATE INDEX idx_users_last_login ON users(lastLoginAt);

-- User analytics
CREATE INDEX idx_users_approach ON users(approach);
CREATE INDEX idx_users_onboarded ON users(isOnboarded);
CREATE INDEX idx_users_created_at ON users(createdAt);
```

#### Recommendations and Ratings Indexes
```sql
-- Practice recommendations
CREATE INDEX idx_practice_recommendations_user_priority ON practiceRecommendations(userId, priority);
CREATE INDEX idx_practice_recommendations_recommended_at ON practiceRecommendations(recommendedAt);
CREATE INDEX idx_practice_recommendations_expires_at ON practiceRecommendations(expiresAt);
CREATE INDEX idx_practice_recommendations_viewed ON practiceRecommendations(viewed);

-- Content and practice ratings
CREATE INDEX idx_content_ratings_content ON contentRatings(contentId);
CREATE INDEX idx_content_ratings_user ON contentRatings(userId);
CREATE INDEX idx_practice_ratings_practice ON practiceRatings(practiceId);
CREATE INDEX idx_practice_ratings_user ON practiceRatings(userId);
CREATE INDEX idx_practice_ratings_rating ON practiceRatings(rating);
```

### Query Optimization Strategies

#### Common Query Patterns and Optimizations

**1. Content Discovery Queries**
```sql
-- Optimized content search with multiple filters
SELECT * FROM content 
WHERE category = ? 
  AND approach IN (?, 'all') 
  AND status = 'Published' 
  AND difficulty = ?
ORDER BY featured DESC, viewCount DESC, rating DESC
LIMIT 20;

-- Uses: idx_content_category_subcategory, idx_content_approach, idx_content_status_published
```

**2. Practice Recommendation Queries**
```sql
-- Optimized practice recommendations for user
SELECT p.*, pr.relevanceScore, pr.reason
FROM practices p
JOIN practiceRecommendations pr ON p.id = pr.practiceId
WHERE pr.userId = ? 
  AND pr.viewed = false 
  AND pr.expiresAt > CURRENT_TIMESTAMP
ORDER BY pr.priority, pr.relevanceScore DESC
LIMIT 10;

-- Uses: idx_practice_recommendations_user_priority, idx_practice_recommendations_expires_at
```

**3. User Progress Analytics**
```sql
-- Optimized user progress summary
SELECT 
    p.category,
    COUNT(*) as practicesAttempted,
    SUM(upp.totalMinutes) as totalPracticeTime,
    AVG(upp.averageRating) as avgRating,
    MAX(upp.currentStreak) as bestStreak
FROM userPracticeProgress upp
JOIN practices p ON upp.practiceId = p.id
WHERE upp.userId = ?
GROUP BY p.category
ORDER BY totalPracticeTime DESC;

-- Uses: idx_user_practice_progress_user, idx_practices_type_category
```

**4. Admin Dashboard Analytics**
```sql
-- Optimized admin dashboard metrics
SELECT 
    DATE(c.createdAt) as date,
    COUNT(*) as contentCreated,
    SUM(CASE WHEN c.status = 'Published' THEN 1 ELSE 0 END) as published,
    AVG(c.viewCount) as avgViews
FROM content c
WHERE c.createdAt >= DATE('now', '-30 days')
GROUP BY DATE(c.createdAt)
ORDER BY date DESC;

-- Uses: idx_content_created_at, idx_content_status_published
```

### Performance Monitoring Queries

```sql
-- Monitor query performance
EXPLAIN QUERY PLAN 
SELECT * FROM content 
WHERE category = 'Mindfulness' 
  AND status = 'Published' 
ORDER BY viewCount DESC;

-- Check index usage
SELECT name, sql FROM sqlite_master 
WHERE type = 'index' 
  AND name LIKE 'idx_%'
ORDER BY name;

-- Analyze table statistics
ANALYZE;
SELECT * FROM sqlite_stat1;
```

## ============================================================================
## DATA VALIDATION RULES
## ============================================================================

### Validation Triggers

#### Content Validation
```sql
-- Validate content status
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

-- Validate content type
CREATE TRIGGER validate_content_type
    BEFORE INSERT ON content
    WHEN NEW.type NOT IN ('video', 'audio', 'article', 'playlist', 'interactive')
BEGIN
    SELECT RAISE(ABORT, 'Invalid content type. Must be: video, audio, article, playlist, or interactive');
END;

-- Validate content difficulty
CREATE TRIGGER validate_content_difficulty
    BEFORE INSERT ON content
    WHEN NEW.difficulty IS NOT NULL AND NEW.difficulty NOT IN ('Beginner', 'Intermediate', 'Advanced')
BEGIN
    SELECT RAISE(ABORT, 'Invalid content difficulty. Must be: Beginner, Intermediate, or Advanced');
END;

-- Validate content approach
CREATE TRIGGER validate_content_approach
    BEFORE INSERT ON content
    WHEN NEW.approach NOT IN ('Western', 'Eastern', 'Hybrid', 'All')
BEGIN
    SELECT RAISE(ABORT, 'Invalid content approach. Must be: Western, Eastern, Hybrid, or All');
END;

-- Validate severity level
CREATE TRIGGER validate_content_severity
    BEFORE INSERT ON content
    WHEN NEW.severityLevel NOT IN ('Mild', 'Moderate', 'Severe')
BEGIN
    SELECT RAISE(ABORT, 'Invalid severity level. Must be: Mild, Moderate, or Severe');
END;

-- Validate duration is positive
CREATE TRIGGER validate_content_duration
    BEFORE INSERT ON content
    WHEN NEW.duration IS NOT NULL AND NEW.duration <= 0
BEGIN
    SELECT RAISE(ABORT, 'Content duration must be positive');
END;

-- Validate rating range
CREATE TRIGGER validate_content_rating
    BEFORE INSERT ON content
    WHEN NEW.rating IS NOT NULL AND (NEW.rating < 0 OR NEW.rating > 5)
BEGIN
    SELECT RAISE(ABORT, 'Content rating must be between 0 and 5');
END;
```

#### Practice Validation
```sql
-- Validate practice type
CREATE TRIGGER validate_practice_type
    BEFORE INSERT ON practices
    WHEN NEW.practiceType NOT IN ('Meditation', 'Breathing', 'Yoga', 'Mindfulness', 'Visualization', 'Movement', 'Sleep')
BEGIN
    SELECT RAISE(ABORT, 'Invalid practice type. Must be: Meditation, Breathing, Yoga, Mindfulness, Visualization, Movement, or Sleep');
END;

-- Validate practice difficulty
CREATE TRIGGER validate_practice_difficulty
    BEFORE INSERT ON practices
    WHEN NEW.difficulty NOT IN ('Beginner', 'Intermediate', 'Advanced')
BEGIN
    SELECT RAISE(ABORT, 'Invalid practice difficulty. Must be: Beginner, Intermediate, or Advanced');
END;

-- Validate practice status
CREATE TRIGGER validate_practice_status
    BEFORE INSERT ON practices
    WHEN NEW.status NOT IN ('Draft', 'Published', 'Archived', 'Under Review')
BEGIN
    SELECT RAISE(ABORT, 'Invalid practice status. Must be: Draft, Published, Archived, or Under Review');
END;

-- Validate practice approach
CREATE TRIGGER validate_practice_approach
    BEFORE INSERT ON practices
    WHEN NEW.approach NOT IN ('Western', 'Eastern', 'Hybrid', 'All')
BEGIN
    SELECT RAISE(ABORT, 'Invalid practice approach. Must be: Western, Eastern, Hybrid, or All');
END;

-- Validate practice duration (must be positive)
CREATE TRIGGER validate_practice_duration
    BEFORE INSERT ON practices
    WHEN NEW.duration <= 0
BEGIN
    SELECT RAISE(ABORT, 'Practice duration must be positive');
END;

-- Validate preparation and wind-down times (must be non-negative)
CREATE TRIGGER validate_practice_times
    BEFORE INSERT ON practices
    WHEN (NEW.preparationTime IS NOT NULL AND NEW.preparationTime < 0) 
      OR (NEW.windDownTime IS NOT NULL AND NEW.windDownTime < 0)
BEGIN
    SELECT RAISE(ABORT, 'Preparation and wind-down times must be non-negative');
END;

-- Validate practice rating range
CREATE TRIGGER validate_practice_rating_range
    BEFORE INSERT ON practices
    WHEN NEW.rating IS NOT NULL AND (NEW.rating < 0 OR NEW.rating > 5)
BEGIN
    SELECT RAISE(ABORT, 'Practice rating must be between 0 and 5');
END;

-- Validate completion rate
CREATE TRIGGER validate_practice_completion_rate
    BEFORE INSERT ON practices
    WHEN NEW.completionRate IS NOT NULL AND (NEW.completionRate < 0 OR NEW.completionRate > 1)
BEGIN
    SELECT RAISE(ABORT, 'Practice completion rate must be between 0 and 1');
END;
```

#### User Rating Validation
```sql
-- Validate content ratings
CREATE TRIGGER validate_content_rating_value
    BEFORE INSERT ON contentRatings
    WHEN NEW.rating < 1 OR NEW.rating > 5
BEGIN
    SELECT RAISE(ABORT, 'Content rating must be between 1 and 5');
END;

-- Validate practice ratings
CREATE TRIGGER validate_practice_rating_value
    BEFORE INSERT ON practiceRatings
    WHEN NEW.rating < 1 OR NEW.rating > 5
BEGIN
    SELECT RAISE(ABORT, 'Practice rating must be between 1 and 5');
END;

-- Validate practice rating sub-scores
CREATE TRIGGER validate_practice_rating_subscores
    BEFORE INSERT ON practiceRatings
    WHEN (NEW.difficultyRating IS NOT NULL AND (NEW.difficultyRating < 1 OR NEW.difficultyRating > 5))
      OR (NEW.clarityRating IS NOT NULL AND (NEW.clarityRating < 1 OR NEW.clarityRating > 5))
BEGIN
    SELECT RAISE(ABORT, 'Difficulty and clarity ratings must be between 1 and 5');
END;
```

#### User Progress Validation
```sql
-- Validate user practice progress values
CREATE TRIGGER validate_user_practice_progress
    BEFORE INSERT ON userPracticeProgress
    WHEN NEW.totalSessions < 0 
      OR NEW.completedSessions < 0 
      OR NEW.totalMinutes < 0
      OR NEW.currentStreak < 0
      OR NEW.longestStreak < 0
      OR NEW.completedSessions > NEW.totalSessions
BEGIN
    SELECT RAISE(ABORT, 'User practice progress values must be non-negative and logical');
END;

-- Validate average rating
CREATE TRIGGER validate_user_average_rating
    BEFORE INSERT ON userPracticeProgress
    WHEN NEW.averageRating IS NOT NULL AND (NEW.averageRating < 1 OR NEW.averageRating > 5)
BEGIN
    SELECT RAISE(ABORT, 'Average rating must be between 1 and 5');
END;
```

#### Session Log Validation
```sql
-- Validate session duration and timing
CREATE TRIGGER validate_session_timing
    BEFORE INSERT ON practiceSessionLogs
    WHEN (NEW.endTime IS NOT NULL AND NEW.endTime < NEW.startTime)
      OR (NEW.duration IS NOT NULL AND NEW.duration < 0)
BEGIN
    SELECT RAISE(ABORT, 'Session timing must be logical: end time after start time, positive duration');
END;

-- Validate session quality rating
CREATE TRIGGER validate_session_quality
    BEFORE INSERT ON practiceSessionLogs
    WHEN NEW.quality IS NOT NULL AND (NEW.quality < 1 OR NEW.quality > 5)
BEGIN
    SELECT RAISE(ABORT, 'Session quality rating must be between 1 and 5');
END;
```

### Application-Level Validation Rules

#### Content Validation (TypeScript/JavaScript)
```typescript
// Content validation schema
const contentValidation = {
  title: {
    required: true,
    minLength: 3,
    maxLength: 200,
    pattern: /^[a-zA-Z0-9\s\-\:\'\"\.]+$/
  },
  type: {
    required: true,
    enum: ['video', 'audio', 'article', 'playlist', 'interactive']
  },
  category: {
    required: true,
    enum: ['Mindfulness', 'Anxiety', 'Stress Management', 'Relaxation', 'Emotional Intelligence', 'Sleep', 'Series']
  },
  approach: {
    required: true,
    enum: ['Western', 'Eastern', 'Hybrid', 'All']
  },
  difficulty: {
    enum: ['Beginner', 'Intermediate', 'Advanced']
  },
  severityLevel: {
    required: true,
    enum: ['Mild', 'Moderate', 'Severe']
  },
  duration: {
    type: 'integer',
    minimum: 1,
    maximum: 480 // 8 hours max
  },
  tags: {
    type: 'array',
    items: { type: 'string', minLength: 2, maxLength: 30 },
    maxItems: 20
  },
  contentUrl: {
    type: 'string',
    format: 'uri'
  },
  rating: {
    type: 'number',
    minimum: 0,
    maximum: 5
  }
};
```

#### Practice Validation (TypeScript/JavaScript)
```typescript
// Practice validation schema
const practiceValidation = {
  title: {
    required: true,
    minLength: 3,
    maxLength: 200
  },
  instructions: {
    required: true,
    minLength: 20,
    maxLength: 5000
  },
  duration: {
    required: true,
    type: 'integer',
    minimum: 1,
    maximum: 180 // 3 hours max
  },
  preparationTime: {
    type: 'integer',
    minimum: 0,
    maximum: 60
  },
  windDownTime: {
    type: 'integer',
    minimum: 0,
    maximum: 60
  },
  practiceType: {
    required: true,
    enum: ['Meditation', 'Breathing', 'Yoga', 'Mindfulness', 'Visualization', 'Movement', 'Sleep']
  },
  difficulty: {
    required: true,
    enum: ['Beginner', 'Intermediate', 'Advanced']
  },
  approach: {
    required: true,
    enum: ['Western', 'Eastern', 'Hybrid', 'All']
  },
  tags: {
    type: 'array',
    items: { type: 'string', minLength: 2, maxLength: 30 },
    maxItems: 15
  },
  audioGuideUrl: {
    type: 'string',
    format: 'uri'
  },
  benefits: {
    type: 'array',
    items: { type: 'string', maxLength: 100 },
    maxItems: 10
  }
};
```

### Data Integrity Checks

#### Scheduled Integrity Validation
```sql
-- Check for orphaned records
SELECT 'Orphaned content recommendations' as issue, COUNT(*) as count
FROM contentRecommendations cr
LEFT JOIN content c ON cr.contentId = c.id
WHERE c.id IS NULL;

SELECT 'Orphaned practice progress' as issue, COUNT(*) as count
FROM userPracticeProgress upp
LEFT JOIN practices p ON upp.practiceId = p.id
WHERE p.id IS NULL;

-- Check for data consistency issues
SELECT 'Inconsistent completion rates' as issue, COUNT(*) as count
FROM userPracticeProgress
WHERE completedSessions > totalSessions;

SELECT 'Invalid rating counts' as issue, COUNT(*) as count
FROM content
WHERE rating IS NOT NULL AND ratingCount = 0;

-- Check for missing required admin references
SELECT 'Content without creator' as issue, COUNT(*) as count
FROM content
WHERE createdBy IS NULL OR createdBy = '';

SELECT 'Practices without creator' as issue, COUNT(*) as count
FROM practices
WHERE createdBy IS NULL OR createdBy = '';
```

## ============================================================================
## PERFORMANCE MONITORING & MAINTENANCE
## ============================================================================

### Performance Monitoring Queries

```sql
-- Monitor slow queries (requires query log analysis)
-- Check index effectiveness
EXPLAIN QUERY PLAN SELECT * FROM content WHERE category = 'Mindfulness' AND approach = 'Eastern';

-- Monitor table sizes
SELECT 
    name,
    COUNT(*) as row_count,
    AVG(LENGTH(content)) as avg_content_size
FROM (
    SELECT 'content' as name, content FROM content
    UNION ALL
    SELECT 'practices' as name, instructions FROM practices
    UNION ALL
    SELECT 'practice_session_logs' as name, sessionNotes FROM practiceSessionLogs
) 
GROUP BY name;

-- Monitor database size
SELECT 
    SUM(pgsize) as total_size_bytes,
    SUM(pgsize) / 1024 / 1024 as total_size_mb
FROM dbstat;
```

### Maintenance Tasks

#### Weekly Maintenance
```sql
-- Update table statistics
ANALYZE;

-- Cleanup expired recommendations
DELETE FROM practiceRecommendations 
WHERE expiresAt < datetime('now', '-7 days');

-- Archive old session logs (keep 1 year)
CREATE TABLE IF NOT EXISTS practiceSessionLogsArchive AS 
SELECT * FROM practiceSessionLogs WHERE 1=0;

INSERT INTO practiceSessionLogsArchive 
SELECT * FROM practiceSessionLogs 
WHERE startTime < datetime('now', '-1 year');

DELETE FROM practiceSessionLogs 
WHERE startTime < datetime('now', '-1 year');
```

#### Monthly Maintenance
```sql
-- Vacuum database to reclaim space
VACUUM;

-- Update content/practice statistics
UPDATE content SET rating = (
    SELECT AVG(rating) FROM contentRatings WHERE contentId = content.id
), ratingCount = (
    SELECT COUNT(*) FROM contentRatings WHERE contentId = content.id
) WHERE id IN (
    SELECT contentId FROM contentRatings
);

UPDATE practices SET rating = (
    SELECT AVG(rating) FROM practiceRatings WHERE practiceId = practices.id
), ratingCount = (
    SELECT COUNT(*) FROM practiceRatings WHERE practiceId = practices.id
) WHERE id IN (
    SELECT practiceId FROM practiceRatings
);
```

### Performance Optimization Checklist

- [ ] All frequently queried columns have appropriate indexes
- [ ] Composite indexes cover common filter combinations
- [ ] Foreign key relationships are properly indexed
- [ ] Query plans are reviewed and optimized
- [ ] Database statistics are kept current with ANALYZE
- [ ] Old data is archived regularly
- [ ] VACUUM is run periodically to reclaim space
- [ ] Connection pooling is implemented in application
- [ ] Query timeout limits are configured
- [ ] Slow query logging is enabled and monitored

This comprehensive performance and validation strategy ensures the enhanced database schema operates efficiently while maintaining data integrity and consistency.