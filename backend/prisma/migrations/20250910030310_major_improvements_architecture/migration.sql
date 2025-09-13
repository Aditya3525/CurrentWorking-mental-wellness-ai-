-- AlterTable
ALTER TABLE "chat_messages" ADD COLUMN "attachments" TEXT;
ALTER TABLE "chat_messages" ADD COLUMN "audioUrl" TEXT;
ALTER TABLE "chat_messages" ADD COLUMN "contextWindow" TEXT;
ALTER TABLE "chat_messages" ADD COLUMN "embeddings" TEXT;
ALTER TABLE "chat_messages" ADD COLUMN "emotionalTags" TEXT;
ALTER TABLE "chat_messages" ADD COLUMN "imageUrl" TEXT;
ALTER TABLE "chat_messages" ADD COLUMN "relevanceScore" REAL;
ALTER TABLE "chat_messages" ADD COLUMN "sentiment" TEXT;
ALTER TABLE "chat_messages" ADD COLUMN "sessionId" TEXT;
ALTER TABLE "chat_messages" ADD COLUMN "tokenCount" INTEGER;

-- AlterTable
ALTER TABLE "content" ADD COLUMN "aiSummary" TEXT;
ALTER TABLE "content" ADD COLUMN "effectiveness" REAL;
ALTER TABLE "content" ADD COLUMN "keywords" TEXT;
ALTER TABLE "content" ADD COLUMN "outcomes" TEXT;
ALTER TABLE "content" ADD COLUMN "prerequisites" TEXT;
ALTER TABLE "content" ADD COLUMN "targetAudience" TEXT;

-- AlterTable
ALTER TABLE "progress_tracking" ADD COLUMN "confidence" REAL;
ALTER TABLE "progress_tracking" ADD COLUMN "interventions" TEXT;
ALTER TABLE "progress_tracking" ADD COLUMN "predictedValue" REAL;
ALTER TABLE "progress_tracking" ADD COLUMN "riskFactors" TEXT;
ALTER TABLE "progress_tracking" ADD COLUMN "trendDirection" TEXT;

-- AlterTable
ALTER TABLE "user_activities" ADD COLUMN "deviceInfo" TEXT;
ALTER TABLE "user_activities" ADD COLUMN "location" TEXT;
ALTER TABLE "user_activities" ADD COLUMN "riskScore" REAL;
ALTER TABLE "user_activities" ADD COLUMN "sessionId" TEXT;

-- CreateTable
CREATE TABLE "ai_contexts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "contextType" TEXT NOT NULL,
    "contextData" TEXT NOT NULL,
    "tokenCount" INTEGER NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_contexts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "assessment_media" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assessmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "transcript" TEXT,
    "analysis" TEXT,
    "emotions" TEXT,
    "confidence" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "assessment_media_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "assessment_media_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "predictive_scores" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "scoreType" TEXT NOT NULL,
    "currentScore" REAL NOT NULL,
    "predictedScore" REAL NOT NULL,
    "timeframe" INTEGER NOT NULL,
    "confidence" REAL NOT NULL,
    "factors" TEXT NOT NULL,
    "recommendations" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "calculatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "predictive_scores_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "content_recommendations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "relevanceScore" REAL NOT NULL,
    "priority" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "personalizedTitle" TEXT,
    "estimatedBenefit" REAL,
    "viewed" BOOLEAN NOT NULL DEFAULT false,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "rating" INTEGER,
    "feedback" TEXT,
    "recommendedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "content_recommendations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "content_recommendations_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "content" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "assessment_versions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assessmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "assessmentType" TEXT NOT NULL,
    "score" REAL NOT NULL,
    "responses" TEXT NOT NULL,
    "aiInsights" TEXT,
    "changes" TEXT,
    "reason" TEXT,
    "modifiedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "assessment_versions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "assessment_versions_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "system_audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "component" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "userId" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_assessments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "assessmentType" TEXT NOT NULL,
    "score" REAL NOT NULL,
    "responses" TEXT NOT NULL,
    "aiInsights" TEXT,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isLatest" BOOLEAN NOT NULL DEFAULT true,
    "parentId" TEXT,
    "metadata" TEXT,
    "confidence" REAL,
    "tags" TEXT,
    CONSTRAINT "assessments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "assessments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "assessments" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_assessments" ("aiInsights", "assessmentType", "completedAt", "id", "responses", "score", "userId") SELECT "aiInsights", "assessmentType", "completedAt", "id", "responses", "score", "userId" FROM "assessments";
DROP TABLE "assessments";
ALTER TABLE "new_assessments" RENAME TO "assessments";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
