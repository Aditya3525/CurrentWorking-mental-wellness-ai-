-- CreateTable
CREATE TABLE "ai_usage_metrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider" TEXT NOT NULL,
    "model" TEXT,
    "userId" TEXT,
    "conversationId" TEXT,
    "promptTokens" INTEGER NOT NULL DEFAULT 0,
    "completionTokens" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "responseTime" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME
);

-- CreateTable
CREATE TABLE "crisis_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "conversationId" TEXT,
    "crisisLevel" TEXT NOT NULL,
    "confidence" REAL NOT NULL,
    "indicators" TEXT NOT NULL,
    "actionTaken" TEXT NOT NULL,
    "detectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responseTime" INTEGER,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" DATETIME,
    CONSTRAINT "crisis_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "system_health_metrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "metricType" TEXT NOT NULL,
    "endpoint" TEXT,
    "value" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "tags" TEXT,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "duration" INTEGER,
    "pagesViewed" INTEGER NOT NULL DEFAULT 0,
    "actionsPerformed" INTEGER NOT NULL DEFAULT 0,
    "featuresUsed" TEXT,
    "deviceType" TEXT,
    "browserInfo" TEXT,
    CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "wellness_snapshots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "wellnessScore" REAL NOT NULL,
    "assessmentScores" TEXT NOT NULL,
    "moodAverage" TEXT,
    "engagementLevel" TEXT,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL,
    CONSTRAINT "wellness_snapshots_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ai_usage_metrics_provider_idx" ON "ai_usage_metrics"("provider");

-- CreateIndex
CREATE INDEX "ai_usage_metrics_userId_idx" ON "ai_usage_metrics"("userId");

-- CreateIndex
CREATE INDEX "ai_usage_metrics_requestedAt_idx" ON "ai_usage_metrics"("requestedAt");

-- CreateIndex
CREATE INDEX "ai_usage_metrics_success_idx" ON "ai_usage_metrics"("success");

-- CreateIndex
CREATE INDEX "crisis_events_userId_idx" ON "crisis_events"("userId");

-- CreateIndex
CREATE INDEX "crisis_events_crisisLevel_idx" ON "crisis_events"("crisisLevel");

-- CreateIndex
CREATE INDEX "crisis_events_detectedAt_idx" ON "crisis_events"("detectedAt");

-- CreateIndex
CREATE INDEX "crisis_events_resolved_idx" ON "crisis_events"("resolved");

-- CreateIndex
CREATE INDEX "system_health_metrics_metricType_idx" ON "system_health_metrics"("metricType");

-- CreateIndex
CREATE INDEX "system_health_metrics_recordedAt_idx" ON "system_health_metrics"("recordedAt");

-- CreateIndex
CREATE INDEX "user_sessions_userId_idx" ON "user_sessions"("userId");

-- CreateIndex
CREATE INDEX "user_sessions_startedAt_idx" ON "user_sessions"("startedAt");

-- CreateIndex
CREATE INDEX "wellness_snapshots_userId_idx" ON "wellness_snapshots"("userId");

-- CreateIndex
CREATE INDEX "wellness_snapshots_recordedAt_idx" ON "wellness_snapshots"("recordedAt");
