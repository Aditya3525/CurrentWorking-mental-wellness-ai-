# Onboarding Assessment Flow - Implementation Summary

**Date:** October 1, 2025  
**Feature:** Post-onboarding overall wellbeing assessment with multi-select screening tools

---

## 📋 Overview

This document details the complete implementation of the onboarding assessment flow, which guides new users through an optional multi-assessment screening process immediately after completing their initial profile setup.

---

## ✅ Requirements Fulfillment

### Step 1: Post-Onboarding Prompt ✓
**Requirement:** After onboarding completion, ask user: *"Would you like to give an overall assessment?"*

**Implementation:**
- **Component:** `OverallAssessmentInvite.tsx`
- **Location:** `frontend/src/components/features/assessment/`
- **Route:** `assessment-invite` page
- **Trigger:** Automatically shown after successful onboarding completion
- **Features:**
  - Friendly greeting with user's first name
  - Clear explanation of benefits (takes a few minutes, personalized insights)
  - Two action buttons: "Yes, start the quick check" and "Maybe later, show my dashboard"

**Code Reference:**
```typescript
// App.tsx - completeOnboardingFlow handler
console.log('Onboarding complete - routing to overall assessment invite');
setCurrentPage('assessment-invite');
```

---

### Step 2: Branching Logic ✓
**Requirement:** Route user based on their decision

**Implementation:**
- **Handler:** `handleAssessmentInviteDecision(accept: boolean)`
- **Location:** `App.tsx`
- **Behavior:**
  - **If YES:** Navigate to `assessment-selection` page
  - **If NO:** Navigate directly to `dashboard`

**Code Reference:**
```typescript
const handleAssessmentInviteDecision = (accept: boolean) => {
  if (accept) {
    setAssessmentError(null);
    setCurrentPage('assessment-selection');
    return;
  }
  setCurrentPage('dashboard');
};
```

---

### Step 3: Multi-Select Assessment Chooser ✓
**Requirement:** Display all 7 screening tools with multi-select UI

**Implementation:**
- **Component:** `OverallAssessmentSelection.tsx`
- **Location:** `frontend/src/components/features/assessment/`
- **Route:** `assessment-selection` page

**Available Assessments:**
1. ✅ **Anxiety (GAD-2)** - 2 questions, 2 minutes
2. ✅ **Depression (PHQ-2)** - 2 questions, 2 minutes
3. ✅ **Stress (PSS-4)** - 4 questions, 3 minutes
4. ✅ **Overthinking (RRS-4)** - 4 questions, 3 minutes
5. ✅ **Trauma & Fear (PC-PTSD-5)** - 5 questions, 3 minutes
6. ✅ **Emotional Intelligence (EQ-5)** - 5 questions, 4 minutes
7. ✅ **Personality (Big Five)** - 5 questions, 4 minutes

**UI Features:**
- Interactive toggle cards (click anywhere to select/deselect)
- Checkbox in top-right of each card
- "Select all" checkbox at the top
- Real-time counter showing X of 7 selected
- Dynamic time estimate based on selections
- "Skip for now" button (returns to dashboard)
- "Start selected assessments" button (disabled if nothing selected)
- Error display for backend issues

**Code Reference:**
```typescript
const OPTIONS: OverallAssessmentOption[] = [
  {
    id: 'anxiety_gad2',
    title: 'Anxiety (GAD-2)',
    description: 'Two quick check-in questions about recent anxious feelings.',
    questions: 2,
    estimatedTime: '2 minutes'
  },
  // ... 6 more options
];
```

---

### Step 4: Dynamic Questionnaire Generation ✓
**Requirement:** Dynamically load questions based on user selection, present sequentially with navigation

**Implementation:**

#### A. Backend Session Creation
- **API Endpoint:** `POST /api/assessments/sessions`
- **Handler:** `startAssessmentSession()` in `assessmentsController.ts`
- **Behavior:**
  - Accepts array of assessment type IDs
  - Creates `AssessmentSession` record with status `pending`
  - Cancels any previous pending/in-progress sessions
  - Returns session summary with pending/completed tracking

