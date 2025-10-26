# Combined Assessment Flow Fix

## Problem Diagnosed

The combined assessment flow was failing with **400 Bad Request** error when trying to load assessment templates. The error message was:

```
No valid assessment types provided
```

### Root Cause

The frontend's `OverallAssessmentSelection` component was requesting basic assessment type IDs:
- `anxiety_gad2`
- `depression_phq2`
- `stress_pss4`
- `overthinking_rrs4`
- `trauma_pcptsd5`
- `emotional_intelligence_eq5`
- `personality_bigfive10`

However, these type IDs were **not recognized** by the backend's assessment template system:

1. They were missing from `VALID_ASSESSMENT_TYPES` array
2. They were missing from `TEMPLATE_TYPE_ALIASES` mapping

## Solution Implemented

### 1. Added Basic Assessment Types to Validation

**File:** `backend/src/controllers/assessmentsController.ts`

Updated `VALID_ASSESSMENT_TYPES` array to include all basic screening assessment types:

```typescript
const VALID_ASSESSMENT_TYPES = [
  ...ASSESSMENT_CATALOG.map(a => a.id),
  // ... existing legacy names ...
  // Basic assessment types (short screening versions)
  'anxiety_gad2',
  'depression_phq2',
  'stress_pss4',
  'overthinking_rrs4',
  'trauma_pcptsd5',
  'emotional_intelligence_eq5'
];
```

### 2. Added Template Type Mappings

Updated `TEMPLATE_TYPE_ALIASES` to map basic assessment IDs to their full assessment template equivalents:

```typescript
const TEMPLATE_TYPE_ALIASES: Record<string, TemplateBaseType> = {
  // ... existing mappings ...
  'anxiety_gad2': 'anxiety',           // GAD-2 → GAD-7 template
  'depression_phq2': 'depression',     // PHQ-2 → PHQ-9 template
  'stress_pss4': 'stress',             // PSS-4 → PSS-10 template
  'overthinking_rrs4': 'overthinking', // RRS-4 → PTQ template
  'trauma_pcptsd5': 'trauma',          // PC-PTSD-5 → PCL-5 template
  'emotional_intelligence_eq5': 'emotionalIntelligence', // EQ-5 → TEIQue template
  'personality_bigfive10': 'personality' // BigFive-10 → Mini-IPIP template
};
```

## How It Works

1. **Frontend requests** basic assessment templates (e.g., `anxiety_gad2`)
2. **Backend validates** the type ID against `VALID_ASSESSMENT_TYPES` ✅
3. **Backend resolves** the type to a base template (e.g., `anxiety_gad2` → `anxiety`)
4. **Backend fetches** the full assessment definition from database (GAD-7)
5. **Frontend receives** the full template but only uses the first N questions for basic screening

### Mapping Logic

| Basic Assessment ID | Maps To | Full Assessment | Question Count (Basic) |
|-------------------|---------|-----------------|----------------------|
| `anxiety_gad2` | `anxiety` | GAD-7 | 2 questions |
| `depression_phq2` | `depression` | PHQ-9 | 2 questions |
| `stress_pss4` | `stress` | PSS-10 | 4 questions |
| `overthinking_rrs4` | `overthinking` | PTQ | 4 questions |
| `trauma_pcptsd5` | `trauma` | PCL-5 | 5 questions |
| `emotional_intelligence_eq5` | `emotionalIntelligence` | TEIQue-SF | 5 questions |
| `personality_bigfive10` | `personality` | Mini-IPIP | 10 questions |

## Testing

After restarting the backend server:

1. Navigate to: `http://localhost:3000/assessments/combined`
2. Select desired basic assessments
3. Click "Start Combined Assessment"
4. **Expected Result:** Assessment templates load successfully, flow begins

## Next Steps

Now that the combined assessment flow is fixed, we can proceed to:

1. ✅ Test combined assessment completion
2. ✅ Verify AI insights generation with new `responseDetails` payload
3. ✅ Confirm deduplication prevents duplicate history entries
4. ✅ Validate AI generates personalized responses instead of fallback text

## Technical Notes

### Why Map to Full Templates?

The basic assessments are **short screening versions** of full clinical assessments:
- They use the **first N questions** from the full assessment
- They use **simplified scoring** (defined in `basicAssessments.ts`)
- They share the **same underlying construct** (anxiety, depression, etc.)

By mapping basic IDs to full templates, we:
- Reuse existing assessment definitions in database
- Avoid duplicating assessment content
- Maintain flexibility for frontend to select question subsets
- Keep scoring logic separate from template definitions

### Scoring Functions

The actual scoring for basic assessments is handled separately in `backend/src/services/assessments/basicAssessments.ts`:
- `scoreGad2()` - 2-question anxiety screening
- `scorePhq2()` - 2-question depression screening
- `scorePss4()` - 4-question stress screening
- `scoreRrs4()` - 4-question overthinking screening
- `scorePcptsd5()` - 5-question trauma screening
- `scoreEq5()` - 5-question EQ screening
- `scoreBigFive()` - 10-question personality screening

These functions receive only the responses for the basic questions and compute appropriate scores for the shorter assessments.
