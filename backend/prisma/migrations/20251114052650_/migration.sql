-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT,
    "googleId" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "profilePhoto" TEXT,
    "isOnboarded" BOOLEAN NOT NULL DEFAULT false,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "approach" TEXT,
    "birthday" DATETIME,
    "gender" TEXT,
    "region" TEXT,
    "language" TEXT,
    "emergencyContact" TEXT,
    "emergencyPhone" TEXT,
    "dataConsent" BOOLEAN NOT NULL DEFAULT false,
    "clinicianSharing" BOOLEAN NOT NULL DEFAULT false,
    "securityQuestion" TEXT,
    "securityAnswerHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "assessment_results" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "assessmentType" TEXT NOT NULL,
    "score" REAL NOT NULL,
    "responses" TEXT NOT NULL,
    "rawScore" REAL,
    "maxScore" REAL,
    "normalizedScore" REAL,
    "categoryScores" JSONB,
    "sessionId" TEXT,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "assessment_results_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "assessment_results_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "assessment_sessions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "assessment_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "selectedTypes" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "assessment_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "assessment_insights" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "summary" JSONB NOT NULL,
    "overallTrend" TEXT NOT NULL,
    "aiSummary" TEXT NOT NULL,
    "wellness_score" REAL NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "assessment_insights_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "mood_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "mood" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "mood_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "plan_modules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "approach" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "user_plan_modules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "progress" REAL NOT NULL DEFAULT 0,
    "scheduledFor" DATETIME,
    "completedAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_plan_modules_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_plan_modules_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "plan_modules" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastMessageAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "metadata" TEXT,
    CONSTRAINT "conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chat_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "chat_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "conversation_goals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "goalType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetValue" INTEGER,
    "currentValue" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'active',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "milestones" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    CONSTRAINT "conversation_goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "conversation_memory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "topics" TEXT NOT NULL DEFAULT '{}',
    "emotionalPatterns" TEXT NOT NULL DEFAULT '{}',
    "importantMoments" TEXT NOT NULL DEFAULT '[]',
    "conversationMetrics" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "conversation_memory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "progress_tracking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    CONSTRAINT "progress_tracking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "assessments" (
    "assessment_id" TEXT NOT NULL PRIMARY KEY,
    "assessment_name" TEXT NOT NULL,
    "assessment_type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "time_estimate" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_basic_overall_only" BOOLEAN NOT NULL DEFAULT false,
    "visible_in_main_list" BOOLEAN NOT NULL DEFAULT true,
    "tags" TEXT,
    "scoring_config" TEXT,
    "created_by" TEXT,
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME
);

