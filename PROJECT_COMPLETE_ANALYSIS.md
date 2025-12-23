# MaanaSarathi - Complete Project Analysis & Workflow

**Generated on:** November 28, 2025  
**Project:** Mental Wellbeing AI Platform  
**Repository:** CurrentWorking-mental-wellness-ai-

---

## 📋 Executive Summary

**MaanaSarathi** is a comprehensive, enterprise-grade mental wellbeing AI platform that combines:
- Multi-provider AI chatbot with crisis detection
- Comprehensive mental health assessments (7+ types)
- Personalized wellness plans and content library
- Real-time mood tracking and progress analytics
- Admin dashboard for content management
- Multi-layered authentication (email/password + Google OAuth)

**Tech Stack:**
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Radix UI
- **Backend:** Node.js, Express, TypeScript, Prisma ORM
- **Database:** SQLite (dev), PostgreSQL/MySQL (production)
- **AI:** Multi-provider (Gemini, OpenAI, Anthropic, HuggingFace, Ollama)
- **State Management:** Zustand + React Query
- **Authentication:** JWT + Passport (Google OAuth)

---

## 🏗️ Project Architecture

### **Monorepo Structure**

```
MaanaSarathi/
├── frontend/               # React SPA (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── features/   # Feature-based components
│   │   │   │   ├── auth/
│   │   │   │   ├── assessment/
│   │   │   │   ├── chat/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── onboarding/
│   │   │   │   ├── plans/
│   │   │   │   ├── profile/
│   │   │   │   └── content/
│   │   │   ├── ui/         # Reusable UI components (Radix)
│   │   │   └── layout/     # Layout components
│   │   ├── contexts/       # React contexts
│   │   ├── services/       # API clients
│   │   ├── stores/         # Zustand stores
│   │   ├── hooks/          # Custom hooks (React Query)
│   │   └── types/          # TypeScript types
│   └── ...
├── backend/
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   │   ├── llmProvider.ts
│   │   │   ├── chatService.ts
│   │   │   ├── crisisDetectionService.ts
│   │   │   ├── assessmentInsightsService.ts
│   │   │   ├── recommendationService.ts
│   │   │   └── ...
│   │   ├── middleware/     # Auth, validation, errors
│   │   ├── config/         # Configuration
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utilities
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   └── ...
└── taxonomy/               # Assessment content data
```

---

## 🔄 Complete Application Workflow

### **Phase 1: User Authentication & Registration**

#### **A. New User Registration Flow**

1. **Landing Page** (`LandingPage.tsx`)
   - User clicks "Get Started" or "Sign Up"
   - Options: Email/Password OR Google OAuth

2. **Email/Password Registration**
   ```typescript
   // Frontend: App.tsx → signUp()
   POST /api/auth/register
   {
     name: string,
     email: string,
     password: string
   }
   
   // Backend: authController.register()
   - Validates input (Zod schema)
   - Checks for existing user
   - Hashes password (bcrypt)
   - Creates user in database
   - Generates JWT token
   - Returns user + token
   ```

3. **Google OAuth Flow**
   ```typescript
   // Frontend: startGoogleOAuth()
   window.location → /api/auth/google
   
   // Backend: Passport Google Strategy
   - Redirects to Google consent screen
   - Google returns user profile
   - Backend checks if user exists:
     - Existing: Login user
     - New: Create user with googleId
   - Generates JWT token
   - Redirects to frontend with token
   
   // Frontend: OAuthCallback.tsx
   - Extracts token from URL
   - Calls handleOAuthSuccess()
   - Stores token in localStorage
   - Routes based on user status:
     * New user → Password Setup
     * Incomplete onboarding → Onboarding
     * Complete → Dashboard
   ```

#### **B. Login Flow**

1. **User Login**
   ```typescript
   // Frontend: UserLoginPage.tsx → login()
   POST /api/auth/login
   {
     email: string,
     password: string
   }
   
   // Backend: authController.login()
   - Finds user by email
   - Validates password (bcrypt.compare)
   - Generates JWT token
   - Returns user + token
   
   // Frontend: stores user in Zustand + localStorage
   useAuthStore.setUser(user, token)
   ```

2. **Token Management**
   ```typescript
   // Token stored in:
   - localStorage: 'token'
   - Zustand store: authStore.token
   - HTTP headers: Authorization: Bearer <token>
   
   // Token validation:
   - Backend middleware: authenticate()
   - Checks JWT signature
   - Verifies user exists
   - Attaches user to req.user
   ```

---

### **Phase 2: Onboarding Process**

#### **Onboarding Flow** (`OnboardingFlow.tsx`)

**Step 1: Welcome & Introduction**
- Introduces the platform
- Explains the onboarding process
- Sets expectations

**Step 2: Therapeutic Approach Selection**
```typescript
// User chooses:
- Western (CBT, evidence-based)
- Eastern (mindfulness, meditation)
- Hybrid (combination)

// Stored in user profile
approach: 'western' | 'eastern' | 'hybrid'
```

**Step 3: Profile Information**
```typescript
// Collects:
{
  firstName: string,
  lastName: string,
  birthday: Date,
  gender: string,
  region: string,
  language: string
}
```

**Step 4: Emergency Contact**
```typescript
{
  emergencyContact: string,  // Name
  emergencyPhone: string     // Phone number
}
```

