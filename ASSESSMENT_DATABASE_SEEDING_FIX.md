# Assessment Database Seeding Fix

## Issue
After database reset, assessments weren't loading in the frontend. Error message: "Assessment 'anxiety_assessment' not found".

## Root Cause
The seed script was creating assessments with modern IDs (e.g., `gad7`, `phq9`, `ptq`) but the frontend code was still looking for legacy IDs (e.g., `anxiety_assessment`, `depression_phq9`, `overthinking_ptq`).

## Solution
Updated the seed script to include **both legacy and modern assessment IDs** to ensure backward compatibility:

### Legacy IDs Added (for frontend compatibility):
- `anxiety_assessment` → GAD-7
- `depression_phq9` → PHQ-9
- `stress_pss10` → PSS-10
- `emotional_intelligence_teique` → TEIQue-SF
- `overthinking_ptq` → PTQ
- `trauma_pcl5` → PCL-5
- `personality_mini_ipip` → Mini-IPIP

### Modern IDs Retained:
- Short forms: `phq2`, `gad2`, `pss4`, `rrs4`, `pc_ptsd_5`, `eq5`, `big_five_short`
- Full forms: `phq9`, `gad7`, `pss10`, `ptq`, `pcl5`, `mini_ipip`, `teique_sf`

### Key Fix
Each assessment definition now uses unique question IDs by passing the assessment ID as a prefix to `buildQuestions()`:

```typescript
{
  id: 'anxiety_assessment',
  questions: buildQuestions(GAD7_BASE, 1, 'anxiety_assessment') // Unique IDs
},
{
  id: 'gad7',
  questions: buildQuestions(GAD7_BASE, 1, 'gad7') // Different unique IDs
}
```

This prevents "Unique constraint failed on question_id" errors while allowing the same question content to be used in multiple assessment definitions.

## Files Modified
- `backend/src/prisma/seed.ts` - Added legacy assessment definitions with unique question ID prefixes

## Seeding Process
```powershell
cd backend
npm run seed
```

## Result
✅ Database now contains all assessment definitions  
✅ Frontend can find assessments by legacy IDs  
✅ Modern assessment IDs also available  
✅ No duplicate question ID conflicts  

## Testing
1. Navigate to Assessments page
2. All assessments should now load without errors:
   - Anxiety Assessment (GAD-7) ✅
   - Depression Assessment (PHQ-9) ✅
   - Stress Assessment (PSS-10) ✅
   - Emotional Intelligence (TEIQue-SF) ✅
   - Overthinking (PTQ) ✅
   - Trauma & Fear Response (PCL-5) ✅
   - Personality (Mini-IPIP) ✅

## Next Steps
- Consider updating frontend to use modern assessment IDs consistently
- Or keep legacy IDs for backward compatibility with existing user data
- Document assessment ID mapping in API documentation
