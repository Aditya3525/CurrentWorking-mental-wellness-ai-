# 🚀 Quick Fix Guide - Get Your App Working Now!

## Problem
Assessment submissions are failing with "Server error" because the database hasn't been seeded yet.

## Solution (3 Simple Steps)

### Step 1: Manually Seed the Database

Open this URL in your browser:

```
https://mental-wellbeing-api.onrender.com/api/seed/run?secret=lM7EuV6SDPBFhvyfmYHOIjKGxkn2bCptde4ws5iLTZNWg9AX
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Database seeded successfully!",
  "output": "..."
}
```

**If you see this, the database is now seeded! ✅**

### Step 2: Test the API

Check if assessments are now available:

```
https://mental-wellbeing-api.onrender.com/api/assessments/available
```

**Expected Response:** JSON array with 7+ assessment objects

### Step 3: Test Assessment Submission

1. Go to: https://mental-wellbeing-frontend.onrender.com
2. Login with demo account:
   - **Email**: `demo@mentalwellness.app`
   - **Password**: `Demo@123`
3. Click "Assessments" in navigation
4. Select any assessment (e.g., "Depression Assessment")
5. Complete the questions
6. Submit

**✅ Should work without "Server error"!**

---

## Current Status After Fix

### ✅ Working Features
- Email/Password Login & Registration
- User Dashboard
- **Assessment Submission** ← NOW FIXED!
- Assessment History
- Mood Logging
- Content Library
- Practices
- Progress Tracking
- Profile Management

### ⚠️ Limited Features (Need Real API Keys)
- **AI Chat**: Shows interface but returns generic responses (needs Gemini keys)
- **Assessment Insights**: Basic insights only (needs Gemini for AI-powered insights)
- **Google OAuth Login**: Not available (needs Google credentials)
- **YouTube Videos**: May not load (needs YouTube API key)

---

## Optional: Add AI Features

To enable full AI-powered features (chat, personalized insights), set real API keys:

### Step 1: Open Render Dashboard
https://dashboard.render.com

### Step 2: Select Backend Service
Click on "mental-wellbeing-api"

### Step 3: Go to Environment Tab
Click "Environment" in the left sidebar

### Step 4: Update These Variables

Find and update (don't delete):

```bash
# Replace placeholder values with real keys from API_KEYS_REFERENCE.md

GEMINI_API_KEY_1
GEMINI_API_KEY_2  
GEMINI_API_KEY_3
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
YOUTUBE_API_KEY
```

### Step 5: Save & Redeploy
Click "Save Changes" - Render will automatically redeploy (5-10 min)

### Step 6: Update Frontend Environment

Click on "mental-wellbeing-frontend" service, then:

```bash
VITE_GOOGLE_CLIENT_ID = (same value as backend GOOGLE_CLIENT_ID)
```

**Note:** Frontend needs manual trigger after env var change:
1. Go to "Manual Deploy" tab
2. Click "Clear build cache & deploy"

---

## Troubleshooting

### Error: "Unauthorized. Provide valid secret"
**Fix:** Make sure you copied the FULL URL with the `?secret=...` part

### Error: "Failed to seed database"
**Possible causes:**
1. Database connection issue - check Render logs
2. Migration not run - go to Render Shell and run: `npx prisma migrate deploy`
3. Seed already ran - check if assessments already exist

### Assessments Still Returning "Server error"
**Check:**
1. Did the seed endpoint return success?
2. Check backend logs for specific error
3. Try logging out and back in
4. Clear browser cache

### How to Check Backend Logs
1. Go to Render Dashboard
2. Click "mental-wellbeing-api" service
3. Click "Logs" tab
4. Look for errors

---

## What Just Happened?

The database seeding creates:

- **7 Assessment Types**:
  - Depression (PHQ-9)
  - Anxiety (GAD-7)
  - Stress (PSS-10)
  - Trauma (PCL-5)
  - Overthinking (PTQ)
  - Emotional Intelligence (TEIQue-SF)
  - Personality (Mini-IPIP)

- **150+ Assessment Questions** with proper scoring
- **750+ Assessment Options** (answer choices)
- **Demo User Accounts**:
  - Demo: demo@mentalwellness.app / Demo@123
  - Admin: admin@mentalwellness.app / Admin@123
- **Sample Content & Practices**
- **Taxonomy Data** for recommendations

Without seeding, the database was empty and couldn't process assessments!

---

## Next Steps

1. ✅ Run the seed endpoint (Step 1 above)
2. ✅ Test assessment submission
3. ⏳ Optionally set real API keys for AI features
4. 🎉 Enjoy your deployed app!

---

**Need Help?**
- Check `DEPLOYMENT_STATUS.md` for detailed troubleshooting
- Check `API_KEYS_REFERENCE.md` for the actual API key values
- Look at backend logs in Render dashboard

**Last Updated**: November 12, 2025