**Step 5: Consent & Preferences**
```typescript
{
  dataConsent: boolean,      // Data usage consent
  clinicianSharing: boolean  // Share with clinicians
}
```

**Step 6: Completion**
```typescript
// Frontend: completeOnboardingFlow()
PUT /api/users/:id/complete-onboarding
{
  approach: string,
  ...profileData
}

// Backend: userController.completeOnboarding()
- Updates user record
- Sets isOnboarded = true
- Returns updated user

// Frontend routes to:
→ Assessment Invite Screen
```

---

### **Phase 3: Mental Health Assessments**

#### **Assessment System Architecture**

**Available Assessments:**
1. **GAD-7** (Anxiety) - 7 questions
2. **PHQ-9** (Depression) - 9 questions
3. **PSS-10** (Stress) - 10 questions
4. **PCL-5** (Trauma/PTSD) - 5 questions
5. **PTQ** (Overthinking) - Rumination assessment
6. **TEIQue** (Emotional Intelligence) - EQ assessment
7. **Mini-IPIP** (Personality) - Big Five personality

#### **A. Single Assessment Flow**

```typescript
// User clicks "Take Assessment" on specific assessment

// 1. Start Assessment
startAssessment(assessmentId)

// 2. Frontend: AssessmentFlow.tsx
GET /api/assessments/definitions/:assessmentId

// Backend returns:
{
  questions: [
    {
      id: string,
      text: string,
      order: number,
      responseType: 'likert' | 'multiple_choice',
      options: [
        { text: string, value: number }
      ]
    }
  ]
}

// 3. User answers questions
// Frontend tracks responses in state

// 4. Submit Assessment
POST /api/assessments/submit
{
  assessmentType: string,
  responses: { [questionId]: answerValue },
  score: number,
  rawScore: number,
  maxScore: number,
  categoryBreakdown?: object
}

// Backend: assessmentsController.submitAssessment()
- Validates responses
- Calculates scores
- Stores in AssessmentResult table
- Updates AssessmentInsight (AI summary)
- Returns results

// 5. Show Results
→ Navigate to Insights page
```

#### **B. Combined Assessment Flow**

```typescript
// User clicks "Take Overall Wellness Check"

// 1. Assessment Selection Screen
<OverallAssessmentSelection />
// User selects multiple assessments (e.g., GAD-7 + PHQ-9 + PSS-10)

// 2. Create Assessment Session
POST /api/assessments/sessions/start
{
  selectedTypes: ['anxiety_gad7', 'depression_phq9', 'stress_pss10']
}

// Backend creates AssessmentSession:
{
  id: string,
  userId: string,
  selectedTypes: ['anxiety_gad7', ...],
  status: 'pending',
  pendingTypes: [...],
  completedTypes: []
}

// 3. Combined Assessment Flow
<CombinedAssessmentFlow 
  selectedTypes={['anxiety_gad7', ...]}
  sessionId={sessionId}
/>

// Loops through each assessment:
for each assessmentType in selectedTypes:
  - Display questions
  - Collect responses
  - Calculate score
  - Move to next

// 4. Submit All Assessments
POST /api/assessments/sessions/:sessionId/submit
{
  sessionId: string,
  assessments: [
    {
      assessmentType: 'anxiety_gad7',
      responses: {...},
      score: number,
      ...
    },
    ...
  ]
}

// Backend:
- Creates multiple AssessmentResult records
- Updates session status to 'completed'
- Generates combined AI insights
- Calculates overall wellness score (0-100)

// 5. Show Combined Insights
→ InsightsResults page with all scores
```

#### **C. Assessment Insights & AI Analysis**

```typescript
// After assessment submission:

// Backend: assessmentInsightsService.generateInsights()
- Retrieves all user assessments
- Groups by type
- Calculates trends (improving/declining)
- Generates AI summary using LLM:

const context = {
  assessments: [...],
  demographics: user profile,
  approach: user.approach
};

const aiSummary = await llmService.generateResponse([
  {
    role: 'system',
    content: 'You are a mental health insights generator...'
  },
  {
    role: 'user',
    content: `Generate insights for: ${JSON.stringify(context)}`
  }
]);

// Stores in AssessmentInsight table:
{
  userId: string,
  summary: {
    anxiety: { latestScore, trend, interpretation },
    depression: { ... },
    ...
  },
  overallTrend: 'improving' | 'stable' | 'declining',
  aiSummary: string (AI-generated personalized summary),
  wellnessScore: number (0-100)
}
```

---

### **Phase 4: Dashboard & User Experience**

#### **Dashboard Components** (`Dashboard.tsx`)

**1. Personalized Greeting**
```typescript
// Time-aware greeting
const hour = new Date().getHours();
const greeting = hour < 12 ? 'Good morning' : 
                 hour < 18 ? 'Good afternoon' : 
                 'Good evening';

// Profile completion meter
const completionScore = calculateCompletion({
  hasApproach: !!user.approach,
  hasEmergencyContact: !!user.emergencyContact,
  hasCompletedAssessment: assessmentHistory.length > 0,
  hasMoodEntries: moodHistory.length > 0
});
```

**2. Wellness Score Display**
```typescript
// From AssessmentInsight
const wellnessScore = assessmentInsights?.wellnessScore ?? 0;

// Visual representation:
<CircularProgress value={wellnessScore} />
// Color coding:
- 0-30: red (critical)
- 31-50: orange (needs attention)
- 51-70: yellow (moderate)
- 71-100: green (good)
```