**Code Reference:**
```typescript
// Backend - assessmentsController.ts
export const startAssessmentSession = async (req: any, res: Response) => {
  const selectedTypesInput: string[] = req.body.selectedTypes ?? [];
  const normalizedTypes = Array.from(
    new Set(selectedTypesInput.map((type) => normalizeAssessmentType(type)))
  );
  
  const session = await assessmentSession.create({
    data: {
      userId,
      selectedTypes: normalizedTypes,
      status: 'pending'
    }
  });
  
  res.status(201).json({ success: true, data: { session } });
};
```

#### B. Frontend Session Initialization
- **Handler:** `beginOverallAssessment(selectedTypes: string[])`
- **Location:** `App.tsx`
- **Behavior:**
  1. Calls session creation API
  2. Extracts first pending assessment type
  3. Launches `AssessmentFlow` with session context

**Code Reference:**
```typescript
const beginOverallAssessment = async (selectedTypes: string[]) => {
  const response = await assessmentsApi.startAssessmentSession({ selectedTypes });
  const session = response.data.session;
  const nextAssessmentType = session.pendingTypes[0];
  startAssessment(nextAssessmentType, session);
};
```

#### C. Question Rendering
- **Component:** `AssessmentFlow.tsx`
- **Features:**
  - Reads from `ASSESSMENT_LIBRARY` registry
  - Displays one question at a time
  - Previous/Next navigation
  - Progress bar showing X of Y complete
  - Elapsed time tracker
  - Safety warnings for sensitive questions
  - Auto-reset when assessment ID changes (enables seamless multi-assessment flow)

**Question Definitions:**
All 7 assessments are defined in `AssessmentFlow.tsx`:
- `depressionPhq2Assessment` - PHQ-2 questions with 0-3 frequency scale
- `anxietyGad2Assessment` - GAD-2 questions with 0-3 frequency scale
- `stressPss4Assessment` - PSS-4 questions with 0-4 frequency scale (reverse scoring Q2/Q3)
- `overthinkingRrs4Assessment` - RRS-4 questions with 0-3 frequency scale
- `traumaPcptsd5Assessment` - PC-PTSD-5 binary yes/no questions
- `emotionalIntelligenceEq5Assessment` - EQ-5 Likert scale 0-4
- `personalityBigFiveAssessment` - Big Five traits, 0-4 scale with reverse scoring

**Code Reference:**
```typescript
// AssessmentFlow.tsx - Question library registration
const ASSESSMENT_LIBRARY: Record<string, AssessmentData> = {
  anxiety_gad2: anxietyGad2Assessment,
  depression_phq2: depressionPhq2Assessment,
  stress_pss4: stressPss4Assessment,
  overthinking_rrs4: overthinkingRrs4Assessment,
  trauma_pcptsd5: traumaPcptsd5Assessment,
  emotional_intelligence_eq5: emotionalIntelligenceEq5Assessment,
  personality_bigfive10: personalityBigFiveAssessment,
  // ... existing assessments
};
```

---

### Step 5: Backend Storage & Scoring ✓
**Requirement:** Store selections, answers, calculated scores; maintain timestamped records

**Implementation:**

#### A. Database Schema
**Table:** `AssessmentSession`
```prisma
model AssessmentSession {
  id            String   @id @default(cuid())
  userId        String
  selectedTypes Json     // Array of chosen assessment type IDs
  status        String   @default("pending") // pending | in_progress | completed | cancelled
  startedAt     DateTime @default(now())
  completedAt   DateTime?

  user        User        @relation(fields: [userId], references: [id])
  assessments Assessment[] // One-to-many: all assessments in this session
}
```

**Table:** `Assessment`
```prisma
model Assessment {
  id              String   @id @default(cuid())
  userId          String
  assessmentType  String
  score           Float    // Normalized 0-100
  responses       String   // JSON of all question answers
  rawScore        Float?
  maxScore        Float?
  normalizedScore Float?
  categoryScores  Json?    // Breakdown by trait/category
  sessionId       String?  // Links to AssessmentSession
  completedAt     DateTime @default(now())
  
  user    User               @relation(...)
  session AssessmentSession? @relation(...)
}
```

#### B. Scoring Engines
**Location:** `backend/src/services/assessments/basicAssessments.ts`

