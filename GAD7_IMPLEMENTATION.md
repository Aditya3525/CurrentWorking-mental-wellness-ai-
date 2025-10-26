# GAD-7 Anxiety Assessment Implementation

## Overview
The Anxiety Assessment has been updated to use the **GAD-7 (Generalized Anxiety Disorder-7)** standardized clinical assessment tool. This replaces the previous 20-question custom anxiety assessment with a validated, public domain assessment widely used in clinical practice.

## What is GAD-7?

GAD-7 is a validated screening tool and severity measure for generalized anxiety disorder. It consists of 7 questions that assess anxiety symptoms over the past 2 weeks.

### Source
- **Public Domain** - Free to use without licensing restrictions
- Developed by Spitzer, Kroenke, Williams, and Löwe (2006)
- Validated for clinical and research use

## Assessment Details

### Questions (Past 2 weeks)
1. Feeling nervous, anxious, or on edge
2. Not being able to stop or control worrying
3. Worrying too much about different things
4. Trouble relaxing
5. Being so restless that it is hard to sit still
6. Becoming easily annoyed or irritable
7. Feeling afraid as if something awful might happen

### Response Options
Each question uses a 4-point Likert scale:
- **0** = Not at all
- **1** = Several days
- **2** = More than half the days
- **3** = Nearly every day

## Scoring Logic

### Raw Score Calculation
- Sum all item scores (range: 0-21)
- No reverse scoring required
- All questions weighted equally

### Score Interpretation
| Raw Score | Severity Level | Interpretation |
|-----------|---------------|----------------|
| 0-4 | **Minimal** | Minimal anxiety symptoms |
| 5-9 | **Mild** | Mild anxiety disorder |
| 10-14 | **Moderate** | Moderate anxiety disorder |
| 15-21 | **Severe** | Severe anxiety disorder |

### Clinical Cutoffs
- **≥10**: Moderate to severe anxiety (clinical intervention recommended)
- **≥15**: Severe anxiety (immediate clinical attention recommended)

## Implementation Changes

### Frontend Changes

#### File: `frontend/src/components/features/assessment/AssessmentFlow.tsx`

**Changes Made:**
1. Replaced 20-question anxiety assessment with 7-question GAD-7
2. Updated question IDs to `gad7_q1` through `gad7_q7`
3. Changed response options from 5-point (0-4) to 4-point (0-3) scale
4. Updated title to "Anxiety Assessment (GAD-7)"
5. Reduced estimated time from "6-8 minutes" to "2-3 minutes"
6. Removed category-based scoring (cognitive, physical, behavioral)
7. Implemented GAD-7 specific scoring logic with interpretation

**Scoring Logic:**
```typescript
if (assessment.scoringKey === 'anxiety_assessment') {
  // GAD-7 Scoring: Sum all items (0-21)
  // 0-4: Minimal, 5-9: Mild, 10-14: Moderate, 15-21: Severe
  assessment.questions.forEach((question) => {
    const answer = answers[question.id];
    if (answer !== undefined) {
      const option = question.options.find((opt) => opt.value === answer);
      if (option) {
        totalScore += option.score;
      }
    }
  });
  maxScore = 21; // GAD-7 max score is 21 (7 questions × 3 max score)
  
  // Add interpretation to category breakdown
  let interpretation = 'Minimal anxiety';
  if (totalScore >= 15) {
    interpretation = 'Severe anxiety';
  } else if (totalScore >= 10) {
    interpretation = 'Moderate anxiety';
  } else if (totalScore >= 5) {
    interpretation = 'Mild anxiety';
  }
  
  categoryBreakdown = {
    overall: {
      raw: totalScore,
      normalized: Math.round(((totalScore / maxScore) * 100) * 10) / 10,
      interpretation
    }
  };
}
```

### Backend Changes

#### File: `backend/src/controllers/assessmentsController.ts`

**Changes Made:**
- Updated ASSESSMENT_CATALOG:
  - Changed title from "Anxiety Assessment" to "Anxiety Assessment (GAD-7)"
  - Updated question count from 10 to 7

```typescript
const ASSESSMENT_CATALOG = [
  { id: 'anxiety', title: 'Anxiety Assessment (GAD-7)', questions: 7 },
  // ... other assessments
];
```

### Database Schema

The database already contains GAD-7 questions in the seed file:

#### File: `backend/src/prisma/seed.ts`