**3. Quick Actions**
```typescript
<QuickActions>
  <ActionCard onClick={() => navigate('chatbot')}>
    Talk to AI Companion
  </ActionCard>
  <ActionCard onClick={() => navigate('assessments')}>
    Take Assessment
  </ActionCard>
  <ActionCard onClick={() => navigate('library')}>
    Explore Content
  </ActionCard>
  <ActionCard onClick={() => navigate('practices')}>
    Practice Exercises
  </ActionCard>
</QuickActions>
```

**4. Assessment Summary Cards**
```typescript
// Display latest scores for each assessment type
assessmentInsights?.byType.map(assessment => (
  <ScoreCard
    type={assessment.type}
    score={assessment.latestScore}
    trend={assessment.trend}
    interpretation={assessment.interpretation}
    onClick={() => viewAssessmentResults(assessment.type)}
  />
))
```

**5. Mood Check-In**
```typescript
// Quick mood logging
POST /api/mood/entries
{
  mood: 'Great' | 'Good' | 'Okay' | 'Struggling' | 'Anxious',
  notes?: string
}

// Backend: moodController.createMoodEntry()
- Creates MoodEntry record
- Updates mood history
- Triggers crisis detection if mood is 'Struggling'
```

---

### **Phase 5: AI Chatbot System**

#### **A. Chatbot Architecture**

**Multi-Layer AI System:**
1. **Crisis Detection** (Immediate, keyword-based)
2. **Context Awareness** (User profile, assessments, mood)
3. **Multi-Provider LLM** (Gemini → HuggingFace → OpenAI → Anthropic → Ollama)
4. **Conversation Memory** (Tracks patterns, topics, emotions)
5. **Structured Exercises** (Breathing, mindfulness, CBT)

#### **B. Chat Flow**

```typescript
// 1. User opens chatbot
<Chatbot user={user} />

// 2. Load conversation history
GET /api/conversations
// Returns list of user's conversations

GET /api/conversations/:conversationId/messages
// Returns messages for active conversation

// 3. User sends message
POST /api/chat/message
{
  content: string,
  conversationId?: string  // If continuing existing conversation
}

// Backend: chatController.sendMessage()

// STEP 1: CRISIS DETECTION (Immediate)
const hasCrisisKeywords = crisisDetectionService.detectCrisisLanguage(content);

if (hasCrisisKeywords) {
  // Immediate crisis response (no AI delay)
  return {
    content: "I'm very concerned about what you've shared. Your safety is the most important thing right now...",
    type: 'crisis',
    resources: [
      "988 Suicide & Crisis Lifeline",
      "Crisis Text Line: Text HELLO to 741741",
      ...
    ]
  };
}

// STEP 2: BUILD CONTEXT
const context = await contextAwarenessService.buildUserContext(userId);
// Context includes:
{
  demographics: user profile,
  approach: 'western' | 'eastern' | 'hybrid',
  assessmentScores: {
    anxiety: 45,
    depression: 60,
    stress: 55
  },
  recentMood: 'Struggling',
  conversationHistory: [last 10 messages],
  conversationMemory: {
    topics: ['work stress', 'sleep issues'],
    emotionalPatterns: ['anxiety peaks in evening'],
    copingStrategies: ['breathing exercises work well']
  }
}

// STEP 3: SENTIMENT ANALYSIS
const sentiment = analyzeSentiment(content);
// Returns:
{
  primary: {
    emotion: 'anxiety',
    confidence: 0.85,
    intensity: 7
  },
  tone: {
    urgency: 0.7,
    hopefulness: 0.3
  },
  indicators: {
    crisisRisk: 0.2
  }
}

// STEP 4: GENERATE SYSTEM PROMPT
const systemPrompt = buildSystemPrompt({
  context,
  sentiment,
  approach: user.approach
});

// Example system prompt:
`You are MaanaSarathi, a compassionate AI mental health companion.

USER CONTEXT:
- Name: ${user.firstName}
- Therapeutic Approach: ${user.approach}
- Current Wellness Score: ${wellnessScore}/100
- Recent Assessment Scores:
  * Anxiety (GAD-7): ${context.assessmentScores.anxiety} (Moderate)
  * Depression (PHQ-9): ${context.assessmentScores.depression} (Moderately Severe)
- Recent Mood: ${context.recentMood}
- Known Topics: ${context.conversationMemory.topics.join(', ')}

RESPONSE GUIDELINES:
- Use ${user.approach === 'western' ? 'CBT techniques' : 'mindfulness practices'}
- Keep responses under 150 words
- Provide actionable suggestions
- Validate emotions
- Offer structured exercises when appropriate

