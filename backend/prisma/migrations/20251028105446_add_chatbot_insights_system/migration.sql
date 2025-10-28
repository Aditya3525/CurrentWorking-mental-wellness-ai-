/*
  Warnings:

  - You are about to drop the `payment_history` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `premium_subscriptions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `premiumActivatedAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `premiumExpiresAt` on the `users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "payment_history_createdAt_idx";

-- DropIndex
DROP INDEX "payment_history_transactionId_idx";

-- DropIndex
DROP INDEX "payment_history_status_idx";

-- DropIndex
DROP INDEX "payment_history_userId_idx";

-- DropIndex
DROP INDEX "payment_history_transactionId_key";

-- DropIndex
DROP INDEX "premium_subscriptions_expiresAt_idx";

-- DropIndex
DROP INDEX "premium_subscriptions_status_idx";

-- DropIndex
DROP INDEX "premium_subscriptions_userId_idx";

-- DropIndex
DROP INDEX "premium_subscriptions_userId_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "payment_history";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "premium_subscriptions";
PRAGMA foreign_keys=on;

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

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_content" (
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
INSERT INTO "new_content" ("approach", "averageRating", "category", "completions", "confidence", "content", "contentType", "createdAt", "culturalContext", "description", "difficulty", "duration", "effectiveness", "focusAreas", "hasSubtitles", "id", "immediateRelief", "intensityLevel", "isPublished", "notes", "sourceName", "sourceUrl", "tags", "thumbnailUrl", "title", "transcript", "type", "updatedAt", "youtubeUrl") SELECT "approach", "averageRating", "category", "completions", "confidence", "content", "contentType", "createdAt", "culturalContext", "description", "difficulty", "duration", "effectiveness", "focusAreas", "hasSubtitles", "id", "immediateRelief", "intensityLevel", "isPublished", "notes", "sourceName", "sourceUrl", "tags", "thumbnailUrl", "title", "transcript", "type", "updatedAt", "youtubeUrl" FROM "content";
DROP TABLE "content";
ALTER TABLE "new_content" RENAME TO "content";
CREATE INDEX "content_immediateRelief_idx" ON "content"("immediateRelief");
CREATE INDEX "content_isPublished_idx" ON "content"("isPublished");
CREATE TABLE "new_practices" (
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
INSERT INTO "new_practices" ("approach", "audioUrl", "category", "confidence", "contraindications", "createdAt", "description", "difficulty", "duration", "environment", "format", "id", "intensityLevel", "isPublished", "notes", "requiredEquipment", "sensoryEngagement", "sourceName", "sourceUrl", "steps", "tags", "thumbnailUrl", "timeOfDay", "title", "type", "updatedAt", "videoUrl", "youtubeUrl") SELECT "approach", "audioUrl", "category", "confidence", "contraindications", "createdAt", "description", "difficulty", "duration", "environment", "format", "id", "intensityLevel", "isPublished", "notes", "requiredEquipment", "sensoryEngagement", "sourceName", "sourceUrl", "steps", "tags", "thumbnailUrl", "timeOfDay", "title", "type", "updatedAt", "videoUrl", "youtubeUrl" FROM "practices";
DROP TABLE "practices";
ALTER TABLE "new_practices" RENAME TO "practices";
CREATE INDEX "practices_isPublished_idx" ON "practices"("isPublished");
CREATE TABLE "new_users" (
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
INSERT INTO "new_users" ("approach", "birthday", "clinicianSharing", "createdAt", "dataConsent", "email", "emergencyContact", "emergencyPhone", "firstName", "gender", "googleId", "id", "isOnboarded", "isPremium", "language", "lastName", "name", "password", "profilePhoto", "region", "securityAnswerHash", "securityQuestion", "updatedAt") SELECT "approach", "birthday", "clinicianSharing", "createdAt", "dataConsent", "email", "emergencyContact", "emergencyPhone", "firstName", "gender", "googleId", "id", "isOnboarded", "isPremium", "language", "lastName", "name", "password", "profilePhoto", "region", "securityAnswerHash", "securityQuestion", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_googleId_idx" ON "users"("googleId");
CREATE INDEX "users_isOnboarded_idx" ON "users"("isOnboarded");
CREATE INDEX "users_approach_idx" ON "users"("approach");
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

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
