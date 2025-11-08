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
    "is_basic_overall_only" BOOLEAN NOT NULL DEFAULT false,
    "visible_in_main_list" BOOLEAN NOT NULL DEFAULT true,
    "scoring_config" TEXT,
    "created_by" TEXT,
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME
);
INSERT INTO "new_assessments" ("assessment_id", "assessment_name", "assessment_type", "category", "created_at", "created_by", "description", "is_active", "scoring_config", "time_estimate", "updated_at") SELECT "assessment_id", "assessment_name", "assessment_type", "category", "created_at", "created_by", "description", "is_active", "scoring_config", "time_estimate", "updated_at" FROM "assessments";
DROP TABLE "assessments";
ALTER TABLE "new_assessments" RENAME TO "assessments";
CREATE INDEX "assessments_category_idx" ON "assessments"("category");
CREATE INDEX "assessments_assessment_type_idx" ON "assessments"("assessment_type");
CREATE INDEX "assessments_is_active_idx" ON "assessments"("is_active");
CREATE INDEX "assessments_is_basic_overall_only_idx" ON "assessments"("is_basic_overall_only");
CREATE INDEX "assessments_visible_in_main_list_idx" ON "assessments"("visible_in_main_list");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