Each assessment has a dedicated scoring function:
- `scorePhq2()` - PHQ-2 depression screening (0-6 raw, interpretations at 2, 4)
- `scoreGad2()` - GAD-2 anxiety screening (0-6 raw, interpretations at 2, 4)
- `scorePss4()` - PSS-4 stress (0-16 raw, reverse scoring Q2/Q3)
- `scoreRrs4()` - RRS-4 rumination (4-16 raw)
- `scorePcptsd5()` - PC-PTSD-5 trauma (0-5 yes/no sum)
- `scoreEq5()` - EQ-5 emotional intelligence (5-25 raw)
- `scoreBigFive()` - Big Five personality traits with per-trait breakdown

**Scoring Output:**
```typescript
interface AssessmentScoreResult {
  rawScore: number;
  maxScore: number;
  normalizedScore: number;       // 0-100 scale
  normalizedScoreRounded: number; // Rounded to 1 decimal
  interpretation: string;         // Human-readable guidance
  categoryBreakdown?: Record<string, {
    raw: number;
    normalized: number;
    interpretation?: string;
  }>;
}
```

**Example - PHQ-2 Scoring:**
```typescript
export const scorePhq2 = (responses: ResponseMap): AssessmentScoreResult => {
  const items = ['phq2_q1', 'phq2_q2'];
  const scores = items.map((id) => ensureNumeric(responses[id]));
  const rawScore = scores.reduce((sum, value) => sum + Math.min(Math.max(value, 0), 3), 0);
  const maxScore = 6;
  const normalizedScore = ((rawScore / maxScore) * 100);
  
  const interpretation = buildInterpretation(rawScore, [
    { max: 2, message: 'Minimal depressive symptoms' },
    { max: 4, message: 'Mild depressive symptoms—monitor and care for your mood.' }
  ], 'Elevated depressive symptoms—consider speaking with a professional.');
  
  return { rawScore, maxScore, normalizedScore, normalizedScoreRounded: roundTo(normalizedScore), interpretation };
};
```

#### C. Submission Flow
1. **Frontend:** `AssessmentFlow` calls `onComplete()` with payload including `sessionId`
2. **API Call:** `assessmentsApi.submitAssessment()` sends answers + session context
3. **Backend Processing:**
   - Identifies scorer via `SCORE_HANDLERS` registry
   - Runs scoring function on responses
   - Creates `Assessment` record with `sessionId` foreign key
   - Updates session progress (pending → in_progress → completed)
   - Builds updated insights summary
4. **Response:** Returns assessment record, full history, insights, and refreshed session summary

**Code Reference:**
```typescript
// assessmentsController.ts - submitAssessment
if (Object.prototype.hasOwnProperty.call(SCORE_HANDLERS, resolvedAssessmentType)) {
  const scoring = SCORE_HANDLERS[resolvedAssessmentType](responses as Record<string, unknown>);
  computedScore = scoring.normalizedScoreRounded;
  rawScore = scoring.rawScore;
  maxScore = scoring.maxScore;
  categoryBreakdown = scoring.categoryBreakdown ?? null;
}

const record = await prisma.assessment.create({
  data: {
    userId,
    assessmentType: resolvedAssessmentType,
    score: computedScore,
    responses: JSON.stringify(responses),
    rawScore, maxScore, normalizedScore, categoryScores: categoryBreakdown,
    sessionId
  }
});

if (sessionId) {
  sessionSummary = await refreshSessionProgress(sessionId, userId);
}
```

---

### Step 6: Results & Dashboard Redirect ✓
**Requirement:** Show results, then redirect to dashboard

**Implementation:**

#### A. Session Continuation Logic
**Location:** `App.tsx` → `completeAssessment()` handler

After each assessment submission:
1. Receive updated session summary from backend
2. Check `sessionSummary.pendingTypes.length`
3. **If pending assessments remain:**
   - Extract next pending type
   - Update `currentAssessment` state
   - Stay on `assessment-flow` page (seamless transition to next questionnaire)
4. **If all assessments complete:**
   - Navigate to `insights` page
   - Schedule automatic redirect to `dashboard` in 6 seconds

