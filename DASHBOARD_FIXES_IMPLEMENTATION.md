# 🔧 Dashboard Fixes - Ready to Implement

This document contains **copy-paste ready code** for all critical dashboard fixes.

---

## 🚨 Critical Fix #1: User Profile API (15 minutes)

### **File:** `backend/src/routes/users.ts`

**Current Issue:** `GET /api/users/:userId` returns 404

**Add this route:**

```typescript
// Add to existing users.ts file, after other routes
router.get('/:userId', authenticate as any, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // Verify user is requesting their own profile (security)
    if (req.user?.id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to access this profile'
      });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        profilePhoto: true,
        isOnboarded: true,
        approach: true,
        birthday: true,
        gender: true,
        region: true,
        emergencyContact: true,
        emergencyPhone: true,
        dataConsent: true,
        clinicianSharing: true,
        isPremium: true,
        createdAt: true,
        updatedAt: true,
        // Exclude sensitive fields like password hash
      }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile'
    });
  }
});
```

**Test:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/users/YOUR_USER_ID
```

---

## 🚨 Critical Fix #2: Personalized Plan API (20 minutes)

### **Step 1: Create file** `backend/src/routes/plans.ts`

```typescript
import express, { Request, Response } from 'express';
import { authenticate } from '../middleware/auth';

const router = express.Router();

interface Module {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  approach: string[];
}

// Generate personalized modules based on user preferences
function generatePersonalizedModules(
  approach: string | null,
  assessmentScores?: any
): Module[] {
  const baseModules: Module[] = [
    {
      id: 'breathing-basics',
      title: 'Breathing Basics',
      description: '5-minute calm breathing technique',
      category: 'Relaxation',
      duration: 5,
      difficulty: 'beginner',
      approach: ['western', 'eastern', 'hybrid']
    },
    {
      id: 'body-scan',
      title: 'Body Scan Meditation',
      description: 'Full-body awareness practice',
      category: 'Mindfulness',
      duration: 15,
      difficulty: 'beginner',
      approach: ['eastern', 'hybrid']
    },
    {
      id: 'thought-tracking',
      title: 'CBT Thought Tracking',
      description: 'Identify and reframe negative thoughts',
      category: 'CBT',
      duration: 10,
      difficulty: 'intermediate',
      approach: ['western', 'hybrid']
    },
    {
      id: 'progressive-relaxation',
      title: 'Progressive Muscle Relaxation',
      description: 'Release physical tension systematically',
      category: 'Relaxation',
      duration: 12,
      difficulty: 'beginner',
      approach: ['western', 'eastern', 'hybrid']
    },
    {
      id: 'mindful-walking',
      title: 'Mindful Walking',
      description: 'Walking meditation practice',
      category: 'Movement',
      duration: 20,
      difficulty: 'beginner',
      approach: ['eastern', 'hybrid']
    },
    {
      id: 'journaling',
      title: 'Reflective Journaling',
      description: 'Process emotions through writing',
      category: 'Self-Reflection',
      duration: 15,
      difficulty: 'beginner',
      approach: ['western', 'hybrid']
    }
  ];
  
  // Filter modules based on user's approach
  let filtered = baseModules;
  if (approach) {
    filtered = baseModules.filter(module => 
      module.approach.includes(approach)
    );
  }
  
  // Prioritize based on assessment scores (if available)
  if (assessmentScores) {
    // If anxiety is high, prioritize relaxation
    if (assessmentScores.anxiety > 60) {
      filtered = filtered.sort((a, b) => {
        if (a.category === 'Relaxation') return -1;
        if (b.category === 'Relaxation') return 1;
        return 0;
      });
    }
    
    // If stress is high, prioritize mindfulness
    if (assessmentScores.stress > 60) {
      filtered = filtered.sort((a, b) => {
        if (a.category === 'Mindfulness') return -1;
        if (b.category === 'Mindfulness') return 1;
        return 0;
      });
    }
  }
  
  return filtered;
}