CURRENT SENTIMENT: ${sentiment.primary.emotion} (intensity: ${sentiment.primary.intensity}/10)
`

// STEP 5: CALL LLM SERVICE
const aiResponse = await llmService.generateResponse(
  [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage }
  ],
  {
    maxTokens: 150,
    temperature: 0.7
  },
  context
);

// LLM Provider Failover:
// 1. Try Gemini (ultra-fast, 2s response)
// 2. If fails, try HuggingFace (psychology-focused model)
// 3. If fails, try OpenAI
// 4. If fails, try Anthropic
// 5. If fails, try Ollama (local fallback)

// STEP 6: POST-PROCESS RESPONSE
// Check for exercise recommendations
if (shouldOfferExercise(sentiment, context)) {
  const exercise = structuredExercisesService.getExercise({
    type: sentiment.primary.emotion === 'anxiety' ? 'breathing' : 'mindfulness',
    approach: user.approach,
    duration: 5
  });
  
  aiResponse.content += `\n\n${formatExercise(exercise)}`;
}

// STEP 7: SAVE TO DATABASE
// Save user message
await prisma.chatMessage.create({
  conversationId,
  userId,
  content: userMessage,
  type: 'user'
});

// Save AI response
await prisma.chatMessage.create({
  conversationId,
  userId,
  content: aiResponse.content,
  type: 'bot',
  metadata: JSON.stringify({
    provider: aiResponse.provider,
    sentiment,
    exerciseOffered: !!exercise
  })
});

// STEP 8: UPDATE CONVERSATION MEMORY
await conversationMemoryService.updateMemory(userId, {
  message: userMessage,
  response: aiResponse.content,
  sentiment,
  topics: extractTopics(userMessage)
});

// Return to frontend
return {
  content: aiResponse.content,
  type: 'bot',
  conversationId,
  provider: aiResponse.provider
};
```

#### **C. Advanced Chatbot Features**

**1. Conversation Management**
```typescript
// Create new conversation
POST /api/conversations
// Auto-generates title from first messages

// Archive conversation
PUT /api/conversations/:id/archive

// Delete conversation
DELETE /api/conversations/:id

// Export conversation
GET /api/conversations/:id/export
// Returns PDF or JSON
```

**2. Smart Reply Suggestions**
```typescript
// Backend generates contextual quick replies
GET /api/chat/smart-replies?conversationId=xxx

// Based on:
- Last bot message
- User's emotional state
- Common response patterns

// Returns:
{
  suggestions: [
    "Tell me more about breathing exercises",
    "I'm feeling better now",
    "What else can help with anxiety?"
  ]
}
```

**3. Voice Features**
```typescript
// Speech-to-text (frontend)
const recognition = new webkitSpeechRecognition();
recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript;
  sendMessage(transcript);
};

// Text-to-speech (frontend)
const utterance = new SpeechSynthesisUtterance(botMessage);
window.speechSynthesis.speak(utterance);
```

**4. Proactive Check-ins**
```typescript
// Backend scheduled job (cron)
// Runs daily at 9 AM

// Identifies users who:
- Haven't chatted in 3+ days
- Have high crisis risk scores
- Showed declining mood trends

// Sends notification/email:
"Hi [Name], we noticed you haven't checked in recently. 
How are you feeling today?"
```

---

### **Phase 6: Personalized Wellness Plans**

#### **Plan System** (`PersonalizedPlan.tsx`)

```typescript
// 1. Fetch personalized plan modules
GET /api/plans/modules?approach=${user.approach}

// Backend: plansController.getPersonalizedModules()
// Filters modules by:
- User's therapeutic approach
- Assessment scores (prioritizes areas of concern)
- Completion status

// Returns modules sorted by:
1. Incomplete modules
2. Recommended based on assessment scores
3. User's approach preference

// 2. Display modules
{
  id: string,
  title: string,
  type: 'therapy' | 'meditation' | 'yoga' | 'education',
  duration: '15 minutes',
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced',
  description: string,
  content: {
    steps: [],
    exercises: [],
    techniques: []
  },
  approach: 'western' | 'eastern' | 'hybrid',
  userProgress: {
    completed: boolean,
    progress: number (0-100)
  }
}

// 3. Start module
PUT /api/plans/modules/:moduleId/start

// 4. Track progress
PUT /api/plans/modules/:moduleId/progress
{
  progress: number (0-100),
  notes?: string
}

// 5. Complete module
PUT /api/plans/modules/:moduleId/complete
{
  completed: true,
  notes?: string
}
```

---

### **Phase 7: Content Library & Practices**

#### **A. Content Library** (`ContentLibrary.tsx`)

```typescript
// 1. Fetch published content
GET /api/public-content?category=anxiety&approach=western

// Content types:
- VIDEO
- AUDIO_MEDITATION
- BREATHING_EXERCISE
- ARTICLE
- STORY
- JOURNAL_PROMPT
- CBT_WORKSHEET
- YOGA_SEQUENCE
- MINDFULNESS_EXERCISE
- PSYCHOEDUCATION
- CRISIS_RESOURCE

// 2. Display content cards
<ContentCard
  title={content.title}
  type={content.contentType}
  duration={content.duration}
  difficulty={content.intensityLevel}
  thumbnailUrl={content.thumbnailUrl}
  onClick={() => openContent(content.id)}
/>

// 3. View content
<ContentViewer content={content}>
  {content.type === 'VIDEO' && (
    <VideoPlayer url={content.youtubeUrl || content.content} />
  )}
  {content.type === 'AUDIO_MEDITATION' && (
    <AudioPlayer url={content.content} />
  )}
  {content.type === 'ARTICLE' && (
    <ArticleRenderer content={content.content} />
  )}
</ContentViewer>

// 4. Track engagement
POST /api/content/:id/engage
{
  completed: boolean,
  timeSpent: number (seconds),
  moodBefore: string,
  moodAfter: string,
  rating: number (1-5),
  effectiveness: number (1-10)
}

// Backend creates ContentEngagement record
```

