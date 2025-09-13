-- Performance indexes for better query performance

-- User-related indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(googleId);
CREATE INDEX IF NOT EXISTS idx_users_onboarded_approach ON users(isOnboarded, approach);
CREATE INDEX IF NOT EXISTS idx_users_token_version ON users(tokenVersion);

-- Assessment indexes
CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON assessments(userId);
CREATE INDEX IF NOT EXISTS idx_assessments_user_type ON assessments(userId, assessmentType);
CREATE INDEX IF NOT EXISTS idx_assessments_user_completed ON assessments(userId, completedAt DESC);
CREATE INDEX IF NOT EXISTS idx_assessments_type_score ON assessments(assessmentType, score);

-- Chat message indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(userId);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_date ON chat_messages(userId, createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_type ON chat_messages(type);

-- Mood entry indexes
CREATE INDEX IF NOT EXISTS idx_mood_entries_user_id ON mood_entries(userId);
CREATE INDEX IF NOT EXISTS idx_mood_entries_user_date ON mood_entries(userId, createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_mood_entries_mood ON mood_entries(mood);

-- Progress tracking indexes
CREATE INDEX IF NOT EXISTS idx_progress_tracking_user_id ON progress_tracking(userId);
CREATE INDEX IF NOT EXISTS idx_progress_tracking_user_metric ON progress_tracking(userId, metric);
CREATE INDEX IF NOT EXISTS idx_progress_tracking_user_date ON progress_tracking(userId, date DESC);

-- User plan module indexes
CREATE INDEX IF NOT EXISTS idx_user_plan_modules_user_id ON user_plan_modules(userId);
CREATE INDEX IF NOT EXISTS idx_user_plan_modules_module_id ON user_plan_modules(moduleId);
CREATE INDEX IF NOT EXISTS idx_user_plan_modules_completed ON user_plan_modules(completed);
CREATE INDEX IF NOT EXISTS idx_user_plan_modules_user_progress ON user_plan_modules(userId, progress);

-- Plan module indexes
CREATE INDEX IF NOT EXISTS idx_plan_modules_type ON plan_modules(type);
CREATE INDEX IF NOT EXISTS idx_plan_modules_approach ON plan_modules(approach);
CREATE INDEX IF NOT EXISTS idx_plan_modules_difficulty ON plan_modules(difficulty);
CREATE INDEX IF NOT EXISTS idx_plan_modules_order ON plan_modules("order");

-- Content indexes
CREATE INDEX IF NOT EXISTS idx_content_type ON content(type);
CREATE INDEX IF NOT EXISTS idx_content_category ON content(category);
CREATE INDEX IF NOT EXISTS idx_content_approach ON content(approach);
CREATE INDEX IF NOT EXISTS idx_content_published ON content(isPublished);
CREATE INDEX IF NOT EXISTS idx_content_category_approach ON content(category, approach);

-- Refresh token indexes
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(userId);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_revoked ON refresh_tokens(expiresAt, isRevoked);

-- Token blacklist indexes
CREATE INDEX IF NOT EXISTS idx_token_blacklist_token ON token_blacklist(token);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires ON token_blacklist(expiresAt);

-- User activity indexes
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(userId);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_timestamp ON user_activities(userId, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_action ON user_activities(action);
CREATE INDEX IF NOT EXISTS idx_user_activities_timestamp ON user_activities(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_ip_address ON user_activities(ipAddress);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_assessments_recent_by_user ON assessments(userId, completedAt DESC, assessmentType);
CREATE INDEX IF NOT EXISTS idx_chat_messages_recent_by_user ON chat_messages(userId, createdAt DESC, type);
CREATE INDEX IF NOT EXISTS idx_user_activities_security_events ON user_activities(userId, action, timestamp DESC) 
  WHERE action IN ('login', 'logout', 'password_change', 'token_refresh', 'failed_login');
