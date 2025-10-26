# Onboarding Assessment Flow - Quick Start Guide

## 🎯 What This Feature Does

After a new user completes their onboarding profile, they're offered a **quick mental wellbeing check** using 7 validated screening tools. The system tracks their progress through multiple assessments in one session and automatically redirects them to their personalized dashboard with fresh insights.

---

## 🚀 Quick Demo Flow

### Step 1: Complete Onboarding
When a user finishes setting their approach (Western/Eastern/Hybrid) and profile details, they're immediately shown:

```
┌────────────────────────────────────────────┐
│   💚✨ Great job, [FirstName]!            │
│                                            │
│   Would you like to take a quick overall  │
│   wellbeing check? It only takes a few    │
│   minutes and helps tailor your dashboard │
│   with personalised insights right away.  │
│                                            │
│   [Yes, start the quick check]            │
│   [Maybe later, show my dashboard]        │
└────────────────────────────────────────────┘
```

### Step 2A: User Clicks "Maybe Later"
→ Instant redirect to Dashboard

### Step 2B: User Clicks "Yes, start"
→ Navigate to Assessment Selection Page

---

## 📋 Assessment Selection Page

User sees 7 interactive cards in a grid:

```
┌─────────────────────────────────────────────────────────────┐
│ 📝 Build your first wellbeing snapshot                     │
│ Choose any quick check-ins you'd like to complete...       │
│                                                             │
│ ☑ Select all    ✓ 3 of 7 selected    ⏱ Approx. 7 minutes │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                 │
│  │ ✓ Anxiety       │  │   Depression    │                 │
│  │   (GAD-2)       │  │   (PHQ-2)       │                 │
│  │ 2 questions     │  │ 2 questions     │                 │
│  │ ⏱ 2 minutes     │  │ ⏱ 2 minutes     │                 │
│  └─────────────────┘  └─────────────────┘                 │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                 │
│  │ ✓ Stress        │  │ ✓ Overthinking  │                 │
│  │   (PSS-4)       │  │   (RRS-4)       │                 │
│  │ 4 questions     │  │ 4 questions     │                 │
│  │ ⏱ 3 minutes     │  │ ⏱ 3 minutes     │                 │
│  └─────────────────┘  └─────────────────┘                 │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                 │
│  │   Trauma        │  │   Emotional     │                 │
│  │   (PC-PTSD-5)   │  │   Intelligence  │                 │
│  │ 5 questions     │  │   (EQ-5)        │                 │
│  │ ⏱ 3 minutes     │  │ 5 questions     │                 │
│  └─────────────────┘  │ ⏱ 4 minutes     │                 │
│                       └─────────────────┘                 │
│                                                             │
│  ┌─────────────────┐                                       │
│  │   Personality   │                                       │
│  │   (Big Five)    │                                       │
│  │ 5 questions     │                                       │
│  │ ⏱ 4 minutes     │                                       │
│  └─────────────────┘                                       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ [Skip for now]           [Start selected assessments]      │
└─────────────────────────────────────────────────────────────┘
```

**Interaction:**
- Click anywhere on a card to toggle selection
- Checkbox in top-right updates automatically
- Cards with blue border = selected
- Time estimate updates in real-time
- "Start" button disabled if nothing selected

---

## 🎯 Assessment Flow (Sequential)

User selected: Anxiety + Depression + Stress

### Question 1 (Anxiety GAD-2, Q1)
```
┌─────────────────────────────────────────────────────────────┐
│ ← Exit Assessment                         2 min elapsed     │
│                                                             │
│ 🧠 Anxiety (GAD-2)                              1 of 2     │
│ ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░ 50% complete                         │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Feeling nervous, anxious, or on edge?                      │
│                                                             │
│  ○ Not at all                                               │
│  ○ Several days                                             │
│  ⦿ More than half the days                                  │
│  ○ Nearly every day                                         │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ [Previous]                                      [Next ▶]    │
│                                                             │
│               Save & Continue Later                         │
└─────────────────────────────────────────────────────────────┘
```

After answering all questions in **Anxiety (GAD-2)**:

### Processing Screen (3 seconds)
```
┌─────────────────────────────────────────────┐
│                                             │
│          🧠 (pulsing animation)            │
│                                             │
│      Processing Your Results               │
│                                             │
│   We're analyzing your responses to         │
│   provide personalized insights...          │
│                                             │
│          ● ● ● (animated dots)             │
│                                             │
│   Generating your personalized              │
│   recommendations...                        │
│                                             │
└─────────────────────────────────────────────┘
```

### Automatic Transition
→ System checks: "Are there more assessments in this session?"
→ YES: Load next assessment (Depression PHQ-2)
→ User sees Question 1 of Depression seamlessly

This continues until all 3 assessments are complete.

---

## 📊 Results Page

After completing all selected assessments:

