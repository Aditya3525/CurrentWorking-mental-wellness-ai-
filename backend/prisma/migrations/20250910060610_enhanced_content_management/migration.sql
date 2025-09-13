/*
  Warnings:

  - You are about to drop the `ai_bias_monitoring` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ai_model_performance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ai_response_quality` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `data_deletion_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `data_requests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `data_retention_policies` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ethical_ai_compliance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_consents` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "user_consents_userId_consentType_version_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ai_bias_monitoring";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ai_model_performance";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ai_response_quality";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "data_deletion_logs";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "data_requests";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "data_retention_policies";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ethical_ai_compliance";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "user_consents";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "youtube_content" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "channelName" TEXT NOT NULL,
    "publishedAt" DATETIME NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "categoryId" TEXT NOT NULL,
    "defaultLanguage" TEXT,
    "transcript" TEXT,
    "captions" TEXT,
    "thumbnails" TEXT NOT NULL,
    "therapeuticValue" REAL,
    "safetyScore" REAL,
    "accuracyScore" REAL,
    "lastValidated" DATETIME,
    "validatedBy" TEXT,
    CONSTRAINT "youtube_content_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "content" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "story_content" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentId" TEXT NOT NULL,
    "narrative" TEXT NOT NULL,
    "audioUrl" TEXT,
    "musicUrl" TEXT,
    "illustrations" TEXT NOT NULL,
    "ageRange" TEXT NOT NULL,
    "therapeuticGoals" TEXT NOT NULL,
    "chapters" TEXT,
    "interactiveElements" TEXT,
    "discussionPoints" TEXT,
    "characterNames" TEXT,
    "settings" TEXT,
    CONSTRAINT "story_content_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "content" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "meditation_content" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentId" TEXT NOT NULL,
    "instructor" TEXT NOT NULL,
    "script" TEXT NOT NULL,
    "audioUrl" TEXT,
    "backgroundMusic" TEXT,
    "technique" TEXT NOT NULL,
    "phases" TEXT NOT NULL,
    "cues" TEXT,
    "variations" TEXT,
    "voiceOptions" TEXT,
    "paceOptions" TEXT,
    "backgroundOptions" TEXT,
    CONSTRAINT "meditation_content_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "content" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "content_analytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentId" TEXT NOT NULL,
    "userId" TEXT,
    "metric" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deviceType" TEXT,
    "userSegment" TEXT,
    "accessMethod" TEXT,
    CONSTRAINT "content_analytics_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "content" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_content_interactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "interactionType" TEXT NOT NULL,
    "value" REAL,
    "duration" INTEGER,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT,
    "deviceType" TEXT,
    "accessMethod" TEXT,
    CONSTRAINT "user_content_interactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_content_interactions_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "content" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_content" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "approach" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "duration" TEXT,
    "difficulty" TEXT,
    "tags" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "targetAudience" TEXT,
    "effectiveness" REAL,
    "prerequisites" TEXT,
    "outcomes" TEXT,
    "aiSummary" TEXT,
    "keywords" TEXT,
    "thumbnailUrl" TEXT,
    "author" TEXT,
    "rating" REAL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "completionRate" REAL,
    "engagementScore" REAL,
    "lastQualityCheck" DATETIME,
    "externalId" TEXT,
    "externalUrl" TEXT,
    "platform" TEXT
);
INSERT INTO "new_content" ("aiSummary", "approach", "category", "content", "createdAt", "difficulty", "duration", "effectiveness", "id", "isPublished", "keywords", "outcomes", "prerequisites", "tags", "targetAudience", "title", "type", "updatedAt") SELECT "aiSummary", "approach", "category", "content", "createdAt", "difficulty", "duration", "effectiveness", "id", "isPublished", "keywords", "outcomes", "prerequisites", "tags", "targetAudience", "title", "type", "updatedAt" FROM "content";
DROP TABLE "content";
ALTER TABLE "new_content" RENAME TO "content";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "youtube_content_contentId_key" ON "youtube_content"("contentId");

-- CreateIndex
CREATE UNIQUE INDEX "youtube_content_videoId_key" ON "youtube_content"("videoId");

-- CreateIndex
CREATE UNIQUE INDEX "story_content_contentId_key" ON "story_content"("contentId");

-- CreateIndex
CREATE UNIQUE INDEX "meditation_content_contentId_key" ON "meditation_content"("contentId");

-- CreateIndex
CREATE UNIQUE INDEX "user_content_interactions_userId_contentId_interactionType_timestamp_key" ON "user_content_interactions"("userId", "contentId", "interactionType", "timestamp");
