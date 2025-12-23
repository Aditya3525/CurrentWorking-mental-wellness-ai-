# Data Seeding Guide

This guide explains how to populate the MaanaSarathi database with baseline data for assessments, demo users, plan modules, content, and analytics history. The backend includes a comprehensive Prisma seed script at `backend/src/prisma/seed.ts` that can be run for development, QA fixtures, or demo environments.

## 1. Prerequisites
- Database schema applied (run `npx prisma migrate deploy` or `npx prisma migrate dev`).
- Backend `.env` file configured with a valid `DATABASE_URL` (see `ENVIRONMENT_SETUP.md`).
- Node.js 18+ installed locally or available in your runtime.

## 2. Running the Seeder
Execute from the repository root:

```powershell
cd backend
npm install
npm run seed
```

The script will:
- Rebuild the assessment library (`assessments`, `questions`, `response_options`).
- Upsert two admin accounts and two onboarded demo users (with hashed passwords).
- Seed practices, educational content, and wellness plan modules.
- Attach roadmap modules, mood logs, progress tracking, and recent assessment history to the demo users.
- Summarize insights to match dashboard expectations.

> ⚠️ **Warning:** `seedAssessmentLibrary` clears all existing assessment definitions/questions/options before rebuilding them. Do not run in production without backups.

## 3. Default Accounts
| Role | Email | Password | Notes |
| --- | --- | --- | --- |
| Admin (primary) | `admin@example.com` | `admin123` | Used for QA dashboards. |
| Admin (secondary) | `admin@mentalwellbeing.ai` | `admin123` | Mirrors production domain. |
| Demo User 1 | `user1@example.com` | `user123` | Eastern approach profile. |
| Demo User 2 | `testuser@example.com` | `user123` | Hybrid approach profile. |

Rotate passwords immediately if you expose these accounts outside internal demos.

## 4. Customizing the Seed
- **Assessments:** Edit `ASSESSMENT_SEEDS` and related builders in `seed.ts` to add/remove questionnaires or tweak copy. Re-run the seed to regenerate.
- **Practice & Content Library:** Update the arrays in `seedPractices` and `seedContent` with real assets (swap placeholder URLs for hosted media).
- **Plan Modules:** Adjust `seedPlanModules` JSON payloads to align with your program structure.
- **User Fixtures:** Extend `upsertDemoUser` calls or add new ones for targeted testing (e.g., partially onboarded flows).

Remember to re-run `npm run seed` (or `npx prisma db seed` if you switch to Prisma’s native seeding hook) after changes.

## 5. Automating in CI/CD
For cloud deployments: 
1. Ensure migrations run first (`npx prisma migrate deploy`).
2. Inject `DATABASE_URL` and other secrets via the hosting platform’s secret manager.
3. Trigger the seeding command conditionally (e.g., once per preview environment) to avoid wiping live data.

## 6. Next Steps
- Validate seeded data through the admin dashboards and onboarding flows.
- Expand unit/integration tests to rely on seeded fixtures instead of ad-hoc mocks.
- Once stable, proceed to resilience tooling (fallback behaviours, retry logic, monitoring alerts).
