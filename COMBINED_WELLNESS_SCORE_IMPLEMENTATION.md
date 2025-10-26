# Combined Wellness Score for Onboarding Assessment

## Overview
This implementation adds a **combined wellness score** feature for the onboarding "basic overall assessment". Instead of showing individual small assessment scores everywhere, the system now:

1. **Calculates a combined wellness score** from all onboarding assessments
2. **Displays this combined score prominently** on the results page and assessment list
3. **Shows individual assessment details** only on the results/insights page
4. **Persists the wellness score** to the database for future reference

---

## Changes Made

### 1. Backend Changes

#### **File**: `backend/src/controllers/assessmentsController.ts`

**Modified Function**: `submitCombinedAssessments`

**What Changed**:
- After generating insights from all assessments, the system now **saves the wellness score** to the database
- Uses `prisma.assessmentInsight.upsert()` to create or update the insight record
- Stores the combined wellness score along with AI summary and trend data

**Code Added** (after line ~703):
```typescript
// Save wellness score to database for combined onboarding assessment
const wellnessScoreValue = insightsPayload.insights.wellnessScore?.value ?? 0;
await prisma.assessmentInsight.upsert({
  where: { userId },
  create: {
    userId,
    summary: insightsPayload.insights.byType as Prisma.InputJsonValue,
    overallTrend: insightsPayload.insights.overallTrend,
    aiSummary: insightsPayload.insights.aiSummary,
    wellnessScore: wellnessScoreValue,
    updatedAt: new Date()
  },
  update: {
    summary: insightsPayload.insights.byType as Prisma.InputJsonValue,
    overallTrend: insightsPayload.insights.overallTrend,
    aiSummary: insightsPayload.insights.aiSummary,
    wellnessScore: wellnessScoreValue,
    updatedAt: new Date()
  }
});
```

**How Wellness Score is Calculated**:
The wellness score is automatically calculated by the `buildAssessmentInsights` service using the `calculateWellnessScore` function, which:
- Takes all assessment normalized scores
- Calculates the average
- Rounds to 1 decimal place
- Returns a value between 0-100

---

### 2. Frontend Changes

#### **File**: `frontend/src/components/features/assessment/InsightsResults.tsx`

**What Changed**:
Added a **prominent Combined Wellness Score card** at the top of the results page that:
- Shows a circular progress indicator with the wellness score
- Uses color coding:
  - **Green** (≥70): Good wellness
  - **Yellow** (50-69): Moderate wellness
  - **Red** (<50): Needs attention
- Displays descriptive badges explaining the score
- Only shows for onboarding assessments that have a wellness score

**Visual Design**:
```
┌─────────────────────────────────────────────────┐
│  ⭕ 75          Combined Wellness Score         │
│   /100                                          │
│                Your overall mental wellness     │
│                score based on your onboarding   │
│                assessment.                      │
│                                                 │
│                [Good wellness] [composite...]   │
└─────────────────────────────────────────────────┘
```

**Key Features**:
- Animated circular progress bar using SVG
- Responsive design (mobile-friendly)
- Gradient background for visual emphasis
- Placed before individual assessment breakdowns

#### **File**: `frontend/src/components/features/assessment/AssessmentList.tsx`

**What Changed**:
Updated the **Progress Overview section** to:
- Display the combined wellness score prominently if available
- Show it in a highlighted card above the individual assessment progress
- Clarify that individual progress is separate from the combined score

**New Layout**:
```
Progress Overview
┌─────────────────────────────────────────────────┐
│  Combined Wellness Score                    75  │
│  From your onboarding assessment           /100 │
├─────────────────────────────────────────────────┤
│  Individual Assessment Progress            65%  │
│  3 of 6 completed • 2 of 3 required done        │
│  ██████████░░░░░░                               │
└─────────────────────────────────────────────────┘
```

**Benefits**:
- Users see their overall wellness at a glance
- Combined score gets priority visual placement
- Individual assessment tracking still available below

---

## User Experience Flow

### Before Changes:
1. User completes onboarding assessments
2. Results page shows individual scores for each assessment
3. Assessment list shows individual assessment progress
4. No overall wellness metric visible

### After Changes:
1. ✅ User completes onboarding assessments
2. ✅ **Combined wellness score calculated** (e.g., 75/100)
3. ✅ Results page shows:
   - **Large circular progress with combined score** 
   - AI summary of overall wellbeing
   - Individual assessment breakdowns below
4. ✅ Assessment list shows:
   - **Combined wellness score in highlighted card**
   - Individual assessment progress below

---

## Technical Details

### Database Schema
The `AssessmentInsight` model already had the `wellnessScore` field:
```prisma
model AssessmentInsight {
  id            String   @id @default(cuid())
  userId        String   @unique
  summary       Json
  overallTrend  String
  aiSummary     String
  wellnessScore Float    @default(0) @map("wellness_score")
  updatedAt     DateTime
  createdAt     DateTime @default(now())
  user          User     @relation(...)
  @@map("assessment_insights")
}
```