```
┌─────────────────────────────────────────────────────────────┐
│ ← Back to Dashboard                                         │
│                                                             │
│ Your Wellbeing Insights                                     │
│ Based on your latest assessment history                     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ 🧠 Overall Summary                                          │
│                                                             │
│ Updated just now                     🟢 Overall: Stable    │
│                                                             │
│ You're showing balanced emotional awareness with some       │
│ moderate stress markers. Your anxiety levels are within     │
│ normal range. Consider incorporating daily grounding        │
│ exercises to manage occasional rumination patterns.         │
│                                                             │
│ Wellness Score: 72/100 ⭐                                   │
├─────────────────────────────────────────────────────────────┤
│ 📈 By Assessment Type                                       │
│                                                             │
│ Anxiety (GAD-2)              Score: 42  🟡 +3  → Stable    │
│ Depression (PHQ-2)           Score: 28  🟢 -5  ↗ Improving │
│ Stress (PSS-4)               Score: 58  🟡 +8  ↘ Declining │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ 💡 Top Recommendations                                      │
│                                                             │
│ 🎯 Daily: Practice 5-minute breathing exercises            │
│ 💚 Support: Explore journaling for stress management       │
│ ⚡ Immediate: Try a grounding technique when anxious       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ [Start a Chat] [View Progress] [Explore Content Library]   │
└─────────────────────────────────────────────────────────────┘

            Automatically redirecting to dashboard in 6s...
```

After 6 seconds → Dashboard loads automatically

---

## 🔄 Technical Flow Summary

```
User completes onboarding
         ↓
App.tsx: setCurrentPage('assessment-invite')
         ↓
OverallAssessmentInvite renders
         ↓
User clicks "Yes"
         ↓
handleAssessmentInviteDecision(true)
         ↓
setCurrentPage('assessment-selection')
         ↓
OverallAssessmentSelection renders
         ↓
User selects: ['anxiety_gad2', 'depression_phq2', 'stress_pss4']
         ↓
User clicks "Start selected assessments"
         ↓
beginOverallAssessment(['anxiety_gad2', ...])
         ↓
API POST /assessments/sessions
         ↓
Backend creates AssessmentSession record
  - id: "session-abc123"
  - selectedTypes: ['anxiety_gad2', 'depression_phq2', 'stress_pss4']
  - status: 'pending'
  - pendingTypes: ['anxiety_gad2', 'depression_phq2', 'stress_pss4']
  - completedTypes: []
         ↓
Backend returns session summary
         ↓
Frontend extracts first pending: 'anxiety_gad2'
         ↓
startAssessment('anxiety_gad2', session)
         ↓
setCurrentPage('assessment-flow')
         ↓
AssessmentFlow renders with assessmentId='anxiety_gad2'
         ↓
User answers Q1, Q2
         ↓
User clicks "Complete Assessment"
         ↓
AssessmentFlow calls onComplete(payload)
  - payload.sessionId = "session-abc123"
  - payload.responses = { gad2_q1: '2', gad2_q2: '1' }
         ↓
completeAssessment(payload) in App.tsx
         ↓
API POST /assessments with sessionId
         ↓
Backend:
  1. Scores responses using scoreGad2()
  2. Creates Assessment record with sessionId
  3. Updates session:
     - status: 'pending' → 'in_progress'
     - completedTypes: ['anxiety_gad2']
     - pendingTypes: ['depression_phq2', 'stress_pss4']
  4. Returns { assessment, history, insights, session }
         ↓
Frontend receives response
         ↓
Check: sessionSummary.pendingTypes.length > 0?
         ↓ YES
setCurrentAssessment('depression_phq2')
setCurrentPage('assessment-flow')
         ↓
AssessmentFlow re-renders with new assessmentId
  - useEffect detects ID change
  - Resets question index, answers, timer
         ↓
User completes Depression PHQ-2
         ↓
... process repeats for Stress PSS-4 ...
         ↓
After final assessment:
Backend sets session.status = 'completed'
Backend returns session.pendingTypes = []
         ↓
Frontend checks: pendingTypes.length === 0
         ↓ YES
setCurrentPage('insights')
setPostAssessmentRedirect('dashboard')
         ↓
InsightsResults renders
         ↓
useEffect detects: currentPage === 'insights' && postAssessmentRedirect === 'dashboard'
         ↓
setTimeout 6 seconds
         ↓
setCurrentPage('dashboard')
         ↓
Dashboard loads with fresh assessment scores
```

---

## 📊 Database State After Session

### AssessmentSession Table
```sql
id: session-abc123
userId: user-xyz789
selectedTypes: ["anxiety_gad2", "depression_phq2", "stress_pss4"]
status: completed
startedAt: 2025-10-01T10:30:00Z
completedAt: 2025-10-01T10:38:00Z
```

