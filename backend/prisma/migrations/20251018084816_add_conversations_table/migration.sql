/*
  Warnings:

  - Added the required column `conversationId` to the `chat_messages` table without a default value. This is not possible if the table is not empty.

*/

-- Step 1: Create conversations table
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

-- Step 2: Create a default conversation for each user with existing messages
INSERT INTO "conversations" ("id", "userId", "title", "createdAt", "updatedAt", "lastMessageAt")
SELECT 
    'conv_' || cm.userId AS id,
    cm.userId,
    'Previous Conversation' AS title,
    MIN(cm.createdAt) AS createdAt,
    MAX(cm.createdAt) AS updatedAt,
    MAX(cm.createdAt) AS lastMessageAt
FROM "chat_messages" cm
GROUP BY cm.userId;

-- Step 3: Create new chat_messages table with conversationId
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_chat_messages" (
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

-- Step 4: Migrate existing messages to new table with conversationId
INSERT INTO "new_chat_messages" ("id", "conversationId", "userId", "content", "type", "metadata", "createdAt")
SELECT 
    cm.id,
    'conv_' || cm.userId AS conversationId,
    cm.userId,
    cm.content,
    cm.type,
    cm.metadata,
    cm.createdAt
FROM "chat_messages" cm;

-- Step 5: Drop old table and rename new one
DROP TABLE "chat_messages";
ALTER TABLE "new_chat_messages" RENAME TO "chat_messages";

-- Step 6: Create indexes
CREATE INDEX "chat_messages_conversationId_createdAt_idx" ON "chat_messages"("conversationId", "createdAt");
CREATE INDEX "chat_messages_userId_createdAt_idx" ON "chat_messages"("userId", "createdAt");
CREATE INDEX "chat_messages_userId_idx" ON "chat_messages"("userId");
CREATE INDEX "chat_messages_type_idx" ON "chat_messages"("type");
CREATE INDEX "chat_messages_createdAt_idx" ON "chat_messages"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "conversations_userId_lastMessageAt_idx" ON "conversations"("userId", "lastMessageAt");

-- CreateIndex
CREATE INDEX "conversations_userId_isArchived_idx" ON "conversations"("userId", "isArchived");

-- CreateIndex
CREATE INDEX "conversations_lastMessageAt_idx" ON "conversations"("lastMessageAt");