### API Response Structure
The wellness score is returned in the API response:
```typescript
{
  success: true,
  data: {
    assessments: [...],
    session: {...},
    history: [...],
    insights: {
      byType: {...},
      aiSummary: "...",
      overallTrend: "improving",
      wellnessScore: {
        value: 75.3,
        method: "composite-average",
        updatedAt: "2025-10-02T..."
      },
      updatedAt: "2025-10-02T..."
    }
  }
}
```

### Frontend Type Definition
Already defined in `frontend/src/services/api.ts`:
```typescript
export interface AssessmentInsights {
  byType: Record<string, AssessmentTypeSummary>;
  aiSummary: string;
  overallTrend: AssessmentTrend | 'mixed';
  wellnessScore?: {
    value: number;
    method: string;
    updatedAt: string;
  };
  updatedAt: string;
}
```

---

## Color Coding System

### Wellness Score Interpretation:
- **70-100** (Green): Good overall wellness
  - Display: Green circle, "Good wellness" badge
  - Meaning: User is doing well across most metrics
  
- **50-69** (Yellow): Moderate wellness
  - Display: Yellow circle, "Moderate wellness" badge
  - Meaning: Some areas need attention
  
- **0-49** (Red): Needs attention
  - Display: Red circle, "Needs attention" badge
  - Meaning: Multiple areas require support

---

## Benefits of This Implementation

### 1. **Single Unified Metric**
   - Users get one clear number representing their overall mental wellness
   - Easier to track progress over time
   - Less overwhelming than multiple individual scores

### 2. **Prominent Display**
   - Combined score is the first thing users see on results page
   - Visual circular progress makes it engaging
   - Color coding provides instant feedback

### 3. **Contextual Information**
   - Individual assessment details still available for deeper insight
   - AI summary provides personalized interpretation
   - Trend indicators show improvement/decline

### 4. **Dashboard Integration**
   - Assessment list shows wellness score prominently
   - Users can see their score without navigating to full results
   - Motivates users to complete assessments

### 5. **Persistent Storage**
   - Score saved to database for future reference
   - Can be tracked over time as users retake assessments
   - Available for analytics and progress tracking features

---

## Testing Recommendations

### Test Scenario 1: New User Onboarding
1. Complete onboarding flow with multiple assessments selected
2. Navigate through combined assessment flow
3. Verify results page shows:
   - ✅ Combined wellness score card at top
   - ✅ Circular progress with correct color
   - ✅ "Good wellness" / "Moderate" / "Needs attention" badge
   - ✅ Individual assessment cards below

### Test Scenario 2: Assessment List View
1. Navigate to Assessments page
2. Verify progress overview shows:
   - ✅ Combined wellness score in highlighted card
   - ✅ "From your onboarding assessment" label
   - ✅ Individual assessment progress below

### Test Scenario 3: Score Calculation
1. Complete assessments with known scores
2. Verify wellness score = average of all scores
3. Example:
   - Depression: 60
   - Anxiety: 70
   - Stress: 80
   - **Expected Wellness Score**: 70

### Test Scenario 4: Database Persistence
1. Complete onboarding assessment
2. Refresh the page
3. Verify wellness score still displays correctly
4. Check database: `SELECT wellnessScore FROM assessment_insights WHERE userId = ?`

---

## Edge Cases Handled

1. **No Wellness Score Available**:
   - Wellness score card only shows if `insights.wellnessScore` exists
   - Gracefully hidden if user hasn't completed onboarding assessment

2. **Multiple Assessment Sessions**:
   - Each completed session updates the wellness score
   - Latest score always displayed
   - Historical tracking possible with session data

3. **Individual vs Combined Scores**:
   - Results page shows both combined and individual
   - Assessment list prioritizes combined score
   - Clear labeling prevents confusion

---

## Future Enhancements

### Potential Additions:
1. **Wellness Score Trends**:
   - Track score changes over time
   - Show improvement/decline graph
   - Compare scores across different time periods

2. **Score History**:
   - Display previous wellness scores
   - Show timeline of assessments
   - Celebrate improvements

3. **Personalized Recommendations**:
   - Suggest practices based on wellness score
   - Different recommendations for different score ranges
   - AI-generated action plans

4. **Goal Setting**:
   - Allow users to set target wellness score
   - Track progress toward goal
   - Send notifications when score improves

5. **Export/Share**:
   - Export wellness score report
   - Share with healthcare providers
   - Generate PDF summaries

---

## Files Modified Summary

### Backend:
- ✅ `backend/src/controllers/assessmentsController.ts`
  - Added wellness score database persistence in `submitCombinedAssessments`

### Frontend:
- ✅ `frontend/src/components/features/assessment/InsightsResults.tsx`
  - Added combined wellness score circular progress card
  - Color-coded display with badges
  
- ✅ `frontend/src/components/features/assessment/AssessmentList.tsx`
  - Added wellness score display in progress overview
  - Separated combined score from individual assessment progress

### No Schema Changes Required:
- Database schema already supported wellness score field
- API types already defined
- No migrations needed

---

## Conclusion

This implementation successfully creates a **unified wellness score experience** for onboarding assessments. Users now have:
- A single, easy-to-understand metric for their mental wellness
- Prominent visual display on results and assessment pages
- Individual assessment details still available for deeper insight
- Persistent storage for future tracking and analysis

The changes maintain backward compatibility while adding significant value to the user experience! 🎉
