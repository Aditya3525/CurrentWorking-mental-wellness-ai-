# 🧪 AI Insights Testing Guide

## Current Status
✅ Backend running on: http://localhost:5000
✅ Frontend running on: http://localhost:3000
✅ Gemini API configured
✅ Code updated to send assessment details

## How to Test

### Step 1: Open the Application
Navigate to: **http://localhost:3000**

### Step 2: Complete a NEW Assessment
1. **Log in** to your account
2. Go to **Dashboard** → **Assessments**
3. Choose any assessment (e.g., **Depression (PHQ-9)**)
4. **Complete ALL questions** - the AI needs this data!
5. Submit the assessment

### Step 3: Check the Insights
After submission, you'll be redirected to the **Insights** page.

Look for the AI Summary section at the top.

### Expected Results

#### ✅ GOOD - AI Generated Response:
```
Your depression assessment shows mild symptoms with a recent improvement 
of 4 points - that's encouraging progress! You mentioned feeling down 
several days and having trouble with sleep. Consider maintaining your 
current routines that are helping, and try adding a 10-minute morning 
walk or journaling practice. If symptoms persist or worsen, reaching 
out to a counselor could provide additional support.
```

#### ❌ BAD - Fallback Response:
```
Depression: Mild depression Recent score moved down by 4 points. 
Suggested focus: Continue tracking your depression to build long-term awareness.
```

### Step 4: Check Backend Logs

Open the **backend terminal** and look for these logs:

```bash
# When you submit the assessment:
[Assessment Submission] Building insights with detailed context: {
  userId: "...",
  assessmentType: "depression",
  hasResponseDetails: true,        # ← Should be TRUE
  responseDetailsCount: 9,         # ← Should match question count
  detailedContextCount: 1,
  sampleResponse: { ... }
}

# When AI generates summary:
[AI Summary] Generating AI summary with context: {
  userName: "YourName",
  assessmentCount: 1,
  hasDetailedAssessments: true,    # ← Should be TRUE
  detailSectionsLength: 150,
  fullContextPreview: "User YourName has completed..."
}

# AI response:
[AI Summary] LLM response: {
  hasResponse: true,               # ← Should be TRUE
  hasContent: true,                # ← Should be TRUE
  contentPreview: "Your depression...",
  isFallback: false                # ← Should be FALSE
}
```

## What to Share

When you complete the assessment, please share:

1. **Screenshot of the Insights page** showing the AI summary
2. **Backend logs** (copy from terminal)
3. **Any error messages**

---

## Ready to Test! 🎯

1. Open http://localhost:3000
2. Log in
3. Complete an assessment
4. Check the Insights page
5. Share the results!
