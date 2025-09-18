/*
  Warnings:

  - You are about to drop the column `role` on the `users` table. All the data in the column will be lost.

*/
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
    "tokenVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_users" ("approach", "birthday", "clinicianSharing", "createdAt", "dataConsent", "email", "emergencyContact", "emergencyPhone", "firstName", "gender", "googleId", "id", "isOnboarded", "language", "lastName", "name", "password", "profilePhoto", "region", "tokenVersion", "updatedAt") SELECT "approach", "birthday", "clinicianSharing", "createdAt", "dataConsent", "email", "emergencyContact", "emergencyPhone", "firstName", "gender", "googleId", "id", "isOnboarded", "language", "lastName", "name", "password", "profilePhoto", "region", "tokenVersion", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
