/*
  Warnings:

  - Added the required column `updated_at` to the `assessments` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_assessments" (
    "assessment_id" TEXT NOT NULL PRIMARY KEY,
    "assessment_name" TEXT NOT NULL,
    "assessment_type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "time_estimate" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "scoring_config" TEXT,
    "created_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_assessments" ("assessment_id", "assessment_name", "assessment_type", "category", "description", "is_active", "time_estimate") SELECT "assessment_id", "assessment_name", "assessment_type", "category", "description", "is_active", "time_estimate" FROM "assessments";
DROP TABLE "assessments";
ALTER TABLE "new_assessments" RENAME TO "assessments";
CREATE INDEX "assessments_category_idx" ON "assessments"("category");
CREATE INDEX "assessments_assessment_type_idx" ON "assessments"("assessment_type");
CREATE INDEX "assessments_is_active_idx" ON "assessments"("is_active");
CREATE TABLE "new_questions" (
    "question_id" TEXT NOT NULL PRIMARY KEY,
    "assessment_id" TEXT NOT NULL,
    "question_text" TEXT NOT NULL,
    "question_order" INTEGER NOT NULL,
    "response_type" TEXT NOT NULL,
    "domain" TEXT,
    "reverse_scored" BOOLEAN NOT NULL DEFAULT false,
    "metadata" TEXT,
    CONSTRAINT "questions_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments" ("assessment_id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_questions" ("assessment_id", "question_id", "question_order", "question_text", "response_type") SELECT "assessment_id", "question_id", "question_order", "question_text", "response_type" FROM "questions";
DROP TABLE "questions";
ALTER TABLE "new_questions" RENAME TO "questions";
CREATE INDEX "questions_assessment_id_idx" ON "questions"("assessment_id");
CREATE INDEX "questions_question_order_idx" ON "questions"("question_order");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
