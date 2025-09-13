-- CreateTable
CREATE TABLE "data_retention_policies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dataType" TEXT NOT NULL,
    "retentionDays" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "jurisdiction" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "data_deletion_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "dataType" TEXT NOT NULL,
    "deletionType" TEXT NOT NULL,
    "recordCount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "requestedBy" TEXT,
    "approvedBy" TEXT,
    "executedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" TEXT
);

-- CreateTable
CREATE TABLE "consent_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "consentType" TEXT NOT NULL,
    "consentVersion" TEXT NOT NULL,
    "consentStatus" TEXT NOT NULL,
    "consentDate" DATETIME NOT NULL,
    "withdrawalDate" DATETIME,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "consentMethod" TEXT NOT NULL,
    "legalBasis" TEXT NOT NULL,
    "dataCategories" TEXT NOT NULL,
    "purposes" TEXT NOT NULL,
    "retentionPeriod" INTEGER,
    "thirdPartySharing" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "consent_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "data_export_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "downloadUrl" TEXT,
    "expiresAt" DATETIME,
    "fileFormat" TEXT NOT NULL,
    "includeMedia" BOOLEAN NOT NULL DEFAULT false,
    "dataTypes" TEXT NOT NULL,
    CONSTRAINT "data_export_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ai_bias_detections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "interactionId" TEXT NOT NULL,
    "interactionType" TEXT NOT NULL,
    "biasType" TEXT NOT NULL,
    "biasScore" REAL NOT NULL,
    "biasIndicators" TEXT NOT NULL,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "reviewStatus" TEXT NOT NULL,
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    "mitigation" TEXT,
    "detectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ai_response_reviews" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chatMessageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "aiProvider" TEXT NOT NULL,
    "userPrompt" TEXT NOT NULL,
    "aiResponse" TEXT NOT NULL,
    "qualityScore" REAL,
    "appropriateness" TEXT NOT NULL,
    "clinicalAccuracy" TEXT,
    "ethicalCompliance" BOOLEAN NOT NULL DEFAULT true,
    "biasFlags" TEXT,
    "safetyFlags" TEXT,
    "reviewType" TEXT NOT NULL,
    "reviewedBy" TEXT,
    "reviewDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actionTaken" TEXT,
    "notes" TEXT,
    CONSTRAINT "ai_response_reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ai_ethics_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "configName" TEXT NOT NULL,
    "biasThreshold" REAL NOT NULL DEFAULT 0.7,
    "toxicityThreshold" REAL NOT NULL DEFAULT 0.8,
    "clinicalThreshold" REAL NOT NULL DEFAULT 0.6,
    "enableBiasDetection" BOOLEAN NOT NULL DEFAULT true,
    "enableToxicityFilter" BOOLEAN NOT NULL DEFAULT true,
    "enableClinicalReview" BOOLEAN NOT NULL DEFAULT true,
    "requireHumanReview" BOOLEAN NOT NULL DEFAULT false,
    "autoBlockHighRisk" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_ethics_configs_configName_key" ON "ai_ethics_configs"("configName");
