# Assessment Controller Fix - All Assessments Now Working

## Issue
Only depression assessment was working. All other assessments (anxiety, stress, trauma, overthinking, emotional intelligence, personality) were showing "Assessment '[type]' not found" error.

## Root Causes

### 1. Missing Anxiety Assessment Mapping
The `ASSESSMENT_TEMPLATE_MAP` was missing the `anxiety` type entirely.

### 2. Incorrect Definition IDs
The controller was looking for old definition IDs (`phq9`, `pss10`, etc.) but the database had new legacy IDs (`depression_phq9`, `stress_pss10`, etc.).

### 3. Incorrect Question ID Prefixes
All reverse scored items, trauma domains, and personality domains were using old unprefixed question IDs (e.g., `pss10_q4`) instead of the new prefixed IDs (e.g., `stress_pss10_pss10_q4`).

## Solution

### 1. Added Anxiety to Template Map
```typescript
type TemplateBaseType = 'anxiety' | 'stress' | ... 

const ASSESSMENT_TEMPLATE_MAP: Record<TemplateBaseType, { definitionId: string }> = {
  anxiety: { definitionId: 'anxiety_assessment' }, // ADDED
  stress: { definitionId: 'stress_pss10' },
  // ... updated all others to use legacy IDs
};
```

### 2. Added Anxiety Scoring Configuration
```typescript
anxiety: {
  minScore: 0,
  maxScore: 21, // GAD-7: 7 questions × 3 points max
  interpretationBands: [
    { max: 4, label: 'Minimal anxiety' },
    { max: 9, label: 'Mild anxiety' },
    { max: 14, label: 'Moderate anxiety' },
    { max: 21, label: 'Severe anxiety' }
  ],
  higherIsBetter: false
}
```

### 3. Updated All Definition IDs to Legacy Format
- `anxiety`: `anxiety_assessment`
- `stress`: `stress_pss10`
- `trauma`: `trauma_pcl5`
- `overthinking`: `overthinking_ptq`
- `emotionalIntelligence`: `emotional_intelligence_teique`
- `personality`: `personality_mini_ipip`
- `depression`: `depression_phq9`

### 4. Added Anxiety Aliases
```typescript
'anxiety_assessment': 'anxiety',
'anxiety': 'anxiety',
'gad7': 'anxiety',
'gad-7': 'anxiety',
'anxiety_gad7': 'anxiety',
```

### 5. Fixed All Question ID References
Updated all arrays to use prefixed question IDs matching the seed format:

**Stress (PSS-10) - Reverse Scored Items:**
- Old: `['pss10_q4', 'pss10_q5', ...]`
- New: `['stress_pss10_pss10_q4', 'stress_pss10_pss10_q5', ...]`

**Trauma (PCL-5) - Domain Items:**
- Old: `['pcl5_q1', 'pcl5_q2', ...]`
- New: `['trauma_pcl5_pcl5_q1', 'trauma_pcl5_pcl5_q2', ...]`

**Personality (Mini-IPIP) - Reverse Scored & Domain Items:**
- Old: `['mini_ipip_q3', 'mini_ipip_q4', ...]`
- New: `['personality_mini_ipip_mini_ipip_q3', 'personality_mini_ipip_mini_ipip_q4', ...]`

**Emotional Intelligence (TEIQue-SF) - Reverse Scored Items:**
- Old: `['teique_q2', 'teique_q4', ...]`
- New: `['emotional_intelligence_teique_teique_q2', 'emotional_intelligence_teique_teique_q4', ...]`

## Files Modified
- `backend/src/controllers/assessmentsController.ts`
  - Added `anxiety` to TemplateBaseType
  - Added anxiety assessment mapping
  - Added anxiety scoring configuration
  - Added anxiety aliases
  - Updated all definition IDs to legacy format
  - Fixed all question ID references with proper prefixes
  - Updated trauma domain definitions
  - Updated personality domain definitions
  - Updated all reverse scored item arrays

## Testing

Now all 7 assessments should work:

1. ✅ **Anxiety Assessment (GAD-7)** - `anxiety_assessment`
2. ✅ **Depression Assessment (PHQ-9)** - `depression_phq9`
3. ✅ **Stress Assessment (PSS-10)** - `stress_pss10`
4. ✅ **Emotional Intelligence (TEIQue-SF)** - `emotional_intelligence_teique`
5. ✅ **Overthinking (PTQ)** - `overthinking_ptq`
6. ✅ **Trauma & Fear Response (PCL-5)** - `trauma_pcl5`
7. ✅ **Personality (Mini-IPIP)** - `personality_mini_ipip`

### Test Steps:
1. Refresh browser (Ctrl+R)
2. Navigate to Assessments page
3. Click on each assessment
4. Verify it loads without errors
5. Complete an assessment to verify scoring works

## Why This Happened

The disconnect occurred because:
1. The seed file was updated to use legacy IDs for frontend compatibility
2. The controller wasn't updated to match the new database schema
3. Question IDs in the seed now have assessment ID prefixes (e.g., `anxiety_assessment_gad7_q1`)
4. But the controller was still looking for unprefixed IDs (e.g., `gad7_q1`)

## Prevention

To prevent this in the future:
1. Keep assessment ID mappings centralized and consistent
2. Document the relationship between frontend IDs, backend IDs, and database IDs
3. Use constants/enums shared between seed script and controller
4. Add integration tests that verify assessment loading
