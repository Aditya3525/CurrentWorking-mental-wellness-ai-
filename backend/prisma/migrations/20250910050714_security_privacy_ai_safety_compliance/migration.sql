/*
  Warnings:

  - You are about to drop the `ai_bias_detections` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ai_ethics_configs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ai_response_reviews` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `consent_records` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `data_export_requests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `approvedBy` on the `data_deletion_logs` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `data_deletion_logs` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `data_retention_policies` table. All the data in the column will be lost.
  - Added the required column `reason` to the `data_retention_policies` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "ai_ethics_configs_configName_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ai_bias_detections";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ai_ethics_configs";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ai_response_reviews";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "consent_records";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "data_export_requests";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "user_consents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "consentType" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "version" TEXT NOT NULL,
    "consentText" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "jurisdiction" TEXT NOT NULL,
    "expiresAt" DATETIME,
    "withdrawnAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_consents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "data_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "rejectionReason" TEXT,
    "dataExported" TEXT,
    "verificationCode" TEXT,
    "legalBasis" TEXT,
    "handledBy" TEXT,
    CONSTRAINT "data_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ai_bias_monitoring" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "aiProvider" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "inputType" TEXT NOT NULL,
    "biasType" TEXT NOT NULL,
    "biasIndicators" TEXT NOT NULL,
    "confidenceScore" REAL NOT NULL,
    "userDemographic" TEXT,
    "inputContext" TEXT NOT NULL,
    "mitigationApplied" TEXT,
    "reviewStatus" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_bias_monitoring_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ai_response_quality" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "messageId" TEXT,
    "userId" TEXT NOT NULL,
    "aiProvider" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "inputMessage" TEXT NOT NULL,
    "aiResponse" TEXT NOT NULL,
    "qualityScore" REAL NOT NULL,
    "safetyScore" REAL NOT NULL,
    "appropriatenessSc" REAL NOT NULL,
    "harmfulContent" BOOLEAN NOT NULL DEFAULT false,
    "biasDetected" BOOLEAN NOT NULL DEFAULT false,
    "flaggedReasons" TEXT,
    "humanReviewed" BOOLEAN NOT NULL DEFAULT false,
    "reviewedBy" TEXT,
    "reviewNotes" TEXT,
    "actionTaken" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" DATETIME,
    CONSTRAINT "ai_response_quality_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ethical_ai_compliance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "complianceType" TEXT NOT NULL,
    "checkType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "affectedUsers" INTEGER,
    "severity" TEXT NOT NULL,
    "remediation" TEXT,
    "verifiedBy" TEXT,
    "dueDate" DATETIME,
    "resolvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ai_model_performance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "metricValue" REAL NOT NULL,
    "sampleSize" INTEGER NOT NULL,
    "timeframe" TEXT NOT NULL,
    "performanceGrade" TEXT NOT NULL,
    "improvementNeeded" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "reportPeriodStart" DATETIME NOT NULL,
    "reportPeriodEnd" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_data_deletion_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "dataType" TEXT NOT NULL,
    "recordCount" INTEGER NOT NULL,
    "deletionType" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "requestedBy" TEXT,
    "executedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataHash" TEXT
);
INSERT INTO "new_data_deletion_logs" ("dataType", "deletionType", "executedAt", "id", "reason", "recordCount", "requestedBy", "userId") SELECT "dataType", "deletionType", "executedAt", "id", "reason", "recordCount", "requestedBy", "userId" FROM "data_deletion_logs";
DROP TABLE "data_deletion_logs";
ALTER TABLE "new_data_deletion_logs" RENAME TO "data_deletion_logs";
CREATE TABLE "new_data_retention_policies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dataType" TEXT NOT NULL,
    "retentionDays" INTEGER NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "autoDelete" BOOLEAN NOT NULL DEFAULT true,
    "reason" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_data_retention_policies" ("createdAt", "dataType", "id", "isActive", "jurisdiction", "retentionDays", "updatedAt") SELECT "createdAt", "dataType", "id", "isActive", "jurisdiction", "retentionDays", "updatedAt" FROM "data_retention_policies";
DROP TABLE "data_retention_policies";
ALTER TABLE "new_data_retention_policies" RENAME TO "data_retention_policies";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "user_consents_userId_consentType_version_key" ON "user_consents"("userId", "consentType", "version");