#### **B. Practices** (`Practices.tsx`)

```typescript
// 1. Fetch practices
GET /api/practices?type=meditation&approach=eastern

// Practice categories:
- MEDITATION
- YOGA
- BREATHING
- MINDFULNESS
- JOURNALING
- CBT_TECHNIQUE
- GROUNDING_EXERCISE
- SELF_REFLECTION
- MOVEMENT
- SLEEP_HYGIENE

// 2. Display practice cards
<PracticeCard
  title={practice.title}
  category={practice.category}
  duration={practice.duration}
  difficulty={practice.intensityLevel}
  format={practice.format} // 'Audio' | 'Video' | 'Audio/Video'
  onClick={() => startPractice(practice.id)}
/>

// 3. Start practice
<PracticePlayer practice={practice}>
  {practice.format.includes('Audio') && (
    <AudioPlayer url={practice.audioUrl} />
  )}
  {practice.format.includes('Video') && (
    <VideoPlayer url={practice.videoUrl || practice.youtubeUrl} />
  )}
  <InstructionsPanel>
    <Steps steps={JSON.parse(practice.steps)} />
  </InstructionsPanel>
</PracticePlayer>

// 4. Complete practice
// (Same engagement tracking as content)
```

---

### **Phase 8: Progress Tracking & Analytics**

#### **Progress Features**

**1. Mood Calendar**
```typescript
// GET /api/mood/entries?startDate=xxx&endDate=xxx

<MoodCalendar>
  {moodEntries.map(entry => (
    <DayCell
      date={entry.createdAt}
      mood={entry.mood}
      color={getMoodColor(entry.mood)}
    />
  ))}
</MoodCalendar>

// Mood color coding:
- Great: green
- Good: light-green
- Okay: yellow
- Struggling: orange
- Anxious: red
```

**2. Assessment Trends**
```typescript
// GET /api/assessments/history

<TrendChart>
  <Line
    data={anxietyScoresOverTime}
    color="blue"
    label="Anxiety (GAD-7)"
  />
  <Line
    data={depressionScoresOverTime}
    color="purple"
    label="Depression (PHQ-9)"
  />
  <Line
    data={stressScoresOverTime}
    color="orange"
    label="Stress (PSS-10)"
  />
</TrendChart>
```

**3. Progress Metrics**
```typescript
// POST /api/progress/tracking
{
  metric: 'sleep' | 'anxiety' | 'mood' | 'stress' | 'exercise',
  value: number,
  notes?: string
}

// GET /api/progress/tracking?metric=sleep

<MetricChart
  title="Sleep Quality"
  data={sleepData}
  targetValue={8}
/>
```

**4. Wellness Score Evolution**
```typescript
// Calculated from:
- Assessment scores (weighted)
- Mood trends
- Engagement consistency
- Plan module completion
- Crisis episodes (negative weight)

// Formula:
wellnessScore = (
  (100 - anxietyScore * 0.3) +
  (100 - depressionScore * 0.3) +
  (100 - stressScore * 0.2) +
  (moodAverage * 0.1) +
  (engagementBonus * 0.1)
) / 5
```

---

### **Phase 9: Admin Dashboard**

#### **Admin System Architecture**

**Admin Authentication:**
```typescript
// 1. Admin login
POST /api/admin/auth/login
{
  email: string, // Must be in ADMIN_EMAILS env var
  password: string
}

// Backend:
- Checks if email in admin allowlist (process.env.ADMIN_EMAILS)
- Validates password
- Creates admin session (not JWT)
- Uses express-session for persistence

// 2. Admin session middleware
requireAdmin() {
  if (!req.session.admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
```

#### **Admin Dashboard Features** (`AdminDashboard.tsx`)

**1. Content Management**
```typescript
// Upload content
POST /api/admin/content/upload
Content-Type: multipart/form-data
{
  file: File,
  title: string,
  type: ContentType,
  category: string,
  approach: string,
  description: string,
  tags: string[]
}

// Backend:
- Uploads file to /uploads/media/
- Extracts metadata (duration, dimensions)
- Creates Content record with isPublished = false

// Publish content
PUT /api/admin/content/:id/publish

// Unpublish content
PUT /api/admin/content/:id/unpublish

// Update content
PUT /api/admin/content/:id
{
  title: string,
  description: string,
  tags: string[],
  ...
}

// Delete content
DELETE /api/admin/content/:id
```

**2. Practice Management**
```typescript
// Similar CRUD operations for practices
POST /api/admin/practices/upload
PUT /api/admin/practices/:id
PUT /api/admin/practices/:id/publish
DELETE /api/admin/practices/:id
```

**3. Assessment Management**
```typescript
// View all user assessments
GET /api/admin-data/assessments

// View user details
GET /api/admin-data/users/:id

// View system analytics
GET /api/admin-data/analytics
// Returns:
{
  totalUsers: number,
  activeUsers: number,
  totalAssessments: number,
  totalConversations: number,
  avgWellnessScore: number,
  crisisAlerts: number
}
```

**4. YouTube Integration**
```typescript
// Admin can fetch video metadata
POST /api/admin/content/youtube/metadata
{
  url: string // YouTube URL
}

// Backend:
- Uses YOUTUBE_API_KEY
- Fetches video title, duration, thumbnail
- Pre-fills content form
```

