-- CreateTable
CREATE TABLE "support_tickets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "response" TEXT,
    "respondedBy" TEXT,
    "respondedAt" DATETIME,
    "userEmail" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "closedAt" DATETIME,
    CONSTRAINT "support_tickets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "faqs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "order" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "helpful" INTEGER NOT NULL DEFAULT 0,
    "notHelpful" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "crisis_resources" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "textNumber" TEXT,
    "website" TEXT,
    "description" TEXT NOT NULL,
    "availability" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'US',
    "language" TEXT NOT NULL DEFAULT 'English',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "safety_plans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "warningSignsJson" TEXT NOT NULL DEFAULT '[]',
    "copingStrategiesJson" TEXT NOT NULL DEFAULT '[]',
    "contactsJson" TEXT NOT NULL DEFAULT '[]',
    "therapistName" TEXT,
    "therapistPhone" TEXT,
    "psychiatristName" TEXT,
    "psychiatristPhone" TEXT,
    "emergencyRoom" TEXT,
    "crisisLine" TEXT DEFAULT '988',
    "safeEnvironmentJson" TEXT NOT NULL DEFAULT '[]',
    "reasonsToLiveJson" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "safety_plans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "therapists" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "credential" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "specialtiesJson" TEXT NOT NULL DEFAULT '[]',
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "street" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'US',
    "acceptsInsurance" BOOLEAN NOT NULL DEFAULT false,
    "insurances" TEXT,
    "sessionFee" REAL,
    "offersSliding" BOOLEAN NOT NULL DEFAULT false,
    "availabilityJson" TEXT NOT NULL DEFAULT '[]',
    "profileImageUrl" TEXT,
    "yearsExperience" INTEGER,
    "languages" TEXT,
    "rating" REAL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "therapist_bookings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "therapistId" TEXT NOT NULL,
    "preferredDate" DATETIME,
    "preferredTime" TEXT,
    "message" TEXT,
    "userEmail" TEXT NOT NULL,
    "userPhone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "processedBy" TEXT,
    "processedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "therapist_bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "therapist_bookings_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "therapists" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "support_tickets_userId_idx" ON "support_tickets"("userId");

-- CreateIndex
CREATE INDEX "support_tickets_status_idx" ON "support_tickets"("status");

-- CreateIndex
CREATE INDEX "support_tickets_category_idx" ON "support_tickets"("category");

-- CreateIndex
CREATE INDEX "support_tickets_priority_idx" ON "support_tickets"("priority");

-- CreateIndex
CREATE INDEX "support_tickets_createdAt_idx" ON "support_tickets"("createdAt");

-- CreateIndex
CREATE INDEX "support_tickets_userId_status_idx" ON "support_tickets"("userId", "status");

-- CreateIndex
CREATE INDEX "faqs_category_idx" ON "faqs"("category");

-- CreateIndex
CREATE INDEX "faqs_isPublished_idx" ON "faqs"("isPublished");

-- CreateIndex
CREATE INDEX "faqs_order_idx" ON "faqs"("order");

-- CreateIndex
CREATE INDEX "faqs_viewCount_idx" ON "faqs"("viewCount");

-- CreateIndex
CREATE INDEX "crisis_resources_isActive_idx" ON "crisis_resources"("isActive");

-- CreateIndex
CREATE INDEX "crisis_resources_country_idx" ON "crisis_resources"("country");

-- CreateIndex
CREATE INDEX "crisis_resources_type_idx" ON "crisis_resources"("type");

-- CreateIndex
CREATE INDEX "crisis_resources_order_idx" ON "crisis_resources"("order");

-- CreateIndex
CREATE UNIQUE INDEX "safety_plans_userId_key" ON "safety_plans"("userId");

-- CreateIndex
CREATE INDEX "safety_plans_userId_idx" ON "safety_plans"("userId");

-- CreateIndex
CREATE INDEX "therapists_isActive_idx" ON "therapists"("isActive");

-- CreateIndex
CREATE INDEX "therapists_isVerified_idx" ON "therapists"("isVerified");

-- CreateIndex
CREATE INDEX "therapists_city_state_idx" ON "therapists"("city", "state");

-- CreateIndex
CREATE INDEX "therapists_rating_idx" ON "therapists"("rating");

-- CreateIndex
CREATE INDEX "therapist_bookings_userId_idx" ON "therapist_bookings"("userId");

-- CreateIndex
CREATE INDEX "therapist_bookings_therapistId_idx" ON "therapist_bookings"("therapistId");

-- CreateIndex
CREATE INDEX "therapist_bookings_status_idx" ON "therapist_bookings"("status");

-- CreateIndex
CREATE INDEX "therapist_bookings_createdAt_idx" ON "therapist_bookings"("createdAt");