// GET /api/plans/:userId
router.get('/:userId', authenticate as any, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // Verify authorization
    if (req.user?.id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }
    
    // Get user to check their approach preference
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        approach: true,
        assessmentScores: true
      }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const modules = generatePersonalizedModules(
      user.approach,
      user.assessmentScores
    );
    
    res.json({
      success: true,
      data: {
        modules,
        approach: user.approach,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error generating personalized plan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate personalized plan'
    });
  }
});

export default router;
```

### **Step 2: Register route in** `backend/src/server.ts`

Add this line with other route imports:
```typescript
import plansRoutes from './routes/plans';
```

Add this line with other route registrations:
```typescript
app.use('/api/plans', plansRoutes);
```

**Test:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/plans/YOUR_USER_ID
```

---

## 🚨 Critical Fix #3: Streak Tracking API (25 minutes)

### **Create file:** `backend/src/routes/streak.ts`

```typescript
import express, { Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = express.Router();

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalCheckIns: number;
  thisWeekCheckIns: number;
  lastCheckInDate: string | null;
}

// Calculate streak from mood entries
function calculateStreak(moodEntries: any[]): { current: number; longest: number } {
  if (moodEntries.length === 0) {
    return { current: 0, longest: 0 };
  }
  
  // Sort by date descending
  const sorted = moodEntries.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let lastDate: Date | null = null;
  
  for (const entry of sorted) {
    const entryDate = new Date(entry.timestamp);
    entryDate.setHours(0, 0, 0, 0); // Normalize to start of day
    
    if (!lastDate) {
      // First entry
      tempStreak = 1;
      currentStreak = 1;
      lastDate = entryDate;
    } else {
      const daysDiff = Math.floor(
        (lastDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysDiff === 1) {
        // Consecutive day
        tempStreak++;
        if (lastDate.getTime() === new Date().setHours(0, 0, 0, 0)) {
          currentStreak = tempStreak;
        }
      } else if (daysDiff > 1) {
        // Streak broken
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
      // daysDiff === 0 means same day, don't increment
      
      lastDate = entryDate;
    }
    
    longestStreak = Math.max(longestStreak, tempStreak);
  }
  
  return { current: currentStreak, longest: longestStreak };
}

// Get check-ins from this week
function getThisWeekCount(moodEntries: any[]): number {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
  startOfWeek.setHours(0, 0, 0, 0);
  
  return moodEntries.filter(entry => 
    new Date(entry.timestamp) >= startOfWeek
  ).length;
}

// GET /api/streak/:userId
router.get('/:userId', authenticate as any, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // Verify authorization
    if (req.user?.id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }
    
    // Get all mood entries for user
    const moodEntries = await prisma.mood.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' }
    });
    
    const streak = calculateStreak(moodEntries);
    const thisWeekCount = getThisWeekCount(moodEntries);
    
    const streakData: StreakData = {
      currentStreak: streak.current,
      longestStreak: streak.longest,
      totalCheckIns: moodEntries.length,
      thisWeekCheckIns: thisWeekCount,
      lastCheckInDate: moodEntries[0]?.timestamp || null
    };
    
    res.json({
      success: true,
      data: streakData
    });
  } catch (error) {
    console.error('Error calculating streak:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate streak'
    });
  }
});

export default router;
```

### **Register in** `backend/src/server.ts`:

```typescript
import streakRoutes from './routes/streak';
// ...
app.use('/api/streak', streakRoutes);
```

---

## 📦 Database Seeding (10 minutes)