**5. Activity Logging**
```typescript
// All admin actions logged in ActivityLog table
{
  adminEmail: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'PUBLISH' | 'UNPUBLISH',
  entityType: 'CONTENT' | 'PRACTICE' | 'ASSESSMENT' | 'USER',
  entityId: string,
  entityName: string,
  details: JSON,
  ipAddress: string,
  createdAt: Date
}

// View activity logs
GET /api/admin-data/activity-logs
```

---

## 🔧 Technical Implementation Details

### **1. Database Schema (Prisma)**

**Key Models:**

```prisma
// User model
model User {
  id                String   @id @default(cuid())
  email             String   @unique
  name              String
  password          String?
  googleId          String?  @unique
  isOnboarded       Boolean  @default(false)
  approach          String?  // 'western' | 'eastern' | 'hybrid'
  
  // Relations
  assessments       AssessmentResult[]
  moodEntries       MoodEntry[]
  conversations     Conversation[]
  chatMessages      ChatMessage[]
  conversationMemory ConversationMemory?
  progressTracking  ProgressTracking[]
  assessmentInsight AssessmentInsight?
}

// Assessment result
model AssessmentResult {
  id              String   @id @default(cuid())
  userId          String
  assessmentType  String
  score           Float
  responses       String   // JSON
  categoryScores  Json?
  completedAt     DateTime @default(now())
  
  user    User @relation(fields: [userId], references: [id])
  
  @@index([userId, assessmentType])
  @@index([completedAt])
}

// Assessment insights (AI-generated)
model AssessmentInsight {
  id            String   @id @default(cuid())
  userId        String   @unique
  summary       Json     // By-type summaries
  overallTrend  String
  aiSummary     String   // AI-generated text
  wellnessScore Float    @default(0)
  updatedAt     DateTime
  
  user User @relation(fields: [userId], references: [id])
}

// Conversation
model Conversation {
  id            String   @id @default(cuid())
  userId        String
  title         String?
  isArchived    Boolean  @default(false)
  lastMessageAt DateTime @default(now())
  
  user     User          @relation(fields: [userId], references: [id])
  messages ChatMessage[]
  
  @@index([userId, lastMessageAt])
}

// Chat message
model ChatMessage {
  id             String   @id @default(cuid())
  conversationId String
  userId         String
  content        String
  type           String   // 'user' | 'bot' | 'system'
  metadata       String?  // JSON
  createdAt      DateTime @default(now())
  
  conversation Conversation @relation(fields: [conversationId], references: [id])
  user         User         @relation(fields: [userId], references: [id])
  
  @@index([conversationId, createdAt])
}

// Conversation memory (AI context)
model ConversationMemory {
  id                  String   @id @default(cuid())
  userId              String   @unique
  topics              String   @default("{}") // JSON
  emotionalPatterns   String   @default("{}") // JSON
  importantMoments    String   @default("[]") // JSON
  conversationMetrics String   @default("{}") // JSON
  updatedAt           DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id])
}

// Content
model Content {
  id              String      @id @default(cuid())
  title           String
  contentType     ContentType?
  category        String
  approach        String
  content         String      // URL or text
  duration        Int?        // seconds
  intensityLevel  DifficultyLevel?
  tags            String
  isPublished     Boolean     @default(false)
  
  engagements ContentEngagement[]
  
  @@index([isPublished])
}

// Practice
model Practice {
  id             String           @id @default(cuid())
  title          String
  category       PracticeCategory?
  duration       Int              // minutes
  intensityLevel DifficultyLevel?
  approach       String
  format         String           // 'Audio' | 'Video' | 'Audio/Video'
  audioUrl       String?
  videoUrl       String?
  isPublished    Boolean          @default(false)
  
  @@index([isPublished])
}

// 40+ strategic indexes for performance
```

### **2. API Routes Structure**

```typescript
// Public routes (no auth)
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/google
GET    /api/auth/google/callback
GET    /api/practices
GET    /api/public-content

// Protected routes (JWT auth)
GET    /api/users/me
PUT    /api/users/:id/complete-onboarding
GET    /api/assessments/definitions
POST   /api/assessments/submit
GET    /api/assessments/history
GET    /api/assessments/insights
POST   /api/chat/message
GET    /api/conversations
GET    /api/conversations/:id/messages
POST   /api/mood/entries
GET    /api/mood/entries
GET    /api/plans/modules
PUT    /api/plans/modules/:id/progress
POST   /api/content/:id/engage
GET    /api/progress/tracking

// Admin routes (session auth)
POST   /api/admin/auth/login
POST   /api/admin/content/upload
PUT    /api/admin/content/:id/publish
DELETE /api/admin/content/:id
GET    /api/admin-data/users
GET    /api/admin-data/analytics

// Health check routes
GET    /health
GET    /health/ready
GET    /api/chat/ai/health
GET    /api/chat/ai/test
```

### **3. State Management Strategy**

**Zustand Stores:**

