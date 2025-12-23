-- Migration: Add analytics tracking tables

-- AI Provider Usage Metrics
CREATE TABLE IF NOT EXISTS "ai_usage_metrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider" TEXT NOT NULL,
    "model" TEXT,
    "userId" TEXT,
    "conversationId" TEXT,
    "promptTokens" INTEGER DEFAULT 0,
    "completionTokens" INTEGER DEFAULT 0,
    "totalTokens" INTEGER DEFAULT 0,
    "responseTime" INTEGER NOT NULL, -- in milliseconds
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE INDEX "ai_usage_metrics_provider_idx" ON "ai_usage_metrics"("provider");
CREATE INDEX "ai_usage_metrics_userId_idx" ON "ai_usage_metrics"("userId");
CREATE INDEX "ai_usage_metrics_requestedAt_idx" ON "ai_usage_metrics"("requestedAt");
CREATE INDEX "ai_usage_metrics_success_idx" ON "ai_usage_metrics"("success");

-- Crisis Detection Events
CREATE TABLE IF NOT EXISTS "crisis_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "conversationId" TEXT,
    "crisisLevel" TEXT NOT NULL, -- NONE, LOW, MODERATE, HIGH, CRITICAL
    "confidence" REAL NOT NULL,
    "indicators" TEXT NOT NULL, -- JSON array
    "actionTaken" TEXT NOT NULL, -- JSON: resources provided, notifications sent
    "detectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responseTime" INTEGER, -- Time to provide resources in ms
    "resolved" BOOLEAN DEFAULT false,
    "resolvedAt" DATETIME,
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX "crisis_events_userId_idx" ON "crisis_events"("userId");
CREATE INDEX "crisis_events_crisisLevel_idx" ON "crisis_events"("crisisLevel");
CREATE INDEX "crisis_events_detectedAt_idx" ON "crisis_events"("detectedAt");
CREATE INDEX "crisis_events_resolved_idx" ON "crisis_events"("resolved");

-- System Health Metrics
CREATE TABLE IF NOT EXISTS "system_health_metrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "metricType" TEXT NOT NULL, -- 'api_response', 'db_query', 'memory_usage', 'cpu_usage'
    "endpoint" TEXT, -- for API metrics
    "value" REAL NOT NULL,
    "unit" TEXT NOT NULL, -- 'ms', 'mb', 'percent'
    "tags" TEXT, -- JSON: additional metadata
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "system_health_metrics_metricType_idx" ON "system_health_metrics"("metricType");
CREATE INDEX "system_health_metrics_recordedAt_idx" ON "system_health_metrics"("recordedAt");

-- User Session Tracking
CREATE TABLE IF NOT EXISTS "user_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "duration" INTEGER, -- in seconds
    "pagesViewed" INTEGER DEFAULT 0,
    "actionsPerformed" INTEGER DEFAULT 0,
    "featuresUsed" TEXT, -- JSON array
    "deviceType" TEXT, -- 'mobile', 'tablet', 'desktop'
    "browserInfo" TEXT,
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX "user_sessions_userId_idx" ON "user_sessions"("userId");
CREATE INDEX "user_sessions_startedAt_idx" ON "user_sessions"("startedAt");

-- Wellness Impact Metrics
CREATE TABLE IF NOT EXISTS "wellness_snapshots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "wellnessScore" REAL NOT NULL,
    "assessmentScores" TEXT NOT NULL, -- JSON: detailed scores
    "moodAverage" TEXT, -- average mood over period
    "engagementLevel" TEXT, -- 'low', 'medium', 'high'
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX "wellness_snapshots_userId_idx" ON "wellness_snapshots"("userId");
CREATE INDEX "wellness_snapshots_recordedAt_idx" ON "wellness_snapshots"("recordedAt");
