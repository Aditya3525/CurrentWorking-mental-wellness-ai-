# Deployment Status & Troubleshooting Guide

## Current Issue: Assessment Submission Failing

### Error Details
```
API request failed: Error: Server error
at sue.request (index-CrcPia3j.js:734:26512)
at async queryFn (index-CrcPia3j.js:816:149097)
```

### Root Cause Analysis

The assessment submission is failing with a 500 Server Error. Based on the backend code analysis, this is happening because:

1. **Database Not Seeded**: The backend expects assessment definitions (questions, options, scoring) to exist in the database
2. **Build Command Seeding Failed**: The automatic seeding in `buildCommand` likely failed because:
   - Placeholder API keys are present (Gemini keys needed for AI insights)
   - Database migrations may not have run successfully
   - Seed script requires valid database connection

### Current Deployment Configuration

**Services Status:**
- ✅ Frontend: https://mental-wellbeing-frontend.onrender.com (Live)
- ✅ Backend API: https://mental-wellbeing-api.onrender.com (Running but needs configuration)
- ✅ Database: mental-wellbeing-db (PostgreSQL - needs seeding)

**Environment Variables Status:**
- ✅ FRONTEND_URL: Set correctly
- ✅ JWT_SECRET: Set correctly
- ⚠️ GEMINI_API_KEY_1/2/3: Placeholder values (NEEDS REAL KEYS)
- ⚠️ GOOGLE_CLIENT_ID/SECRET: Placeholder values
- ⚠️ YOUTUBE_API_KEY: Placeholder value
- ⚠️ Database: Connected but empty (not seeded)

## Immediate Action Required

### Step 1: Set Real API Keys in Render Dashboard

Go to the Render dashboard and update these environment variables:

1. Navigate to: https://dashboard.render.com/
2. Select the **mental-wellbeing-api** service
3. Go to **Environment** tab
4. Update these variables with real values from `API_KEYS_REFERENCE.md`:

```
GEMINI_API_KEY_1=<real_key_from_API_KEYS_REFERENCE>
GEMINI_API_KEY_2=<real_key_from_API_KEYS_REFERENCE>
GEMINI_API_KEY_3=<real_key_from_API_KEYS_REFERENCE>
GOOGLE_CLIENT_ID=<real_key_from_API_KEYS_REFERENCE>
GOOGLE_CLIENT_SECRET=<real_key_from_API_KEYS_REFERENCE>
YOUTUBE_API_KEY=<real_key_from_API_KEYS_REFERENCE>
VITE_GOOGLE_CLIENT_ID=<real_key_from_API_KEYS_REFERENCE>
```

4. Click **Save Changes** (this will trigger automatic redeploy)

### Step 2: Manually Trigger Database Seeding

After the API keys are set and the backend redeploys, manually seed the database:

**Option A: Use the Manual Seed Endpoint**
```bash
# Open browser and visit:
https://mental-wellbeing-api.onrender.com/api/seed/run?secret=lM7EuV6SDPBFhvyfmYHOIjKGxkn2bCptde4ws5iLTZNWg9AX
```

**Option B: Use Render Shell (if available)**
```bash
# In Render dashboard, open Shell for mental-wellbeing-api service
npm run seed
```

**Option C: Run migrations manually**
```bash
# In Render dashboard Shell:
npx prisma migrate deploy
npx prisma db seed
```

### Step 3: Verify Database Seeding

Check if the database has been seeded successfully:

```bash
# Test the API endpoints:
# 1. Check available assessments
curl https://mental-wellbeing-api.onrender.com/api/assessments/available

# 2. Check assessment templates
curl https://mental-wellbeing-api.onrender.com/api/assessments/templates

# Expected: Should return assessment data, not empty arrays
```

### Step 4: Test Assessment Submission

1. Visit: https://mental-wellbeing-frontend.onrender.com
2. Login with demo credentials:
   - Email: `demo@mentalwellness.app`
   - Password: `Demo@123`
3. Navigate to Assessments
4. Try submitting an assessment
5. Should work without "Server error"