### **Create file:** `backend/prisma/seed-content.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');
  
  // Seed public content
  console.log('📄 Seeding public content...');
  const contentItems = await prisma.publicContent.createMany({
    data: [
      {
        title: "Understanding Anxiety Basics",
        type: "article",
        category: "Anxiety",
        description: "Core concepts about anxiety and how to approach it.",
        content: "Anxiety is a natural response to stress...",
        url: "/content/anxiety-basics"
      },
      {
        title: "Guided Body Scan Meditation",
        type: "audio",
        category: "Relaxation",
        description: "Full-body awareness practice for grounding and calm.",
        duration: 15,
        url: "/audio/body-scan.mp3"
      },
      {
        title: "Mindful Minute Video",
        type: "video",
        category: "Mindfulness",
        description: "A one-minute reset to center your thoughts.",
        duration: 1,
        url: "/video/mindful-minute.mp4"
      },
      {
        title: "CBT Thought Tracking Worksheet",
        type: "article",
        category: "CBT",
        description: "Learn to identify and challenge cognitive distortions.",
        content: "Cognitive Behavioral Therapy teaches us...",
        url: "/content/cbt-worksheet"
      },
      {
        title: "Sleep Hygiene Guide",
        type: "article",
        category: "Sleep",
        description: "Practical tips for better sleep quality.",
        content: "Good sleep hygiene involves...",
        url: "/content/sleep-hygiene"
      }
    ],
    skipDuplicates: true
  });
  console.log(`✅ Created ${contentItems.count} content items`);
  
  // Seed practices
  console.log('🧘 Seeding practices...');
  const practices = await prisma.practice.createMany({
    data: [
      {
        title: "Calm Breathing Intro",
        description: "4-7-8 breathing technique for instant calm",
        duration: 5,
        category: "Breathing",
        difficulty: "beginner",
        instructions: "Breathe in for 4 counts, hold for 7, exhale for 8. Repeat 4 times.",
        approach: "hybrid"
      },
      {
        title: "Evening Sleep Preparation",
        description: "Wind down ritual for better sleep",
        duration: 10,
        category: "Sleep",
        difficulty: "beginner",
        instructions: "Progressive muscle relaxation starting from toes to head.",
        approach: "western"
      },
      {
        title: "Morning Yoga Flow",
        description: "Energizing gentle yoga sequence",
        duration: 15,
        category: "Movement",
        difficulty: "intermediate",
        instructions: "Sun salutations followed by standing poses and stretches.",
        approach: "eastern"
      },
      {
        title: "Mindful Walking",
        description: "Walking meditation practice",
        duration: 20,
        category: "Mindfulness",
        difficulty: "beginner",
        instructions: "Focus on each step, breath, and bodily sensation as you walk slowly.",
        approach: "eastern"
      },
      {
        title: "Loving-Kindness Meditation",
        description: "Cultivate compassion for self and others",
        duration: 12,
        category: "Meditation",
        difficulty: "intermediate",
        instructions: "Repeat phrases: May I be happy, may I be healthy, may I be safe...",
        approach: "eastern"
      }
    ],
    skipDuplicates: true
  });
  console.log(`✅ Created ${practices.count} practices`);
  
  console.log('🎉 Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Run:**
```bash
cd backend
npx ts-node prisma/seed-content.ts
```

---

## 🔧 Frontend Data Integration

### **Replace Mock Data in Dashboard.tsx**

**Location:** `frontend/src/components/features/dashboard/Dashboard.tsx`

**Replace lines 120-175 with:**

```typescript
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<{
    moodEntries: MoodEntry[];
    wellnessData: WellnessDataPoint[];
    streakData: StreakData | null;
  }>({
    moodEntries: [],
    wellnessData: [],
    streakData: null
  });

  // Transform progress entries to wellness data points
  const transformProgressToWellness = (progressEntries: any[]): WellnessDataPoint[] => {
    return progressEntries.map(entry => ({
      date: new Date(entry.timestamp).toISOString().split('T')[0],
      score: entry.value // Adjust based on your progress data structure
    }));
  };

  // Load all dashboard data
  useEffect(() => {
    async function loadDashboardData() {
      if (!user?.id) return;
      
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      try {
        const [moodRes, progressRes, streakRes] = await Promise.all([
          fetch(`/api/mood/${user.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`/api/progress/${user.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`/api/streak/${user.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);
        
        const [moodData, progressData, streakData] = await Promise.all([
          moodRes.json(),
          progressRes.json(),
          streakRes.json()
        ]);
        
        setDashboardData({
          moodEntries: moodData.data || [],
          wellnessData: transformProgressToWellness(progressData.data || []),
          streakData: streakData.data
        });
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        // Keep empty arrays on error
      } finally {
        setIsLoading(false);
      }
    }
    
    loadDashboardData();
  }, [user?.id]);

  // Get assessment scores (already using user.assessmentScores)
  const mockAssessmentScores: AssessmentScore[] = React.useMemo(() => {
    if (!user?.assessmentScores) return [];
    
    return Object.entries(user.assessmentScores).map(([type, score]) => ({
      type,
      label: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      score: typeof score === 'number' ? score : 0,
      date: new Date().toISOString().split('T')[0],
      maxScore: 100
    }));
  }, [user?.assessmentScores]);
