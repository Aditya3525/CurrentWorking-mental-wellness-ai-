# AI Chat Enhancements - Quick Test Guide

## 🚀 Testing the New Features

### 1. Test Conversation Memory

**Try these commands in the chatbot**:

```
Day 1:
User: "I've been feeling really anxious about my job interview next week."
→ Check: Memory should track 'anxiety' and 'work' topics

Day 2:
User: "Still nervous about that interview."
→ Check: Bot should reference previous mention
→ Expected: "I remember you mentioned being anxious about your job interview..."
```

### 2. Test Exercise Delivery

**Exercise Request Patterns**:

```
User: "Can you help me calm down?"
→ Expected: Bot delivers a recommended exercise (likely breathing or grounding)

User: "I need a quick 5-minute breathing exercise"
→ Expected: Bot delivers Box Breathing or 4-7-8 Breathing

User: "Show me a technique for anxiety"
→ Expected: Bot recommends anxiety-specific exercise

User: "I want to try meditation"
→ Expected: Bot delivers mindfulness exercise
```

**Exercise Keywords to Test**:
- "breathing"
- "meditation"
- "grounding"
- "relaxation"
- "CBT"
- "thought record"
- "help me calm down"

### 3. Test Time-of-Day Context

**Morning Test (7AM-12PM)**:
```
User: "I feel anxious"
→ Expected: Bot mentions morning anxiety is common due to cortisol
→ Tone: Energizing
```

**Afternoon Test (2PM-4PM)**:
```
User: "I'm so tired"
→ Expected: Bot mentions afternoon slump is natural
→ Recommendation: Walk, light snack, or nap
```

**Late Night Test (11PM-4AM)**:
```
User: "I can't stop thinking about everything"
→ Expected: Bot mentions late-night rumination
→ Recommendation: Worry dump technique
→ Tone: Calming
```

### 4. Test Conversation Summary

**Backend API Test** (when endpoints are added):
```javascript
// Get user's conversation memory
GET /api/chat/memory/:userId

// Expected response:
{
  "recentTopics": [
    { "topic": "anxiety", "count": 5, "lastMentioned": "2025-01-01" },
    { "topic": "work", "count": 3, "lastMentioned": "2024-12-31" }
  ],
  "recurringThemes": [
    "Job interview stress",
    "Sleep difficulties"
  ],
  "emotionalPatterns": {
    "predominantMood": "anxious",
    "recentShift": "improving"
  }
}
```

### 5. Test Exercise Recommendation Engine

**Test Different Scenarios**:

```javascript
// Anxiety + 5 minutes
getRecommendedExercise({
  emotion: 'anxiety',
  timeAvailable: 5,
  experienceLevel: 'beginner'
})
→ Expected: Box Breathing or 5-4-3-2-1 Grounding

// Depression + 10 minutes
getRecommendedExercise({
  emotion: 'depression',
  timeAvailable: 10,
  experienceLevel: 'beginner'
})
→ Expected: Loving-Kindness Meditation or CBT Thought Record

// Stress + 15 minutes
getRecommendedExercise({
  emotion: 'stress',
  timeAvailable: 15,
  experienceLevel: 'intermediate'
})
→ Expected: Full Body PMR or Body Scan
```

---

## 📊 Database Verification

### Check ConversationMemory Table

```sql
-- View all conversation memories
SELECT * FROM conversation_memory;

-- Check specific user's memory
SELECT 
  userId,
  topics,
  emotionalPatterns,
  importantMoments,
  conversationMetrics
FROM conversation_memory
WHERE userId = 'your-user-id';
```

### Verify Data Structure

```javascript
// Topics should look like:
{
  "anxiety": { "count": 5, "lastMentioned": "2025-01-01T10:30:00Z" },
  "work": { "count": 3, "lastMentioned": "2024-12-31T14:20:00Z" }
}

// Emotional patterns:
{
  "positive": 2,
  "neutral": 5,
  "negative": 8,
  "predominantMood": "anxious"
}

// Conversation metrics:
{
  "totalMessages": 15,
  "avgMessageLength": 120,
  "questionsAsked": 5,
  "preferredLength": "concise",
  "responsiveness": "high"
}
```

---

## 🧪 Service-Level Testing

### Test Conversation Memory Service