## Features Status Matrix

### ✅ Working Now (With Placeholder Keys)
- Email/Password Login
- User Registration
- Basic Dashboard
- Profile Management
- Mood Logging (basic UI)
- Content Library Browsing

### ⏳ Requires Real API Keys
- **AI Chat**: Needs Gemini API keys
- **Google OAuth Login**: Needs Google Client ID/Secret
- **YouTube Video Embeds**: Needs YouTube API key
- **Assessment Insights**: Needs Gemini API keys (for AI-generated insights)

### ❌ Currently Broken (Needs Database Seeding)
- **Assessment Submission**: Database empty, no assessment definitions
- **Assessment History**: No data to display
- **Personalized Recommendations**: Depends on assessment data
- **Progress Tracking**: Depends on mood/assessment data

## Technical Details

### Why Assessments Are Failing

The backend's `submitAssessment` function (backend/src/controllers/assessmentsController.ts:641) requires:

1. **Assessment Definitions** in database:
   - AssessmentDefinition records
   - AssessmentQuestion records  
   - AssessmentOption records
   - Proper scoring configuration

2. **AI Service** for insights generation:
   - Valid Gemini API keys
   - Assessment insights service working
   - Ability to generate personalized insights

3. **User & Session Data**:
   - Valid user session (JWT token)
   - User record in database

### What Happens During Assessment Submission

1. Frontend sends assessment data to `/api/assessments` (POST)
2. Backend validates request using Joi schema
3. Backend creates AssessmentResult record in database
4. Backend fetches user and assessment history
5. **Backend calls `buildAssessmentInsights()`** - This requires:
   - Assessment definitions from database
   - Gemini API key for AI-generated insights
   - Properly seeded taxonomy data
6. Backend saves insights to database
7. Backend returns assessment + insights to frontend

**Current Failure Point:** Step 4-5 (database empty, no assessment definitions, Gemini keys are placeholders)

### Database Seeding Process

The seed script (`backend/prisma/seed-content.ts`) creates:
- 7 assessment definitions (anxiety, depression, stress, trauma, etc.)
- ~150 assessment questions
- ~750 assessment options
- Scoring configurations
- Demo user accounts
- Sample content and practices

**Current Status:** Not executed successfully due to missing configuration during build

## Next Steps Timeline

### Immediate (Today)
1. Set real API keys in Render dashboard
2. Wait for automatic redeploy (~5-10 minutes)
3. Manually trigger database seeding
4. Verify assessments work

### Short-term (This Week)
1. Monitor application logs for any errors
2. Test all major features end-to-end
3. Verify AI chat functionality
4. Test Google OAuth login
5. Create production admin account

### Future Improvements
1. Set up proper database backups
2. Configure monitoring/alerting
3. Set up staging environment
4. Add health check monitoring
5. Implement proper logging infrastructure

## Monitoring & Logs

### Check Backend Logs
```
1. Go to Render Dashboard
2. Select "mental-wellbeing-api" service
3. Click "Logs" tab
4. Look for:
   - Database connection errors
   - Seeding status
   - API errors
   - Authentication issues
```

### Check Frontend Logs
```
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for:
   - API request failures
   - CORS errors
   - Authentication errors
```

### Health Check Endpoints
```bash
# Backend health check
curl https://mental-wellbeing-api.onrender.com/health

# Expected response:
{"status":"ok","timestamp":"..."}
```

## Support & Documentation

- **API Keys Reference**: See `API_KEYS_REFERENCE.md`
- **Environment Setup**: See `ENVIRONMENT_SETUP.md`
- **Render Deployment**: See `RENDER_DEPLOYMENT_GUIDE.md`
- **Testing Guide**: See `TESTING_GUIDE.md`

## Contact & Help

If you continue to experience issues:

1. Check backend logs for specific error messages
2. Verify all environment variables are set correctly
3. Ensure database migrations completed successfully
4. Confirm seeding script executed without errors
5. Test API endpoints directly using curl/Postman

---

**Last Updated**: November 12, 2025
**Status**: Awaiting API key configuration and database seeding