```typescript
// Auth Store (authStore.ts)
{
  user: User | null,
  token: string | null,
  isAuthenticated: boolean,
  setUser: (user, token) => void,
  logout: () => void,
  updateUser: (updates) => void
}
// Persisted to localStorage

// Notifications Store (notificationStore.ts)
{
  notifications: Notification[],
  addNotification: (notification) => void,
  removeNotification: (id) => void,
  markAsRead: (id) => void
}

// App State Store (appStore.ts)
{
  sidebarOpen: boolean,
  theme: 'light' | 'dark',
  toggleSidebar: () => void,
  setTheme: (theme) => void
}
```

**React Query Hooks:**

```typescript
// useAssessments.ts
export function useAssessmentHistory(options?) {
  return useQuery({
    queryKey: ['assessments', 'history'],
    queryFn: assessmentsApi.getHistory,
    enabled: options?.enabled
  });
}

// useMood.ts
export function useMoodEntries(dateRange) {
  return useQuery({
    queryKey: ['mood', dateRange],
    queryFn: () => moodApi.getEntries(dateRange)
  });
}

// useChat.ts
export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: conversationsApi.getAll
  });
}

export function useSendMessage() {
  return useMutation({
    mutationFn: chatApi.sendMessage,
    onSuccess: () => {
      queryClient.invalidateQueries(['conversations']);
    }
  });
}
```

### **4. LLM Provider System**

**Provider Architecture:**

```typescript
// llmProvider.ts
class LLMService {
  private providers: Map<AIProviderType, AIProvider> = new Map();
  private providerPriority: AIProviderType[] = [
    'gemini',        // Priority 1: Ultra-fast (2s response)
    'huggingface',   // Priority 2: Psychology-focused
    'openai',        // Priority 3: Reliable
    'anthropic',     // Priority 4: Complex reasoning
    'ollama'         // Priority 5: Local fallback
  ];
  
  async generateResponse(messages, config, context) {
    // Try providers in priority order
    for (const providerType of this.providerPriority) {
      try {
        // Check cooldown
        if (this.isProviderCoolingDown(providerType)) {
          continue;
        }
        
        const provider = this.providers.get(providerType);
        const response = await provider.generateResponse(messages, config, context);
        
        // Success - mark provider as working
        this.markProviderSuccess(providerType);
        return response;
        
      } catch (error) {
        // Record failure
        this.recordProviderFailure(providerType, error);
        
        // Try next provider
        continue;
      }
    }
    
    throw new Error('All AI providers failed');
  }
  
  // Cooldown logic: After 10 failures, pause provider for 3 minutes
  private recordProviderFailure(providerType, error) {
    const state = this.providerState.get(providerType);
    state.failureCount++;
    
    if (state.failureCount >= 10) {
      state.cooldownUntil = Date.now() + 180000; // 3 min
    }
  }
}
```

**Provider Implementations:**

```typescript
// GeminiProvider.ts
class GeminiProvider implements AIProvider {
  async generateResponse(messages, config, context) {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-thinking-exp'
    });
    
    const result = await model.generateContent({
      contents: this.formatMessages(messages),
      generationConfig: {
        maxOutputTokens: config.maxTokens,
        temperature: config.temperature
      }
    });
    
    return {
      content: result.response.text(),
      provider: 'Gemini',
      model: this.config.model
    };
  }
}

// Similar implementations for:
- OpenAIProvider (gpt-4o-mini)
- AnthropicProvider (claude-3-5-sonnet)
- HuggingFaceProvider (Guilherme34/Psychologist-3b)
- OllamaProvider (llama3)
```

### **5. Crisis Detection System**

**Multi-Layer Detection:**

```typescript
// crisisDetectionService.ts
async detectCrisisLevel(userId, context) {
  // Layer 1: Chat content (keyword-based, immediate)
  const chatAnalysis = this.analyzeChatContent(context.recentMessages);
  // Patterns: suicide, self-harm, hopeless, etc.
  
  // Layer 2: Assessment scores
  const assessmentAnalysis = this.analyzeAssessmentScores(context.assessments);
  // PHQ-9 >= 80/100 → HIGH
  // GAD-7 >= 75/100 → MODERATE
  
  // Layer 3: Mood trajectory
  const moodAnalysis = this.analyzeMoodTrajectory(context.moodHistory);
  // 5+ days of 'Struggling' → MODERATE
  
  // Layer 4: Engagement patterns
  const engagementAnalysis = this.analyzeEngagementPatterns(context.engagementHistory);
  // Low completion + low effectiveness → LOW
  
  // Combine all layers
  const maxLevel = this.compareLevel([
    chatAnalysis.level,
    assessmentAnalysis.level,
    moodAnalysis.level,
    engagementAnalysis.level
  ]);
  
  if (maxLevel === 'CRITICAL' || maxLevel === 'HIGH') {
    // Log alert
    logger.warn({ userId, level: maxLevel }, 'CRISIS ALERT');
    
    // Could trigger:
    // - Notification to admin
    // - Email to emergency contact
    // - SMS alert
  }
  
  return {
    level: maxLevel,
    confidence: ...,
    indicators: [...],
    recommendations: [...],
    immediateAction: maxLevel >= 'HIGH'
  };
}
```

---

## 🚀 Deployment Workflow

### **Development**

```powershell
# 1. Setup
npm run setup
# Installs deps, generates Prisma client, runs migrations

# 2. Configure environment
# Edit backend/.env with API keys

# 3. Seed demo data
cd backend
npm run seed

# 4. Run dev servers
npm run dev
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

### **Production (Render/Railway/Vercel)**

**Backend (Render/Railway):**
```yaml
# render.yaml
services:
  - type: web
    name: maanasarathi-backend
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: DATABASE_URL
        sync: false  # Add in Render dashboard
      - key: JWT_SECRET
        generateValue: true
      - key: NODE_ENV
        value: production
      # ... all other env vars