### Assessment Table (3 records created)
```sql
-- Record 1
id: assess-001
userId: user-xyz789
sessionId: session-abc123
assessmentType: anxiety_gad2
score: 42.0
rawScore: 3
maxScore: 6
responses: '{"gad2_q1":"2","gad2_q2":"1"}'
categoryScores: null
completedAt: 2025-10-01T10:32:00Z

-- Record 2
id: assess-002
userId: user-xyz789
sessionId: session-abc123
assessmentType: depression_phq2
score: 28.0
rawScore: 2
maxScore: 6
responses: '{"phq2_q1":"1","phq2_q2":"1"}'
categoryScores: null
completedAt: 2025-10-01T10:35:00Z

-- Record 3
id: assess-003
userId: user-xyz789
sessionId: session-abc123
assessmentType: stress_pss4
score: 58.0
rawScore: 9
maxScore: 16
responses: '{"pss4_q1":"3","pss4_q2":"1","pss4_q3":"2","pss4_q4":"3"}'
categoryScores: null
completedAt: 2025-10-01T10:38:00Z
```

---

## 🎨 Component Responsibilities

### OverallAssessmentInvite
- **Purpose:** Binary choice screen after onboarding
- **Props:** `onDecision(boolean)`, `userName?: string`
- **UI:** Centered card with two buttons
- **Logic:** Calls `onDecision(true/false)` → parent routes accordingly

### OverallAssessmentSelection
- **Purpose:** Multi-select assessment chooser
- **Props:** `onSubmit(string[])`, `onCancel()`, `isSubmitting`, `errorMessage`
- **UI:** Grid of toggle cards, time estimate, submit button
- **State:** Local `Set<string>` for selected IDs
- **Logic:** 
  - Toggle individual cards
  - "Select all" checkbox
  - Real-time time calculation
  - Calls `onSubmit([...selected])` when user starts

### AssessmentFlow (enhanced)
- **Purpose:** Universal questionnaire renderer
- **Props:** `assessmentId`, `sessionId?`, `onComplete`, `onNavigate`
- **Features Added:**
  - 7 new assessment definitions registered in `ASSESSMENT_LIBRARY`
  - `useEffect` hook to reset state when `assessmentId` changes
  - Accepts optional `sessionId` in completion payload
- **State Management:**
  - `currentQuestion` index
  - `answers` map
  - `startTime` timestamp
  - `isProcessing` boolean (3s animation)

---

## ✅ Testing Scenarios

### Happy Path
1. Complete onboarding
2. Click "Yes, start the quick check"
3. Select Anxiety + Depression (2 assessments)
4. Click "Start selected assessments"
5. Answer 2 GAD-2 questions
6. Automatically transition to PHQ-2
7. Answer 2 PHQ-2 questions
8. See insights page
9. Wait 6 seconds → land on dashboard
10. Check dashboard shows fresh scores

### Edge Cases
- Select 0 assessments → Start button disabled ✓
- Select all 7 → Time estimate ~21 minutes ✓
- Click "Skip for now" → Dashboard immediately ✓
- Exit during first assessment → Session status remains 'in_progress'
- Return later → Can resume via "Active Session" feature (future)
- Network error during submission → Error displayed inline ✓
- User manually navigates away → Session preserved in DB

---

## 🚀 Quick Commands

### Run Frontend
```bash
cd "c:\Users\adity\Downloads\Mental Wellbeing AI App Overview"
npm run dev:frontend
```

### Run Backend
```bash
cd "c:\Users\adity\Downloads\Mental Wellbeing AI App Overview"
npm run dev:backend
```

### Test the Flow
1. Navigate to http://localhost:5173
2. Create new account OR use existing demo account
3. Complete onboarding if not done
4. You'll see the assessment invite automatically
5. Follow the flow!

### Check Database
```bash
cd backend
npx prisma studio
```
Then browse:
- `AssessmentSession` table
- `Assessment` table (filter by sessionId)

---

## 📝 Developer Notes

### Adding a New Assessment
1. Define question set in `AssessmentFlow.tsx`:
   ```typescript
   const myNewAssessment: AssessmentData = {
     title: 'My Assessment',
     scoringKey: 'my_assessment',
     questions: [...]
   };
   ```

2. Register in library:
   ```typescript
   const ASSESSMENT_LIBRARY = {
     my_assessment: myNewAssessment,
     ...
   };
   ```

3. Add scoring function in `basicAssessments.ts`:
   ```typescript
   export const scoreMyAssessment = (responses: ResponseMap): AssessmentScoreResult => {
     // ... scoring logic
   };
   
   export const SCORE_HANDLERS = {
     my_assessment: scoreMyAssessment,
     ...
   };
   ```

4. Add to selection page options in `OverallAssessmentSelection.tsx`:
   ```typescript
   const OPTIONS = [
     {
       id: 'my_assessment',
       title: 'My Assessment',
       description: '...',
       questions: 5,
       estimatedTime: '3 minutes'
     },
     ...
   ];
   ```

Done! The rest is automatic.

---

**Status:** ✅ Fully Implemented & Production Ready  
**Last Updated:** October 1, 2025