**Existing GAD-7 Definition:**
```typescript
const GAD7_BASE: BaseQuestion[] = [
  { key: 'gad7_q1', text: 'Feeling nervous, anxious, or on edge', responseType: 'scale', options: OPTIONS_0_TO_3 },
  { key: 'gad7_q2', text: 'Not being able to stop or control worrying', responseType: 'scale', options: OPTIONS_0_TO_3 },
  { key: 'gad7_q3', text: 'Worrying too much about different things', responseType: 'scale', options: OPTIONS_0_TO_3 },
  { key: 'gad7_q4', text: 'Trouble relaxing', responseType: 'scale', options: OPTIONS_0_TO_3 },
  { key: 'gad7_q5', text: 'Being so restless that it is hard to sit still', responseType: 'scale', options: OPTIONS_0_TO_3 },
  { key: 'gad7_q6', text: 'Becoming easily annoyed or irritable', responseType: 'scale', options: OPTIONS_0_TO_3 },
  { key: 'gad7_q7', text: 'Feeling afraid as if something awful might happen', responseType: 'scale', options: OPTIONS_0_TO_3 }
];
```

**Assessment Definition:**
```typescript
{
  id: 'gad7',
  name: 'GAD-7',
  type: 'Advanced',
  category: 'Anxiety',
  description: 'Generalized Anxiety Disorder 7-item assessment.',
  timeEstimate: '5 minutes',
  questions: buildQuestions(GAD7_BASE)
}
```

## Benefits of GAD-7

### Clinical Validity
- ✅ Extensively validated in clinical research
- ✅ Widely used in healthcare settings
- ✅ Reliable and consistent results
- ✅ Sensitive to change over time

### User Experience
- ✅ **Shorter**: 7 questions vs. 20 (65% reduction)
- ✅ **Faster**: 2-3 minutes vs. 6-8 minutes
- ✅ **Simpler**: Clear, concise questions
- ✅ **Standardized**: Comparable to clinical assessments

### Technical Benefits
- ✅ Public domain (no licensing issues)
- ✅ Clear scoring guidelines
- ✅ Established clinical cutoffs
- ✅ Better data interpretation

## Data Migration Considerations

### Existing User Data
Users who completed the old 20-question anxiety assessment will have:
- Different question IDs (`anxiety_q1-q20` vs `gad7_q1-q7`)
- Different scoring ranges (0-80 vs 0-21)
- Different category breakdowns

### Recommendations
1. **Keep historical data**: Preserve old assessment results for longitudinal tracking
2. **Mark assessment version**: Tag results with assessment type/version
3. **Normalize scores**: When comparing across versions, normalize to 0-100 scale
4. **Show interpretation**: Display severity level (Minimal/Mild/Moderate/Severe) rather than just numbers

## Testing Checklist

- [ ] Frontend renders 7 GAD-7 questions correctly
- [ ] Questions display in correct order
- [ ] Response options are 0-3 scale
- [ ] Score calculation sums to 0-21 range
- [ ] Interpretation displays correctly:
  - [ ] 0-4 shows "Minimal anxiety"
  - [ ] 5-9 shows "Mild anxiety"
  - [ ] 10-14 shows "Moderate anxiety"
  - [ ] 15-21 shows "Severe anxiety"
- [ ] Results save to database correctly
- [ ] Assessment appears in user history
- [ ] Progress tracking updates properly
- [ ] Wellness score incorporates GAD-7 results

## Usage Example

### Starting Assessment
```typescript
<AssessmentFlow 
  assessmentId="anxiety_assessment"
  onComplete={handleComplete}
  onNavigate={handleNavigate}
/>
```

### Example Scores
- **Score 3** (0+0+1+0+1+0+1): Minimal anxiety
- **Score 7** (1+1+1+1+1+1+1): Mild anxiety
- **Score 12** (2+2+2+2+1+1+2): Moderate anxiety
- **Score 18** (3+3+3+3+2+2+2): Severe anxiety

## References

1. Spitzer RL, Kroenke K, Williams JB, Löwe B. A brief measure for assessing generalized anxiety disorder: the GAD-7. Arch Intern Med. 2006;166(10):1092-1097.
2. GAD-7 is in the public domain. No permission required for use.

## Support

For questions or issues with the GAD-7 implementation, please contact the development team.

---

**Last Updated:** October 4, 2025
**Version:** 1.0
**Assessment Type:** Advanced - Anxiety (GAD-7)
