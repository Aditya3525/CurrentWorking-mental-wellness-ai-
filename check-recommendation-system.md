# Recommendation System End-to-End Verification Checklist

## 🔍 Pre-Flight Checks

### 1. Check if Backend Server is Running
```powershell
# Check port 5000
netstat -ano | findstr ":5000"

# If not running, start backend:
cd backend
npm run dev
```

### 2. Check if Frontend is Running
```powershell
# Check port 5173 (Vite default)
netstat -ano | findstr ":5173"

# If not running, start frontend:
cd frontend
npm run dev
```

### 3. Check Database Connection
```powershell
# Verify Prisma is configured
cd backend
npx prisma db push
npx prisma generate
```

---

## 🧪 Manual Testing Steps

### Step 1: Register/Login a Test User
**Endpoint:** `POST http://localhost:5000/api/auth/register`

```json
{
  "email": "test@example.com",
  "password": "Test123!",
  "name": "Test User",
  "approach": "hybrid"
}
```

**Expected:** Get `token` in response

---

### Step 2: Complete an Assessment (Create Focus Areas)
**Endpoint:** `POST http://localhost:5000/api/assessments/submit`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Body:**
```json
{
  "type": "anxiety",
  "responses": {
    "q1": 4,
    "q2": 4,
    "q3": 3,
    "q4": 4,
    "q5": 3,
    "q6": 2,
    "q7": 4
  }
}
```

**Expected:** High anxiety score (60+) → Creates "anxiety" focus area

---

### Step 3: Log a Mood Entry
**Endpoint:** `POST http://localhost:5000/api/mood/log`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Body:**
```json
{
  "mood": "anxious",
  "intensity": 8,
  "notes": "Feeling stressed and overwhelmed"
}
```

**Expected:** Success response → Adds "anxiety" and "stress" to focus areas

---

### Step 4: Chat with AI (Sentiment Analysis)
**Endpoint:** `POST http://localhost:5000/api/chat`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Body:**
```json
{
  "message": "I'm feeling really anxious and can't sleep. My mind won't stop racing.",
  "sessionId": "test-session-123"
}
```

**Expected:** 
- AI response
- Possibly includes `recommendations` object
- Sentiment analysis detects negative mood

---

### Step 5: **GET PERSONALIZED RECOMMENDATIONS** (Main Test!)
**Endpoint:** `GET http://localhost:5000/api/recommendations/personalized`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Query Params (optional):**
```
?timeOfDay=afternoon&availableTime=15&environment=work&immediateNeed=false
```

**Expected Response Structure:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "content-123",
        "title": "5-Minute Breathing Exercise",
        "description": "...",
        "type": "content",
        "contentType": "BREATHING_EXERCISE",
        "category": "Anxiety Relief",
        "approach": "western",
        "duration": 300,
        "difficulty": "Beginner",
        "focusAreas": ["anxiety", "stress-relief"],
        "url": "...",
        "reason": "Based on your recent anxiety scores",
        "source": "library",
        "priority": 9,
        "immediateRelief": true
      }
    ],
    "focusAreas": ["anxiety", "stress", "overall-wellbeing"],
    "rationale": "Personalized for anxiety, stress based on your recent assessments",
    "crisisLevel": "LOW",
    "immediateAction": false,
    "fallbackUsed": false
  },
  "meta": {
    "crisisDetection": {
      "level": "LOW",
      "confidence": 0.65,
      "immediateAction": false
    }
  }
}
```

---

### Step 6: Test Different Contexts

**Morning Context:**
```
GET /api/recommendations/personalized?timeOfDay=morning&availableTime=10
```
**Expected:** Morning-appropriate exercises, shorter duration

**Evening with Immediate Need:**
```
GET /api/recommendations/personalized?timeOfDay=evening&availableTime=30&immediateNeed=true
```
**Expected:** Immediate relief content prioritized, higher priority items

**Night:**
```
GET /api/recommendations/personalized?timeOfDay=night&availableTime=5
```
**Expected:** Sleep-related content, very short duration items

---

### Step 7: Engage with Content
**Endpoint:** `POST http://localhost:5000/api/content/{contentId}/engage`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Body:**
```json
{
  "completed": true,
  "timeSpent": 300,
  "rating": 5,
  "effectiveness": 9,
  "notes": "Really helped!"
}
```

**Expected:** Success → Influences future recommendations

---

### Step 8: Verify Engagement Impact
**Endpoint:** `GET http://localhost:5000/api/recommendations/personalized`

**Expected:** 
- Some items should have priority 7-8 (engagement-based)
- Reason text might mention "based on your positive engagement"
- Similar content to what you rated highly

---

## ✅ Success Criteria

### **The system is working end-to-end if:**

1. ✅ **Focus Areas Detected**
   - Response includes `focusAreas` array
   - Contains areas from assessments, mood, chat