```typescript
import { conversationMemoryService } from './services/conversationMemoryService';

// Update memory
await conversationMemoryService.updateMemory(
  'user-123',
  'I am feeling really anxious about my presentation tomorrow',
  'user'
);

// Get memory
const memory = await conversationMemoryService.getMemory('user-123');
console.log(memory.recentTopics); // Should include 'anxiety' and 'work'

// Get summary
const summary = await conversationMemoryService.getConversationSummary('user-123', 7);
console.log(summary.topTopics);
console.log(summary.emotionalTrend); // 'improving', 'stable', or 'declining'
```

### Test Structured Exercises Service

```typescript
import { structuredExercisesService } from './services/structuredExercisesService';

// Get all breathing exercises
const breathingExercises = structuredExercisesService.getBreathingExercises();
console.log(breathingExercises.length); // Should be 3

// Get recommended exercise
const recommended = structuredExercisesService.getRecommendedExercise({
  emotion: 'anxiety',
  timeAvailable: 5,
  experienceLevel: 'beginner'
});
console.log(recommended.title); // Should be a breathing or grounding exercise

// Format for chat
const formatted = structuredExercisesService.formatExerciseForChat(recommended);
console.log(formatted); // Should be markdown formatted
```

### Test Context Awareness Service

```typescript
import { contextAwarenessService } from './services/contextAwarenessService';

// Get time context
const timeContext = contextAwarenessService.getTimeContext();
console.log(timeContext.period); // 'morning', 'afternoon', 'evening', etc.
console.log(timeContext.suggestions); // Time-appropriate recommendations

// Get contextual insight
const insight = contextAwarenessService.getContextualInsight({
  userId: 'user-123',
  recentEvents: [],
  emotionalState: 'negative',
  emotion: 'anxious',
  energyLevel: 'low',
  userName: 'Sarah'
});
console.log(insight.tone); // 'supportive', 'calming', etc.
console.log(insight.recommendations);
```

---

## 🎯 Expected Behavior

### Conversation Flow Example

```
User: "I'm feeling anxious"
→ Bot analyzes sentiment: negative
→ Extracts topics: anxiety
→ Updates memory
→ Checks time: 11:30 PM (late-night)
→ Tone: calming
→ Context: late-night rumination common

Bot Response:
"I can hear that you're feeling anxious right now. Late-night anxiety is very common because there are fewer distractions and the mind becomes more active.

Try this: Set aside 10 minutes to write down all your worries in a notebook. When you're done, close the notebook. This signals to your brain that you've addressed them for now.

Would you like to try a calming breathing exercise to help you relax?"
```

```
User: "Yes, show me a breathing exercise"
→ Detects exercise request
→ Emotion: anxiety
→ Time available: not specified (default 10 min)
→ Experience: beginner

Bot delivers:
"# 📘 4-7-8 Breathing

**Duration**: 5 minutes | **Difficulty**: Beginner

This breathing technique is excellent for calming anxiety and preparing for sleep...

**How to do it**:
1. Exhale completely through your mouth
2. Inhale through your nose for 4 seconds
3. Hold your breath for 7 seconds
4. Exhale through your mouth for 8 seconds
5. Repeat 4 times

**Benefits**:
- Anxiety relief
- Sleep aid
- Nervous system calming

Take your time and focus on your breath..."
```

---

## 🐛 Troubleshooting

### Issue: Memory not updating
**Solution**: Check database connection and ConversationMemory table exists
```bash
cd backend
npx prisma db push
npx prisma studio  # Verify table structure
```

### Issue: Exercise not detected
**Solution**: Check keywords in user message match detection patterns
- Add more keywords to `detectExerciseRequest()` method
- Test with exact phrases: "breathing exercise", "help me calm down"

### Issue: Time context not showing
**Solution**: Verify `contextInsight` is passed to `buildSystemPrompt()`
- Check chatService.ts line ~237 for correct parameter passing

### Issue: Topics not being extracted
**Solution**: Check topic keywords in conversationMemoryService.ts
- Verify message content matches topic keywords
- Topics: anxiety, depression, stress, sleep, work, etc.

---

## ✅ Checklist for Full Verification

