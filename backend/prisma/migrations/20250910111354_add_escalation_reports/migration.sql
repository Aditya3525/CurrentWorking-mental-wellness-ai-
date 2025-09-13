/*
  Warnings:

  - You are about to drop the `content_analytics` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `meditation_content` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `story_content` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_content_interactions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `youtube_content` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `author` on the `content` table. All the data in the column will be lost.
  - You are about to drop the column `completionRate` on the `content` table. All the data in the column will be lost.
  - You are about to drop the column `engagementScore` on the `content` table. All the data in the column will be lost.
  - You are about to drop the column `externalId` on the `content` table. All the data in the column will be lost.
  - You are about to drop the column `externalUrl` on the `content` table. All the data in the column will be lost.
  - You are about to drop the column `lastQualityCheck` on the `content` table. All the data in the column will be lost.
  - You are about to drop the column `platform` on the `content` table. All the data in the column will be lost.
  - You are about to drop the column `rating` on the `content` table. All the data in the column will be lost.
  - You are about to drop the column `thumbnailUrl` on the `content` table. All the data in the column will be lost.
  - You are about to drop the column `viewCount` on the `content` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "meditation_content_contentId_key";

-- DropIndex
DROP INDEX "story_content_contentId_key";

-- DropIndex
DROP INDEX "user_content_interactions_userId_contentId_interactionType_timestamp_key";

-- DropIndex
DROP INDEX "youtube_content_videoId_key";

-- DropIndex
DROP INDEX "youtube_content_contentId_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "content_analytics";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "meditation_content";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "story_content";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "user_content_interactions";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "youtube_content";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "escalation_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "escalationLevel" TEXT NOT NULL,
    "triggerReasons" TEXT NOT NULL,
    "userMessage" TEXT NOT NULL,
    "agentResponse" TEXT NOT NULL,
    "mentalHealthState" TEXT NOT NULL,
    "recommendedActions" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedBy" TEXT,
    "reviewNotes" TEXT,
    "followUpRequired" BOOLEAN NOT NULL DEFAULT true,
    "notificationSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "escalation_reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    "keywords" TEXT
);
INSERT INTO "new_content" ("aiSummary", "approach", "category", "content", "createdAt", "difficulty", "duration", "effectiveness", "id", "isPublished", "keywords", "outcomes", "prerequisites", "tags", "targetAudience", "title", "type", "updatedAt") SELECT "aiSummary", "approach", "category", "content", "createdAt", "difficulty", "duration", "effectiveness", "id", "isPublished", "keywords", "outcomes", "prerequisites", "tags", "targetAudience", "title", "type", "updatedAt" FROM "content";
DROP TABLE "content";
ALTER TABLE "new_content" RENAME TO "content";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