2. ✅ **Crisis Detection Active**
   - Response includes `crisisLevel` and `meta.crisisDetection`
   - Appropriate to user's state (NONE, LOW, MODERATE, HIGH, CRITICAL)

3. ✅ **Personalized Items Returned**
   - Response includes 4-6 `items`
   - Each item has `reason` explaining why recommended
   - Items match user's `approach` preference (western/eastern/hybrid)

4. ✅ **Prioritization Working**
   - Items have `priority` field (1-10)
   - Immediate relief items have priority 9
   - Crisis items have priority 10
   - Items sorted by priority

5. ✅ **Context Awareness**
   - Duration matches `availableTime`
   - Recommendations change with `timeOfDay`
   - `immediateNeed` triggers immediate relief content

6. ✅ **Fallback Handling**
   - If no DB content, `fallbackUsed: true`
   - Still returns useful suggestions (breathing, grounding)

7. ✅ **Rationale Provided**
   - Response includes `rationale` string
   - Explains focus areas being addressed

8. ✅ **Engagement Integration**
   - After rating content highly, similar content appears
   - Priority 7-8 items appear after engagement
   - Completed content excluded from future recommendations

---

## 🐛 Common Issues & Fixes

### Issue: "No recommendations returned"
**Fix:** 
- Check if database has content/practices seeded
- Run: `cd backend && npm run seed`

### Issue: "Focus areas empty"
**Fix:**
- Complete at least one assessment
- Log at least one mood entry
- Send at least one chat message

### Issue: "Crisis level always NONE"
**Fix:**
- Use stronger negative language in chat
- Log lower mood scores (anxiety > 70)
- Multiple assessment completions with high scores

### Issue: "Fallback always used"
**Fix:**
- Seed database with content
- Check `isPublished: true` on content items
- Verify content has matching `approach` field

### Issue: "Engagement not affecting recommendations"
**Fix:**
- Ensure contentId in engagement matches actual content
- Rate multiple items to build history
- Wait for next recommendation call (engagement is historical)

---

## 🚀 Automated Test Script

Run the comprehensive test:

```powershell
# Make sure backend is running first!
cd "C:\Users\adity\Downloads\Mental Wellbeing AI App Overview"
node test-recommendation-system.js
```

This will:
1. Register a new test user
2. Complete assessment
3. Log mood
4. Send chat message
5. **Get personalized recommendations**
6. Test different contexts
7. Record engagement
8. Verify engagement impact
9. Generate full report

---

## 📊 What to Look For

### In the Response, Verify:

```javascript
// 1. Focus Areas Match User State
data.focusAreas.includes('anxiety') // ✅ If anxiety assessment completed

// 2. Crisis Detection Working
data.crisisLevel === 'LOW' || 'MODERATE' // ✅ Based on scores

// 3. Personalization Active
data.items[0].reason.includes('your recent') // ✅ Personalized reasons

// 4. Priorities Set
data.items[0].priority >= 6 // ✅ All items have priority

// 5. Immediate Relief Available
data.items.some(i => i.immediateRelief === true) // ✅ If needed

// 6. Source Attribution
data.items[0].source // 'library' | 'practice' | 'crisis' | 'fallback'

// 7. Metadata Complete
data.items[0].duration // ✅ Has duration
data.items[0].approach // ✅ Matches user preference
data.items[0].category // ✅ Has category
```

---

## 🎯 Expected Flow Visualization

```
User Activity → Data Collection → Analysis → Recommendation Generation → Response
     ↓               ↓                ↓              ↓                      ↓
Assessment      User context     Focus areas    Content fetch       Personalized
Mood log        Crisis check     derived        Priority sort         items
Chat msg        Sentiment        User prefs     Deduplication      + Rationale
Engagement      Recent history   Time context   Limit to 6         + Crisis info
```

---

## 📝 Test Checklist

- [ ] Backend running on port 5000
- [ ] Database seeded with content
- [ ] User registered and authenticated
- [ ] Assessment completed (creates focus)
- [ ] Mood logged (adds context)
- [ ] Chat message sent (sentiment)
- [ ] **Recommendations endpoint returns data**
- [ ] Focus areas present in response
- [ ] Crisis level detected
- [ ] Items have reasons and priorities
- [ ] Context params affect results
- [ ] Engagement can be recorded
- [ ] Future recommendations change after engagement

---

## 🎉 Success Indicators

If you see this in the response, **IT'S WORKING**:

```json
{
  "success": true,
  "data": {
    "items": [5-6 items with titles, reasons, priorities],
    "focusAreas": ["anxiety", "stress"],
    "rationale": "Personalized for...",
    "crisisLevel": "LOW" or higher,
    "immediateAction": false,
    "fallbackUsed": false
  },
  "meta": {
    "crisisDetection": {
      "level": "LOW",
      "confidence": 0.6+
    }
  }
}
```

**All of these working together = END-TO-END SUCCESS! 🎊**