```

**Then update the widget render calls:**

```typescript
{/* Replace mockMoodEntries with dashboardData.moodEntries */}
{isVisible('mood-heatmap') && (
  <MoodCalendarHeatmap entries={dashboardData.moodEntries} days={90} />
)}

{/* Replace mockWellnessData with dashboardData.wellnessData */}
{isVisible('wellness-trend') && (
  <WellnessScoreTrend data={dashboardData.wellnessData} title="Wellness Score Trend (30 days)" days={30} />
)}

{/* Replace mockStreakData with dashboardData.streakData */}
{isVisible('streak-tracker') && dashboardData.streakData && (
  <StreakTracker data={dashboardData.streakData} />
)}
```

---

## ✅ Testing Checklist

After implementing each fix:

### **1. Backend API Tests:**
```bash
# Test user profile
curl -H "Authorization: Bearer TOKEN" http://localhost:5000/api/users/USER_ID

# Test personalized plan
curl -H "Authorization: Bearer TOKEN" http://localhost:5000/api/plans/USER_ID

# Test streak
curl -H "Authorization: Bearer TOKEN" http://localhost:5000/api/streak/USER_ID

# Test content
curl http://localhost:5000/api/public-content

# Test practices
curl http://localhost:5000/api/practices
```

### **2. Run Automated Test:**
```bash
node test-dashboard-sync.js
```

**Expected Result:**
```
✅ Passed: 10/10 (100%)
⚠️ Warning: 0/10 (0%)
❌ Failed: 0/10 (0%)
```

### **3. Manual Browser Test:**
1. Login with demo account
2. View dashboard
3. Check all widgets load properly
4. Verify no console errors
5. Test dark mode
6. Test mobile responsive

---

## 🚀 Deployment Order

1. ✅ **Backend API fixes** (commit & push)
2. ✅ **Database seeding** (run on server)
3. ✅ **Frontend integration** (commit & push)
4. ✅ **Test** (automated + manual)
5. ✅ **Deploy** to production

---

## 📊 Expected Results

### **Before:**
```
API Test Results:
✅ 5/10 passing
⚠️ 5/10 warnings
❌ 0/10 failed
```

### **After:**
```
API Test Results:
✅ 10/10 passing
⚠️ 0/10 warnings (data depends on user activity)
❌ 0/10 failed
```

---

## 🎯 Summary

This document provides **all the code** needed to fix dashboard issues:

1. ✅ User Profile API - GET /api/users/:userId
2. ✅ Personalized Plan API - GET /api/plans/:userId
3. ✅ Streak Tracker API - GET /api/streak/:userId
4. ✅ Database Seeding - Content & practices
5. ✅ Frontend Integration - Replace mock data

**Total Implementation Time:** ~1-2 hours  
**Impact:** Dashboard goes from 50% → 100% functional!

**Ready to implement?** Just copy-paste the code and follow the testing checklist! 🚀
