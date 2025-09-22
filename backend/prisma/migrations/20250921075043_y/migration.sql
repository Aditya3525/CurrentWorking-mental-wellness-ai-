/*
  Warnings:

  - Added the required column `level` to the `practices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `types` to the `practices` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_practices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "types" TEXT NOT NULL,
    "type" TEXT,
    "duration" INTEGER NOT NULL,
    "level" TEXT NOT NULL,
    "difficulty" TEXT,
    "approach" TEXT NOT NULL,
    "description" TEXT,
    "audioUrl" TEXT,
    "videoUrl" TEXT,
    "youtubeUrl" TEXT,
    "thumbnailUrl" TEXT,
    "tags" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_practices" ("approach", "createdAt", "description", "difficulty", "duration", "id", "isPublished", "title", "type", "updatedAt", "viewCount") SELECT "approach", "createdAt", "description", "difficulty", "duration", "id", "isPublished", "title", "type", "updatedAt", "viewCount" FROM "practices";
DROP TABLE "practices";
ALTER TABLE "new_practices" RENAME TO "practices";
CREATE INDEX "practices_approach_idx" ON "practices"("approach");
CREATE INDEX "practices_level_idx" ON "practices"("level");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