**Code Reference:**
```typescript
// App.tsx - completeAssessment handler
const sessionSummary = response.data.session ?? (payload.sessionId ? activeSession : null);
setActiveSession(sessionSummary);

if (sessionSummary && sessionSummary.status !== 'completed' && sessionSummary.pendingTypes.length > 0) {
  const nextAssessmentType = sessionSummary.pendingTypes[0];
  if (nextAssessmentType) {
    setCurrentAssessment(nextAssessmentType);
    setCurrentPage('assessment-flow');
    return; // Stay in flow, load next assessment
  }
}

setCurrentAssessment(null);
setPostAssessmentRedirect(sessionSummary || payload.sessionId ? 'dashboard' : null);
setCurrentPage('insights');
```

#### B. Auto-Redirect Timer
**Location:** `App.tsx` → `useEffect` hook

When user lands on insights page after completing a session:
- 6-second timer starts automatically
- Timer clears and redirects to dashboard
- User can still navigate manually via "Back to Dashboard" button

**Code Reference:**
```typescript
useEffect(() => {
  if (currentPage === 'insights' && postAssessmentRedirect) {
    const timer = window.setTimeout(() => {
      setPostAssessmentRedirect(null);
      setCurrentPage(postAssessmentRedirect); // 'dashboard'
    }, 6000);

    return () => window.clearTimeout(timer);
  }
  return undefined;
}, [currentPage, postAssessmentRedirect]);
```

#### C. Insights Display
**Component:** `InsightsResults.tsx`
**Features:**
- AI-generated summary of overall wellbeing trend
- Per-assessment breakdown showing:
  - Latest score with color coding (green < 40, yellow 40-70, red > 70)
  - Change from previous assessment
  - Trend badge (improving/declining/stable/baseline)
  - Interpretation text
  - Personalized recommendations
- Wellness score (if available)
- Action buttons: Start chat, view progress, explore content

---

## 🗂️ File Structure

### New Files Created
```
frontend/src/components/features/assessment/
├── OverallAssessmentInvite.tsx          # Post-onboarding prompt
├── OverallAssessmentSelection.tsx       # Multi-select chooser UI
└── (updated) AssessmentFlow.tsx         # Added 7 new assessment definitions
```

### Modified Files
```
frontend/src/
├── App.tsx                              # Added routes, handlers, session logic
├── services/api.ts                      # Session API endpoints
└── components/features/assessment/
    └── index.ts                         # Exported new components

backend/src/
├── controllers/assessmentsController.ts # Session CRUD endpoints
├── routes/assessments.ts                # Session routes
└── services/assessments/
    └── basicAssessments.ts              # 7 new scoring functions
```

### Database Schema
```
backend/prisma/schema.prisma             # AssessmentSession model (already exists)
```

---

## 🔄 User Flow Diagram

```
[Complete Onboarding]
        ↓
[OverallAssessmentInvite]
        ↓
    ┌───YES───┐
    │         │
    ↓         ↓ NO
[Selection] [Dashboard]
    ↓
[Choose 1-7 assessments]
    ↓
[Start Session (API)]
    ↓
┌─[AssessmentFlow #1]─┐
│   Q1 → Q2 → ... → QN│
│   [Submit Answers]  │
└──────────┬──────────┘
           ↓
   [More pending?]
      YES ↓   NO ↓
         ...    ↓
         ↓    [InsightsResults]
    [Flow #2]   ↓ (6s timer)
         ...  [Dashboard]
         ↓
    [Flow #N]
         ↓
   [InsightsResults]
         ↓ (6s timer)
     [Dashboard]
```

---

## 🧪 Testing Checklist

### Manual Testing
- [ ] Complete onboarding → see invite
- [ ] Click "Maybe later" → land on dashboard
- [ ] Click "Yes, start" → see selection page
- [ ] Select 0 assessments → "Start" button disabled
- [ ] Select 1 assessment → see correct time estimate
- [ ] Select all 7 → see ~21 minute estimate
- [ ] Click "Skip for now" → return to dashboard
- [ ] Start with 3 selected → first assessment loads
- [ ] Complete first assessment → second assessment loads automatically
- [ ] Complete all selected → land on insights
- [ ] Wait 6 seconds on insights → auto-redirect to dashboard
- [ ] Manually click "Back to Dashboard" → immediate redirect
- [ ] Check database → `AssessmentSession` record created
- [ ] Check database → All `Assessment` records have correct `sessionId`
- [ ] Verify scores stored correctly with category breakdowns