-- CreateTable
CREATE TABLE "questions" (
    "question_id" TEXT NOT NULL PRIMARY KEY,
    "assessment_id" TEXT NOT NULL,
    "question_text" TEXT NOT NULL,
    "question_order" INTEGER NOT NULL,
    "response_type" TEXT NOT NULL,
    "domain" TEXT,
    "reverse_scored" BOOLEAN NOT NULL DEFAULT false,
    "metadata" TEXT,
    CONSTRAINT "questions_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments" ("assessment_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "response_options" (
    "option_id" TEXT NOT NULL PRIMARY KEY,
    "question_id" TEXT NOT NULL,
    "option_value" REAL,
    "option_text" TEXT NOT NULL,
    "option_order" INTEGER NOT NULL,
    CONSTRAINT "response_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions" ("question_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "content" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "contentType" TEXT,
    "category" TEXT NOT NULL,
    "approach" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "description" TEXT,
    "youtubeUrl" TEXT,
    "thumbnailUrl" TEXT,
    "duration" INTEGER,
    "difficulty" TEXT,
    "intensityLevel" TEXT,
    "tags" TEXT NOT NULL,
    "focusAreas" TEXT,
    "immediateRelief" BOOLEAN NOT NULL DEFAULT false,
    "crisisEligible" BOOLEAN NOT NULL DEFAULT false,
    "timeOfDay" TEXT,
    "environment" TEXT,
    "culturalContext" TEXT,
    "hasSubtitles" BOOLEAN NOT NULL DEFAULT false,
    "transcript" TEXT,
    "completions" INTEGER NOT NULL DEFAULT 0,
    "averageRating" REAL,
    "effectiveness" REAL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "sourceUrl" TEXT,
    "sourceName" TEXT,
    "confidence" REAL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "practices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "duration" INTEGER NOT NULL,
    "difficulty" TEXT NOT NULL,
    "intensityLevel" TEXT,
    "approach" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "description" TEXT,
    "audioUrl" TEXT,
    "videoUrl" TEXT,
    "youtubeUrl" TEXT,
    "thumbnailUrl" TEXT,
    "tags" TEXT,
    "instructions" TEXT,
    "benefits" TEXT,
    "precautions" TEXT,
    "focusAreas" TEXT,
    "immediateRelief" BOOLEAN NOT NULL DEFAULT false,
    "crisisEligible" BOOLEAN NOT NULL DEFAULT false,
    "requiredEquipment" TEXT,
    "environment" TEXT,
    "timeOfDay" TEXT,
    "sensoryEngagement" TEXT,
    "steps" TEXT,
    "contraindications" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "sourceUrl" TEXT,
    "sourceName" TEXT,
    "confidence" REAL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "content_engagements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "rating" INTEGER,
    "timeSpent" INTEGER,
    "moodBefore" TEXT,
    "moodAfter" TEXT,
    "effectiveness" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "content_engagements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "content_engagements_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "content" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "chatbot_conversations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "messages" TEXT NOT NULL DEFAULT '[]',
    "summary" TEXT,
    "summaryGeneratedAt" DATETIME,
    "emotionalState" TEXT,
    "keyTopics" TEXT NOT NULL DEFAULT '[]',
    "urgencyLevel" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "chatbot_conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "dashboard_insights" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "insightsData" TEXT NOT NULL,
    "aiSummary" TEXT NOT NULL,
    "assessmentCount" INTEGER NOT NULL DEFAULT 0,
    "chatCount" INTEGER NOT NULL DEFAULT 0,
    "lastAssessmentDate" DATETIME,
    "lastChatDate" DATETIME,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "dashboard_insights_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adminEmail" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "entityName" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_googleId_idx" ON "users"("googleId");

-- CreateIndex
CREATE INDEX "users_isOnboarded_idx" ON "users"("isOnboarded");

-- CreateIndex
CREATE INDEX "users_approach_idx" ON "users"("approach");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- CreateIndex
CREATE INDEX "assessment_results_userId_idx" ON "assessment_results"("userId");

-- CreateIndex
CREATE INDEX "assessment_results_assessmentType_idx" ON "assessment_results"("assessmentType");

-- CreateIndex
CREATE INDEX "assessment_results_userId_assessmentType_idx" ON "assessment_results"("userId", "assessmentType");

-- CreateIndex
CREATE INDEX "assessment_results_userId_completedAt_idx" ON "assessment_results"("userId", "completedAt");

-- CreateIndex
CREATE INDEX "assessment_results_sessionId_idx" ON "assessment_results"("sessionId");

-- CreateIndex
CREATE INDEX "assessment_results_completedAt_idx" ON "assessment_results"("completedAt");

-- CreateIndex
CREATE INDEX "assessment_sessions_userId_idx" ON "assessment_sessions"("userId");

-- CreateIndex
CREATE INDEX "assessment_sessions_status_idx" ON "assessment_sessions"("status");

-- CreateIndex
CREATE INDEX "assessment_sessions_userId_status_idx" ON "assessment_sessions"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_insights_userId_key" ON "assessment_insights"("userId");

-- CreateIndex
CREATE INDEX "mood_entries_userId_idx" ON "mood_entries"("userId");

-- CreateIndex
CREATE INDEX "mood_entries_createdAt_idx" ON "mood_entries"("createdAt");

-- CreateIndex
CREATE INDEX "mood_entries_userId_createdAt_idx" ON "mood_entries"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "mood_entries_mood_idx" ON "mood_entries"("mood");

-- CreateIndex
CREATE INDEX "plan_modules_approach_idx" ON "plan_modules"("approach");

-- CreateIndex
CREATE INDEX "plan_modules_type_idx" ON "plan_modules"("type");

-- CreateIndex
CREATE INDEX "plan_modules_difficulty_idx" ON "plan_modules"("difficulty");

-- CreateIndex
CREATE INDEX "plan_modules_order_idx" ON "plan_modules"("order");

-- CreateIndex
CREATE INDEX "user_plan_modules_userId_idx" ON "user_plan_modules"("userId");

-- CreateIndex
CREATE INDEX "user_plan_modules_moduleId_idx" ON "user_plan_modules"("moduleId");

-- CreateIndex
CREATE INDEX "user_plan_modules_userId_completed_idx" ON "user_plan_modules"("userId", "completed");

-- CreateIndex
CREATE INDEX "user_plan_modules_scheduledFor_idx" ON "user_plan_modules"("scheduledFor");

-- CreateIndex
CREATE INDEX "user_plan_modules_completed_idx" ON "user_plan_modules"("completed");

-- CreateIndex
CREATE UNIQUE INDEX "user_plan_modules_userId_moduleId_key" ON "user_plan_modules"("userId", "moduleId");

-- CreateIndex
CREATE INDEX "conversations_userId_lastMessageAt_idx" ON "conversations"("userId", "lastMessageAt");

-- CreateIndex
CREATE INDEX "conversations_userId_isArchived_idx" ON "conversations"("userId", "isArchived");

-- CreateIndex
CREATE INDEX "conversations_lastMessageAt_idx" ON "conversations"("lastMessageAt");

-- CreateIndex
CREATE INDEX "chat_messages_conversationId_createdAt_idx" ON "chat_messages"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "chat_messages_userId_createdAt_idx" ON "chat_messages"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "chat_messages_userId_idx" ON "chat_messages"("userId");

-- CreateIndex
CREATE INDEX "chat_messages_type_idx" ON "chat_messages"("type");

-- CreateIndex
CREATE INDEX "chat_messages_createdAt_idx" ON "chat_messages"("createdAt");

-- CreateIndex
CREATE INDEX "conversation_goals_userId_idx" ON "conversation_goals"("userId");

-- CreateIndex
CREATE INDEX "conversation_goals_status_idx" ON "conversation_goals"("status");

-- CreateIndex
CREATE INDEX "conversation_goals_goalType_idx" ON "conversation_goals"("goalType");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_memory_userId_key" ON "conversation_memory"("userId");

-- CreateIndex
CREATE INDEX "conversation_memory_userId_idx" ON "conversation_memory"("userId");

-- CreateIndex
CREATE INDEX "conversation_memory_updatedAt_idx" ON "conversation_memory"("updatedAt");

-- CreateIndex
CREATE INDEX "progress_tracking_userId_idx" ON "progress_tracking"("userId");

-- CreateIndex
CREATE INDEX "progress_tracking_metric_idx" ON "progress_tracking"("metric");

-- CreateIndex
CREATE INDEX "progress_tracking_userId_metric_idx" ON "progress_tracking"("userId", "metric");

-- CreateIndex
CREATE INDEX "progress_tracking_userId_metric_date_idx" ON "progress_tracking"("userId", "metric", "date");

-- CreateIndex
CREATE INDEX "progress_tracking_date_idx" ON "progress_tracking"("date");

-- CreateIndex
CREATE INDEX "assessments_category_idx" ON "assessments"("category");

-- CreateIndex
CREATE INDEX "assessments_assessment_type_idx" ON "assessments"("assessment_type");

-- CreateIndex
CREATE INDEX "assessments_is_active_idx" ON "assessments"("is_active");

-- CreateIndex
CREATE INDEX "assessments_is_basic_overall_only_idx" ON "assessments"("is_basic_overall_only");

-- CreateIndex
CREATE INDEX "assessments_visible_in_main_list_idx" ON "assessments"("visible_in_main_list");

-- CreateIndex
CREATE INDEX "questions_assessment_id_idx" ON "questions"("assessment_id");

-- CreateIndex
CREATE INDEX "questions_question_order_idx" ON "questions"("question_order");

-- CreateIndex
CREATE INDEX "content_immediateRelief_idx" ON "content"("immediateRelief");

-- CreateIndex
CREATE INDEX "content_isPublished_idx" ON "content"("isPublished");

-- CreateIndex
CREATE INDEX "practices_isPublished_idx" ON "practices"("isPublished");

-- CreateIndex
CREATE INDEX "content_engagements_userId_idx" ON "content_engagements"("userId");

-- CreateIndex
CREATE INDEX "content_engagements_contentId_idx" ON "content_engagements"("contentId");

-- CreateIndex
CREATE INDEX "content_engagements_completed_idx" ON "content_engagements"("completed");

-- CreateIndex
CREATE UNIQUE INDEX "content_engagements_userId_contentId_key" ON "content_engagements"("userId", "contentId");

-- CreateIndex
CREATE INDEX "chatbot_conversations_userId_startedAt_idx" ON "chatbot_conversations"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "chatbot_conversations_userId_endedAt_idx" ON "chatbot_conversations"("userId", "endedAt");

-- CreateIndex
CREATE INDEX "chatbot_conversations_userId_idx" ON "chatbot_conversations"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "dashboard_insights_userId_key" ON "dashboard_insights"("userId");

-- CreateIndex
CREATE INDEX "dashboard_insights_userId_expiresAt_idx" ON "dashboard_insights"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "dashboard_insights_userId_idx" ON "dashboard_insights"("userId");

-- CreateIndex
CREATE INDEX "activity_logs_adminEmail_createdAt_idx" ON "activity_logs"("adminEmail", "createdAt");

-- CreateIndex
CREATE INDEX "activity_logs_entityType_createdAt_idx" ON "activity_logs"("entityType", "createdAt");

-- CreateIndex
CREATE INDEX "activity_logs_action_createdAt_idx" ON "activity_logs"("action", "createdAt");

-- CreateIndex
CREATE INDEX "activity_logs_createdAt_idx" ON "activity_logs"("createdAt");
