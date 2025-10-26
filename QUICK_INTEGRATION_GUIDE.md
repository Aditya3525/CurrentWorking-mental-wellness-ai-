# Quick Integration Fixes - Connect Real Data

## 🚀 5-Minute Fixes to Replace Mock Data

These changes connect the dashboard widgets to existing backend APIs that are already implemented.

---

## Fix 1: Mood Calendar Heatmap (2 minutes)

**File:** `frontend/src/components/features/dashboard/Dashboard.tsx`

**Find this section** (around line 40-60):
```typescript
// Mock data for MoodCalendarHeatmap
const mockMoodEntries = useMemo<MoodEntry[]>(() => {
  const entries: MoodEntry[] = [];
  // ... mock data generation ...
  return entries;
}, []);
```

**Replace with:**
```typescript
// Real mood data from API
const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
const [moodLoading, setMoodLoading] = useState(true);

useEffect(() => {
  const fetchMoodData = async () => {
    try {
      setMoodLoading(true);
      const response = await moodApi.getMoodHistory();
      if (response.success && response.data?.moodEntries) {
        setMoodEntries(response.data.moodEntries);
      }
    } catch (error) {
      console.error('Failed to fetch mood history:', error);
      // Fallback to empty array or show error
      setMoodEntries([]);
    } finally {
      setMoodLoading(false);
    }
  };
  
  fetchMoodData();
}, []);
```

**Update the import at top of file:**
```typescript
import { assessmentsApi, moodApi } from '../../../services/api';
```

**Update the component usage** (around line 200):
```typescript
{isVisible('moodCalendar') && (
  <MoodCalendarHeatmap 
    entries={moodLoading ? [] : moodEntries} 
    days={90} 
  />
)}
```

---

## Fix 2: Assessment Comparison Chart (3 minutes)

**File:** `frontend/src/components/features/dashboard/Dashboard.tsx`

**Find this section** (around line 80-100):
```typescript
// Mock data for AssessmentComparisonChart
const mockAssessmentScores = useMemo<AssessmentScore[]>(() => [
  { name: 'PHQ-9 Depression', score: 45, interpretation: 'Mild', color: '#f59e0b' },
  // ... more mock scores ...
], []);
```

**Replace with:**
```typescript
// Real assessment data from API
const [assessmentScores, setAssessmentScores] = useState<AssessmentScore[]>([]);
const [assessmentsLoading, setAssessmentsLoading] = useState(true);

useEffect(() => {
  const fetchAssessmentData = async () => {
    try {
      setAssessmentsLoading(true);
      const response = await assessmentsApi.getInsights();
      
      if (response.success && response.data?.byType) {
        // Transform API data to component format
        const scores = Object.entries(response.data.byType).map(([type, data]: [string, any]) => {
          const score = data.latestScore || 0;
          let color = '#10b981'; // green by default
          let interpretation = 'Low';
          
          if (score > 66) {
            color = '#ef4444'; // red
            interpretation = 'High';
          } else if (score > 33) {
            color = '#f59e0b'; // yellow
            interpretation = 'Moderate';
          }
          
          return {
            name: data.name || type,
            score: score,
            interpretation: interpretation,
            color: color
          };
        });
        
        setAssessmentScores(scores);
      }
    } catch (error) {
      console.error('Failed to fetch assessment insights:', error);
      setAssessmentScores([]);
    } finally {
      setAssessmentsLoading(false);
    }
  };
  
  fetchAssessmentData();
}, []);
```

**Update component usage** (around line 250):
```typescript
{isVisible('assessmentComparison') && (
  assessmentsLoading ? (
    <Card>
      <CardContent className="p-6">
        <p className="text-muted-foreground text-center">Loading assessments...</p>
      </CardContent>
    </Card>
  ) : assessmentScores.length > 0 ? (
    <AssessmentComparisonChart scores={assessmentScores} />
  ) : (
    <Card>
      <CardContent className="p-6">
        <p className="text-muted-foreground text-center">
          No assessment history yet. Take your first assessment to see insights.
        </p>
      </CardContent>
    </Card>
  )
)}
```

---

## Fix 3: Add Error Handling & Loading States

**Add this helper component at the top of Dashboard.tsx** (after imports):

```typescript
const LoadingCard = ({ message = 'Loading...' }: { message?: string }) => (
  <Card>
    <CardContent className="p-6 text-center">
      <div className="flex items-center justify-center gap-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        <p className="text-muted-foreground">{message}</p>
      </div>
    </CardContent>
  </Card>
);

const EmptyStateCard = ({ message, actionText, onAction }: { 
  message: string; 
  actionText?: string; 
  onAction?: () => void;
}) => (
  <Card>
    <CardContent className="p-6 text-center space-y-4">
      <p className="text-muted-foreground">{message}</p>
      {actionText && onAction && (
        <Button onClick={onAction} variant="outline">
          {actionText}
        </Button>
      )}
    </CardContent>
  </Card>
);
```

---

## Complete Updated Dashboard.tsx Section

