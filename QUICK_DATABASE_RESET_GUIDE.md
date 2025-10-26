# Quick Database Reset & Seed Guide

## When to Use This
- After database reset/loss
- Setting up new development environment
- After schema migrations that clear data
- When assessment definitions are missing

## Quick Commands

### Full Reset (⚠️ Deletes all data)
```powershell
cd backend
npx prisma migrate reset
# This will:
# 1. Drop the database
# 2. Recreate it
# 3. Run all migrations
# 4. Automatically run the seed script
```

### Seed Only (Preserves existing data, updates assessments)
```powershell
cd backend
npm run seed
```

## What Gets Seeded

### 1. Assessment Library (21 assessments total)
**Legacy IDs (used by frontend):**
- `anxiety_assessment` - GAD-7 Anxiety Assessment
- `depression_phq9` - PHQ-9 Depression Assessment
- `stress_pss10` - PSS-10 Stress Assessment
- `emotional_intelligence_teique` - TEIQue-SF Emotional Intelligence
- `overthinking_ptq` - PTQ Overthinking Assessment
- `trauma_pcl5` - PCL-5 Trauma Assessment
- `personality_mini_ipip` - Mini-IPIP Personality Assessment

**Short Form Assessments:**
- `phq2`, `gad2`, `pss4`, `rrs4`, `pc_ptsd_5`, `eq5`, `big_five_short`

**Full Form Assessments:**
- `phq9`, `gad7`, `pss10`, `ptq`, `pcl5`, `mini_ipip`, `teique_sf`

**Composite:**
- `basic_overall_assessment` - Combined quick screening

### 2. Default Users

| Type | Email | Password | Onboarded |
|------|-------|----------|-----------|
| Admin | admin@example.com | admin123 | ✅ |
| Admin | admin@mentalwellbeing.ai | admin123 | ✅ |
| Demo User | user1@example.com | user123 | ✅ |
| Demo User | testuser@example.com | user123 | ✅ |

### 3. Content & Data (for demo users)
- ✅ Wellness plan modules
- ✅ Practice exercises
- ✅ Educational content library
- ✅ Mock assessment history
- ✅ Mood tracking entries
- ✅ Progress tracking data
- ✅ Assessment insights

## Troubleshooting

### "Assessment not found" errors
**Solution:** Run `npm run seed` to populate assessment definitions

### "Unique constraint failed on question_id"
**Solution:** Already fixed - each assessment uses unique question IDs with prefixes

### Database connection errors
**Solution:** Check `backend/.env` has correct `DATABASE_URL`

### Seed script fails
1. Ensure database exists: `npx prisma db push`
2. Generate Prisma client: `npx prisma generate`
3. Try seed again: `npm run seed`

## After Seeding

### Verify in Database
```powershell
cd backend
npx prisma studio
```
Check:
- ✅ AssessmentDefinition table has 21 entries
- ✅ User table has 4 users (2 admins, 2 demo)
- ✅ PlanModule, Practice, Content tables populated

### Verify in Frontend
1. Login as demo user: `user1@example.com` / `user123`
2. Navigate to Assessments page
3. All 7 main assessments should be visible
4. Click any assessment - should load without errors

## Notes
- ⚠️ Never run `prisma migrate reset` in production
- 🔄 Seed script is idempotent for users (upsert)
- ⚠️ Seed script **deletes and recreates** all assessments
- 💾 User assessment results are preserved during seed
- 🔐 Change default passwords for any public deployment
