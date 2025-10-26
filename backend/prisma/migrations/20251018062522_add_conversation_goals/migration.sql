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

-- CreateIndex
CREATE INDEX "conversation_goals_userId_idx" ON "conversation_goals"("userId");

-- CreateIndex
CREATE INDEX "conversation_goals_status_idx" ON "conversation_goals"("status");

-- CreateIndex
CREATE INDEX "conversation_goals_goalType_idx" ON "conversation_goals"("goalType");