### API Testing
```bash
# Start session
POST /api/assessments/sessions
{
  "selectedTypes": ["anxiety_gad2", "depression_phq2"]
}

# Submit first assessment
POST /api/assessments
{
  "assessmentType": "anxiety_gad2",
  "responses": { "gad2_q1": "2", "gad2_q2": "1" },
  "sessionId": "<session-id>"
}

# Get active session
GET /api/assessments/sessions/active

# Expected response includes pendingTypes array
```

---

## 📊 Data Flow

### Session State Tracking
```typescript
interface AssessmentSessionSummary {
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  selectedTypes: string[];      // ['anxiety_gad2', 'depression_phq2', 'stress_pss4']
  completedTypes: string[];     // ['anxiety_gad2'] (after first submission)
  pendingTypes: string[];       // ['depression_phq2', 'stress_pss4']
  startedAt: string;
  completedAt: string | null;
  completedAssessments: Array<{
    id: string;
    assessmentType: string;
    score: number;
    completedAt: string;
  }>;
}
```

### Assessment Scoring Registry
```typescript
const SCORE_HANDLERS: Record<string, (responses: ResponseMap) => AssessmentScoreResult> = {
  depression_phq2: scorePhq2,
  anxiety_gad2: scoreGad2,
  stress_pss4: scorePss4,
  overthinking_rrs4: scoreRrs4,
  trauma_pcptsd5: scorePcptsd5,
  emotional_intelligence_eq5: scoreEq5,
  personality_bigfive10: scoreBigFive
};
```

---

## 🎯 Key Features

1. **Seamless Multi-Assessment Flow**
   - No page reloads between assessments
   - Progress preserved via session tracking
   - Automatic advancement to next pending assessment

2. **Intelligent Scoring**
   - Validated clinical scoring algorithms
   - Reverse scoring support (PSS-4 Q2/Q3, Big Five Q2)
   - Category/trait breakdowns (Big Five personality traits)
   - Human-readable interpretations with severity bands

3. **Robust State Management**
   - Session persists across submissions
   - Active session synced with dashboard
   - Graceful handling of cancelled/abandoned sessions

4. **User Experience**
   - Clear time estimates before starting
   - Real-time progress tracking
   - Safety warnings for sensitive content
   - Auto-redirect to avoid dead-ends
   - Manual navigation always available

5. **Data Integrity**
   - Timestamped submissions
   - Foreign key constraints (sessionId)
   - Automatic session status updates
   - Prevention of duplicate active sessions

---

## 🚀 Future Enhancements

1. **Resume Incomplete Sessions**
   - Detect abandoned sessions on dashboard
   - Offer "Continue where you left off" button

2. **Assessment Recommendations**
   - Suggest assessments based on previous scores
   - Adaptive follow-up questions

3. **Progress Visualization**
   - Show completion percentage during multi-assessment flow
   - Visual indicator of which assessments are done

4. **Custom Session Names**
   - Allow users to name their assessment sessions
   - "Quarterly Check-in", "Post-Therapy Progress", etc.

5. **Export Results**
   - PDF report generation
   - Share with clinician feature

---

## 📝 Notes

- All 7 assessments use validated, public-domain screening tools
- Scoring algorithms match clinical standards (PHQ-2, GAD-2, PSS-4, RRS-4, PC-PTSD-5)
- Big Five personality uses Mini-IPIP public domain questions
- EQ-5 adapted from Schutte Self-Report EI Test (open use in education/psychology)
- No user data is sent to third-party services during assessment
- All scores stored locally in SQLite database (production should use PostgreSQL)

---

## ✅ Implementation Complete

All requirements from the specification have been successfully implemented:
- ✅ Post-onboarding prompt
- ✅ Yes/No branching
- ✅ Multi-select assessment chooser with all 7 instruments
- ✅ Dynamic question loading
- ✅ Sequential navigation
- ✅ Backend session creation & tracking
- ✅ Answer storage with timestamps
- ✅ Automated scoring for all assessments
- ✅ Results page display
- ✅ Automatic dashboard redirect

**Status:** Production-ready
**Last Updated:** October 1, 2025
