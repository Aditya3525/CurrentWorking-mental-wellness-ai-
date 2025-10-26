-- CreateTable
CREATE TABLE "premium_subscriptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "planType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "paymentMethod" TEXT,
    "transactionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "premium_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payment_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "description" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payment_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "premiumActivatedAt" DATETIME,
    "premiumExpiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_users" ("approach", "birthday", "clinicianSharing", "createdAt", "dataConsent", "email", "emergencyContact", "emergencyPhone", "firstName", "gender", "googleId", "id", "isOnboarded", "language", "lastName", "name", "password", "profilePhoto", "region", "securityAnswerHash", "securityQuestion", "updatedAt") SELECT "approach", "birthday", "clinicianSharing", "createdAt", "dataConsent", "email", "emergencyContact", "emergencyPhone", "firstName", "gender", "googleId", "id", "isOnboarded", "language", "lastName", "name", "password", "profilePhoto", "region", "securityAnswerHash", "securityQuestion", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_googleId_idx" ON "users"("googleId");
CREATE INDEX "users_isOnboarded_idx" ON "users"("isOnboarded");
CREATE INDEX "users_approach_idx" ON "users"("approach");
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");
CREATE INDEX "users_isPremium_idx" ON "users"("isPremium");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "premium_subscriptions_userId_key" ON "premium_subscriptions"("userId");

-- CreateIndex
CREATE INDEX "premium_subscriptions_userId_idx" ON "premium_subscriptions"("userId");

-- CreateIndex
CREATE INDEX "premium_subscriptions_status_idx" ON "premium_subscriptions"("status");

-- CreateIndex
CREATE INDEX "premium_subscriptions_expiresAt_idx" ON "premium_subscriptions"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "payment_history_transactionId_key" ON "payment_history"("transactionId");

-- CreateIndex
CREATE INDEX "payment_history_userId_idx" ON "payment_history"("userId");

-- CreateIndex
CREATE INDEX "payment_history_status_idx" ON "payment_history"("status");

-- CreateIndex
CREATE INDEX "payment_history_transactionId_idx" ON "payment_history"("transactionId");

-- CreateIndex
CREATE INDEX "payment_history_createdAt_idx" ON "payment_history"("createdAt");
