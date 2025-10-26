# AI Insights Generation - Troubleshooting Guide

## Issue Summary

The AI-generated assessment insights are showing fallback messages instead of personalized AI responses based on user assessments.

**Example Fallback Message:**
```
Depression: Mild depression Recent score moved down by 4 points. 
Suggested focus: Continue tracking your depression to build long-term awareness.
```

## Root Causes Identified

### 1. **Assessment Response Details Not Being Sent** ✅ FIXED
- **Problem**: The frontend wasn't sending detailed question/answer data to the backend
- **Impact**: AI had no context about what questions were answered or user responses
- **Solution**: Updated `AssessmentFlow.tsx` and `CombinedAssessmentFlow.tsx` to build and send `responseDetails` array

### 2. **AI Provider Configuration**
- **Status**: Gemini API keys are configured
- **Validation Needed**: Check if keys are valid and not placeholder values

### 3. **LLM Service Errors** (Most Likely)
- **Problem**: The LLM service may be failing silently
- **Impact**: Falls back to simple text-based summary
- **Debug**: Added comprehensive logging to trace the issue

## How AI Summary Generation Works

```typescript
// 1. Frontend collects detailed responses
const responseDetails = [
  {
    questionId: "depression_phq9_q1",
    questionText: "Little interest or pleasure in doing things",
    answerLabel: "Several days",
    answerValue: 1,
    answerScore: 1
  },
  // ... more responses
];

// 2. Backend builds detailed context
const detailedContext = [{
  assessmentType: "depression",
  completedAt: "2025-10-17T...",
  responses: responseDetails,
  rawScore: 8,
  maxScore: 27,
  score: 29.63
}];

// 3. AI service generates personalized summary
const aiSummary = await generateAISummary(
  summaries,        // Score trends
  userName,         // User's name
  detailedContext   // Full Q&A details
);
```

## Testing Steps

### 1. Check Backend Logs
After completing an assessment, check the backend terminal for:

```bash
[Assessment Submission] Building insights with detailed context: {
  userId: "...",
  assessmentType: "depression",
  hasResponseDetails: true,
  responseDetailsCount: 9,
  detailedContextCount: 1,
  sampleResponse: { questionId: "...", questionText: "...", ... }
}

[AI Summary] Generating AI summary with context: {
  userName: "User Name",
  assessmentCount: 1,
  hasDetailedAssessments: true,
  detailSectionsLength: 150,
  fullContextPreview: "User User Name has completed..."
}

[AI Summary] LLM response: {
  hasResponse: true,
  hasContent: true,
  contentPreview: "Your depression assessment shows...",
  isFallback: false
}
```

### 2. Verify API Keys

Check `.env` file in backend directory:

```bash
# Real Gemini keys should start with AIzaSy
GEMINI_API_KEY_1=AIzaSy...actual_key_here
GEMINI_API_KEY_2=AIzaSy...actual_key_here

# NOT placeholder values like:
# GEMINI_API_KEY_1=your_gemini_key_here  ❌
```

### 3. Test AI Provider Directly

Create a test file `backend/test-ai-generation.js`:

```javascript
const { llmService } = require('./dist/services/llmProvider');

async function testAI() {
  try {
    const response = await llmService.generateResponse([
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Say hello!' }
    ], {
      maxTokens: 50,
      temperature: 0.7
    });
    
    console.log('✅ AI Response:', response.content);
    console.log('✅ Provider:', response.provider);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAI();
```

Run: `node backend/test-ai-generation.js`

## Expected vs Actual Output

### ❌ Current (Fallback)
```
Depression: Mild depression Recent score moved down by 4 points. 
Suggested focus: Continue tracking your depression to build long-term awareness.
```

### ✅ Expected (AI-Generated)
```
Your depression assessment shows mild symptoms with a recent improvement of 4 points 
- that's encouraging progress! You mentioned feeling down several days and having 
trouble with sleep. Consider maintaining your current routines that are helping, 
and try adding a 10-minute morning walk or journaling practice. If symptoms persist 
or worsen, reaching out to a counselor could provide additional support.
```

## Quick Fix Checklist

- [x] 1. Updated frontend to send `responseDetails`
- [x] 2. Added comprehensive logging
- [ ] 3. Verify Gemini API keys are valid (not placeholders)
- [ ] 4. Test LLM service directly
- [ ] 5. Check backend console for error logs
- [ ] 6. Verify network connectivity to AI providers

## Common Issues

### Issue: "All AI providers failed"
**Solution**: Check API keys are valid and not placeholder values

### Issue: Silent fallback (no error logs)
**Solution**: The response might be triggering the fallback filter. Check logs for `isFallback: true`

### Issue: "Provider reported unavailable"
**Solution**: API quota exceeded or network issues. Try different provider in `.env`:
```bash
AI_PROVIDER_PRIORITY=gemini,openai,anthropic
```

## Next Steps

1. **Complete an assessment** with the updated frontend code
2. **Check backend terminal** for the new log messages
3. **Share the logs** to diagnose the exact issue:
   - `[Assessment Submission]` logs
   - `[AI Summary]` logs
   - Any error messages

## Files Modified

- ✅ `frontend/src/components/features/assessment/AssessmentFlow.tsx`
- ✅ `frontend/src/components/features/assessment/CombinedAssessmentFlow.tsx`
- ✅ `frontend/src/App.tsx`
- ✅ `backend/src/services/assessmentInsightsService.ts` (added logging)
- ✅ `backend/src/controllers/assessmentsController.ts` (added logging)

## Testing the Fix

1. Restart backend server: `npm run dev` in backend folder
2. Complete a **new assessment** (important: test with fresh data)
3. Check the insights page
4. Review backend console logs
5. Share screenshots if issue persists

---

**Need Help?** Share the backend console logs after completing an assessment!