Here's the complete data fetching section to add at the top of the Dashboard component:

```typescript
export function Dashboard({ onStartAssessment, onViewPractice }: DashboardProps) {
  const navigate = useNavigate();
  const { isVisible, CustomizerDialog, CustomizerButton } = useWidgetVisibility();
  
  // Real API data states
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [moodLoading, setMoodLoading] = useState(true);
  
  const [assessmentScores, setAssessmentScores] = useState<AssessmentScore[]>([]);
  const [assessmentsLoading, setAssessmentsLoading] = useState(true);
  
  // Fetch mood history
  useEffect(() => {
    const fetchMoodData = async () => {
      try {
        setMoodLoading(true);
        const response = await moodApi.getMoodHistory();
        if (response.success && response.data?.moodEntries) {
          setMoodEntries(response.data.moodEntries);
        }
      } catch (error) {
        console.error('Failed to fetch mood history:', error);
        setMoodEntries([]);
      } finally {
        setMoodLoading(false);
      }
    };
    
    fetchMoodData();
  }, []);
  
  // Fetch assessment insights
  useEffect(() => {
    const fetchAssessmentData = async () => {
      try {
        setAssessmentsLoading(true);
        const response = await assessmentsApi.getInsights();
        
        if (response.success && response.data?.byType) {
          const scores = Object.entries(response.data.byType).map(([type, data]: [string, any]) => {
            const score = data.latestScore || 0;
            let color = '#10b981';
            let interpretation = 'Low';
            
            if (score > 66) {
              color = '#ef4444';
              interpretation = 'High';
            } else if (score > 33) {
              color = '#f59e0b';
              interpretation = 'Moderate';
            }
            
            return {
              name: data.name || type,
              score: score,
              interpretation: interpretation,
              color: color
            };
          });
          
          setAssessmentScores(scores);
        }
      } catch (error) {
        console.error('Failed to fetch assessment insights:', error);
        setAssessmentScores([]);
      } finally {
        setAssessmentsLoading(false);
      }
    };
    
    fetchAssessmentData();
  }, []);
  
  // Keep mock data for widgets that don't have backend yet
  const mockWellnessData = useMemo<WellnessDataPoint[]>(() => {
    // ... keep existing mock data ...
  }, []);
  
  const mockStreakData = useMemo<StreakData>(() => {
    // ... keep existing mock data ...
  }, []);
  
  // Rest of component...
}
```

---

## Testing the Changes

### 1. Start Backend
```powershell
cd backend
npm run dev
```

### 2. Start Frontend
```powershell
cd frontend
npm run dev
```

### 3. Test Scenarios

**Test Mood Heatmap:**
1. Log some mood entries first:
   ```typescript
   // In browser console or through UI
   await moodApi.logMood('Great', 'Feeling awesome today!');
   await moodApi.logMood('Good', 'Pretty good day');
   ```
2. Refresh dashboard
3. Should see real mood entries in heatmap

**Test Assessment Chart:**
1. Complete at least one assessment
2. Go to dashboard
3. Should see real assessment scores
4. If no assessments, should see "Take your first assessment" message

---

## Expected Behavior

### With Data:
- ✅ Mood heatmap shows colored squares for each logged mood
- ✅ Assessment chart shows bars for completed assessments
- ✅ Hover tooltips work with real dates and values

### Without Data:
- ✅ Loading spinner while fetching
- ✅ Empty state message: "No data yet, take action to see insights"
- ✅ Call-to-action buttons to add data

### On Error:
- ✅ Console logs error
- ✅ Shows empty state (graceful degradation)
- ✅ User can still navigate and use app

---

## Rollback Plan

If issues occur, simply restore the mock data:

```typescript
// Change back to:
const mockMoodEntries = useMemo<MoodEntry[]>(() => { /* ... */ }, []);
const mockAssessmentScores = useMemo<AssessmentScore[]>(() => { /* ... */ }, []);

// And use in components:
<MoodCalendarHeatmap entries={mockMoodEntries} />
<AssessmentComparisonChart scores={mockAssessmentScores} />
```

---

## What Still Uses Mock Data (OK for MVP)

These don't have backend APIs yet, so mock data is appropriate:

1. **WellnessScoreTrend** - No historical wellness score table
   - Will need backend development for `WellnessScoreHistory` table
   
2. **StreakTracker** - No streak calculation logic
   - Will need backend development for streak fields and calculation

Keep the mock data for these until backend is ready!

---

## Summary

**Time Investment:** 5-10 minutes  
**Risk:** Very low (easy rollback)  
**Impact:** High (real data >>> mock data)

**What You Get:**
- ✅ Real mood history in calendar
- ✅ Real assessment scores in comparison
- ✅ Better user experience
- ✅ Proper loading and empty states

**Next Steps After This:**
1. Test with real data
2. Consider backend development for wellness trend
3. Consider backend development for streaks
4. Add more comprehensive error handling

---

*Ready to integrate? Copy the code sections above into Dashboard.tsx!*