```

**Frontend (Vercel):**
```json
// vercel.json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "env": {
    "VITE_API_URL": "https://api.maanasarathi.com/api"
  }
}
```

**Database Migration:**
```powershell
# Production database setup
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

---

## 📊 Key Metrics & Monitoring

### **Application Metrics**

1. **User Engagement**
   - Daily active users
   - Assessment completion rate
   - Chat message volume
   - Content/practice engagement

2. **AI Performance**
   - Response times by provider
   - Provider failover frequency
   - Token usage (cost tracking)
   - Error rates

3. **Mental Health Metrics**
   - Average wellness scores
   - Crisis alert frequency
   - Assessment score trends
   - Mood distribution

4. **System Health**
   - API response times
   - Database query performance
   - Provider availability
   - Error rates

### **Logging Strategy**

```typescript
// Structured logging with Pino
logger.info({
  event: 'chat_message',
  userId: user.id,
  conversationId: conversation.id,
  provider: 'gemini',
  responseTime: 1850,
  tokens: 127
}, 'Chat message processed');

// Crisis alerts
logger.warn({
  event: 'crisis_detected',
  userId: user.id,
  level: 'HIGH',
  indicators: ['hopeless', 'severe depression'],
  actionTaken: 'emergency_resources_provided'
}, 'CRISIS ALERT');

// Provider failures
logger.error({
  event: 'provider_failure',
  provider: 'openai',
  error: error.message,
  statusCode: 429,
  fallback: 'anthropic'
}, 'Provider failed, falling back');
```

---

## 🔐 Security Considerations

1. **Authentication**
   - JWT tokens with 7-day expiry
   - Bcrypt password hashing (10 rounds)
   - Rate limiting (100 req/15min)
   - CORS configuration
   - Secure cookies (httpOnly, sameSite)

2. **Data Protection**
   - User consent tracking
   - Data encryption at rest (database)
   - Secure file uploads (validated, sanitized)
   - Admin allowlist (email-based)

3. **API Security**
   - Input validation (Zod schemas)
   - SQL injection prevention (Prisma ORM)
   - XSS protection (content sanitization)
   - CSRF protection (session tokens)

4. **Sensitive Data**
   - Crisis conversations flagged
   - Emergency contacts encrypted
   - Assessment responses anonymized for analytics
   - Admin activity logged

---

## 🎯 Future Enhancements

1. **Enhanced AI Features**
   - Voice-first interactions
   - Multi-language support
   - Video therapy sessions
   - Group therapy rooms

2. **Advanced Analytics**
   - Predictive crisis modeling
   - Longitudinal wellness tracking
   - Cohort analysis
   - A/B testing framework

3. **Integrations**
   - Wearable device data (Fitbit, Apple Health)
   - Calendar integration (therapy appointments)
   - Insurance claim support
   - Provider network integration

4. **Mobile App**
   - React Native implementation
   - Push notifications
   - Offline mode
   - Biometric authentication

5. **Premium Features**
   - Subscription tiers (Stripe)
   - 1-on-1 therapist matching
   - Unlimited AI conversations
   - Advanced analytics dashboard

---

## 📚 Developer Quick Reference

### **Common Commands**

```powershell
# Root workspace
npm run dev              # Run full stack
npm run build            # Build both apps
npm run test             # Run all tests
npm run lint             # Lint both apps
npm run typecheck        # Type check both apps

# Backend
cd backend
npm run dev              # Run backend dev server
npm run db:studio        # Open Prisma Studio
npm run db:migrate       # Run migrations
npm run seed             # Seed demo data
npm run test:ai          # Test AI providers

# Frontend
cd frontend
npm run dev              # Run frontend dev server
npm run build            # Build for production
npm run preview          # Preview production build
```

### **Troubleshooting**

**1. AI Provider Not Working**
```powershell
# Test providers
cd backend
npm run test:ai

# Check health
curl http://localhost:5000/api/chat/ai/health
```

**2. Database Issues**
```powershell
# Reset database
cd backend
npm run db:reset

# Reseed data
npm run seed
```

**3. Authentication Issues**
```powershell
# Check JWT secret is set
echo $env:JWT_SECRET

# Clear localStorage in browser
localStorage.clear()
```

---

## 📖 Conclusion

**MaanaSarathi** is a production-ready, enterprise-grade mental wellbeing platform with:

✅ **Comprehensive Features:** Assessments, AI chat, personalized plans, content library  
✅ **Advanced AI:** Multi-provider system with crisis detection and context awareness  
✅ **Scalable Architecture:** Monorepo, TypeScript, modern state management  
✅ **Security First:** JWT auth, data encryption, admin controls  
✅ **Production Ready:** Error handling, logging, monitoring, deployment guides  

**Total Lines of Code:** ~50,000+  
**Backend Routes:** 40+  
**Frontend Components:** 100+  
**Database Tables:** 20+  
**AI Providers:** 5  

---

*This document provides a complete technical overview and workflow guide for the MaanaSarathi platform. For specific implementation details, refer to the codebase and inline documentation.*