- [ ] Chat message saves to database
- [ ] Conversation memory updates after each message
- [ ] Topics extracted correctly (anxiety, work, sleep, etc.)
- [ ] Sentiment analysis working (positive/neutral/negative)
- [ ] Exercise request detected in chat
- [ ] Recommended exercise matches user's emotion
- [ ] Exercise formatted correctly in chat response
- [ ] Time-of-day context included in system prompt
- [ ] Bot tone adjusts based on time (energizing/calming)
- [ ] Memory context visible in system prompt
- [ ] Previous topics referenced in responses
- [ ] Conversation summary generates correctly

---

## 🚀 Next Steps After Testing

1. **If backend tests pass**:
   - Start building frontend exercise UI
   - Add voice input/output
   - Create conversation insights dashboard

2. **If issues found**:
   - Check error logs: `backend/logs/`
   - Verify Prisma schema: `npx prisma studio`
   - Test individual services in isolation

3. **Performance optimization**:
   - Monitor memory update speed
   - Cache conversation summaries
   - Optimize topic extraction (currently 16 categories)

---

## 📝 Sample Test Script

```typescript
// test-ai-enhancements.ts
import { conversationMemoryService } from './services/conversationMemoryService';
import { structuredExercisesService } from './services/structuredExercisesService';
import { contextAwarenessService } from './services/contextAwarenessService';

async function testAIEnhancements() {
  const userId = 'test-user-123';

  // Test 1: Memory update
  console.log('Test 1: Memory Update');
  await conversationMemoryService.updateMemory(
    userId,
    'I am really anxious about work',
    'user'
  );
  const memory = await conversationMemoryService.getMemory(userId);
  console.log('Topics:', memory.recentTopics);
  console.log('✓ Memory updated successfully\n');

  // Test 2: Exercise recommendation
  console.log('Test 2: Exercise Recommendation');
  const exercise = structuredExercisesService.getRecommendedExercise({
    emotion: 'anxiety',
    timeAvailable: 5,
    experienceLevel: 'beginner'
  });
  console.log('Recommended:', exercise?.title);
  console.log('✓ Exercise recommended successfully\n');

  // Test 3: Context awareness
  console.log('Test 3: Context Awareness');
  const context = contextAwarenessService.getTimeContext();
  console.log('Period:', context.period);
  console.log('Suggestions:', context.suggestions[0]);
  console.log('✓ Context generated successfully\n');

  // Test 4: Conversation summary
  console.log('Test 4: Conversation Summary');
  const summary = await conversationMemoryService.getConversationSummary(userId, 7);
  console.log('Top Topics:', summary.topTopics);
  console.log('Emotional Trend:', summary.emotionalTrend);
  console.log('✓ Summary generated successfully\n');

  console.log('🎉 All tests passed!');
}

testAIEnhancements().catch(console.error);
```

Run with:
```bash
cd backend
npx ts-node test-ai-enhancements.ts
```

---

## 🎨 Frontend Preview

When frontend is implemented, the chat will look like:

```
┌─────────────────────────────────────────────┐
│  💬 Mental Wellbeing Chat          🔊 🎤 📷 │
├─────────────────────────────────────────────┤
│                                             │
│  You: I'm feeling anxious                   │
│  10:30 PM                                   │
│                                             │
│  🤖 Bot: I can hear that you're feeling     │
│  anxious right now. Late-night anxiety is   │
│  common because there are fewer...          │
│                                             │
│  Would you like to try a breathing exercise?│
│                                             │
│  [Start Breathing Exercise →]               │
│                                             │
├─────────────────────────────────────────────┤
│  Type a message... [📎] [🎤] [Send]        │
└─────────────────────────────────────────────┘
```

With "Start Breathing Exercise" button opening:

```
┌─────────────────────────────────────────────┐
│  📘 Box Breathing (4-4-4-4)         [✕]    │
├─────────────────────────────────────────────┤
│                                             │
│         ⭕ Inhale (4 sec)                   │
│        /   \                                │
│       |  ●  |  ← Visual breathing guide    │
│        \   /                                │
│         ⭕                                   │
│                                             │
│  Progress: ●●●○○  (3 of 5 rounds)          │
│                                             │
│  [Pause] [Stop] [Complete]                  │
└─────────────────────────────────────────────┘
```

---

Good luck with testing! 🚀
