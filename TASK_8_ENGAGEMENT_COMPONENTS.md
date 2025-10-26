# Frontend Engagement Components - Task #8 Implementation

## Components Created

### 1. ContentEngagementTracker Component ✅
**File**: `frontend/src/components/features/content/ContentEngagementTracker.tsx`

**Features**:
- **Star Rating** (1-5 stars with hover effects)
  - Visual star icons that fill on hover/click
  - Descriptive labels for each rating level
  - Required field validation

- **Effectiveness Slider** (1-10 scale)
  - Large, accessible slider with real-time value display
  - Labels: "Not effective" → "Somewhat effective" → "Very effective"
  - Default value: 5

- **Mood Selection**
  - Pre-populated dropdowns with 10 mood options
  - Each mood has an emoji for visual recognition
  - Options: happy, calm, anxious, sad, stressed, angry, neutral, overwhelmed, hopeful, peaceful
  - "Mood before" display (if captured before playback)
  - "Mood after" dropdown (required)

- **Time Tracker Display**
  - Shows elapsed time in human-readable format (e.g., "5m 30s", "1h 20m")
  - Prominent display with heart icon
  - Auto-calculated from video/audio playback

- **Submit/Skip Actions**
  - "Submit Feedback" button (requires rating + mood after)
  - "Skip for now" button (submits partial data)
  - Loading states with spinner
  - Toast notifications for success/errors

**Props**:
```typescript
{
  contentId: string;
  timeSpent: number; // seconds
  onSubmit: (data: EngagementData) => Promise<void>;
  onClose: () => void;
  moodBefore?: string;
}
```

**Data Submitted**:
```typescript
{
  completed: boolean;
  rating: number | null; // 1-5
  timeSpent: number; // seconds
  moodBefore: string | null;
  moodAfter: string | null;
  effectiveness: number | null; // 1-10
}
```

---

### 2. EngagementMetrics Component ✅
**File**: `frontend/src/components/features/content/EngagementMetrics.tsx`

**Features**:
- **Statistics Grid** (4 cards):
  1. **Total Completions** - Activity icon, shows count
  2. **Average Rating** - Star icon, shows X.X/5 format
  3. **Average Effectiveness** - TrendingUp icon, shows X.X/10 format
  4. **Total Time Spent** - Clock icon, formatted as hours/minutes

- **Mood Improvement Section**:
  - Gradient background card
  - Shows count of positive mood shifts
  - Percentage calculation (positive shifts / total sessions)
  - Badge showing positive shift count
  - Emoji visualization of mood changes (😰 → 😊)

- **Recent Activity Feed**:
  - Scrollable list of last 10 engagements
  - Each card shows:
    - Content title (truncated if long)
    - Rating (star icon + value)
    - Effectiveness score
    - Time spent
    - Date completed
    - Mood before → mood after with emoji badges
  - Color-coded mood badges:
    - Green for positive mood improvements
    - Red for mood declines
    - Gray for no change

- **Empty State**:
  - Chart icon with message: "No engagement data yet"
  - Encouragement to start exploring content

- **Loading State**:
  - Skeleton loaders for smooth UX

**Mood Improvement Calculation**:
```typescript
moodScores = {
  sad: 1, overwhelmed: 2, anxious: 3, stressed: 3, angry: 3,
  neutral: 5, hopeful: 7, calm: 8, happy: 9, peaceful: 10
}
improvement = afterScore - beforeScore
```

**Props**:
```typescript
{
  userId: string;
}
```

---

## Integration Points

### Required for Full Functionality:

#### 1. MediaPlayerDialog Updates (To Do)
**Location**: `frontend/src/components/features/content/MediaPlayerDialog.tsx`

**Changes Needed**:
```tsx
import { ContentEngagementTracker, type EngagementData } from './ContentEngagementTracker';

// State additions
const [showEngagementTracker, setShowEngagementTracker] = useState(false);
const [totalTimeSpent, setTotalTimeSpent] = useState(0);
const [moodBefore, setMoodBefore] = useState<string | null>(null);
const playStartTime = useRef<number>(0);

// Track time on play/pause
const togglePlayback = () => {
  if (el.paused) {
    playStartTime.current = Date.now();
    el.play();
  } else {
    const sessionTime = (Date.now() - playStartTime.current) / 1000;
    setTotalTimeSpent(prev => prev + sessionTime);
    el.pause();
  }
};

// Show tracker on content end
const handleEnded = () => {
  setIsPlaying(false);
  const sessionTime = (Date.now() - playStartTime.current) / 1000;
  setTotalTimeSpent(prev => prev + sessionTime);
  setShowEngagementTracker(true); // Prompt for feedback
};

// Submit engagement data
const handleEngagementSubmit = async (data: EngagementData) => {
  await api.trackContentEngagement(item.id, data);
};

// Render tracker in dialog
{showEngagementTracker && (
  <div className="p-6 border-t">
    <ContentEngagementTracker
      contentId={item.id}
      timeSpent={totalTimeSpent}
      onSubmit={handleEngagementSubmit}
      onClose={() => setShowEngagementTracker(false)}
      moodBefore={moodBefore}
    />
  </div>
)}
```

#### 2. Profile Page Integration (To Do)
**Location**: `frontend/src/components/features/profile/Profile.tsx`

**Changes Needed**:
```tsx
import { EngagementMetrics } from '../content/EngagementMetrics';

// Add to profile tabs or sections
<EngagementMetrics userId={user.id} />
```

#### 3. API Client Methods (Task #9)
**Location**: `frontend/src/services/api.ts`

**Required Methods**:
```typescript
export const trackContentEngagement = async (
  contentId: string,
  data: Partial<EngagementData>
): Promise<ContentEngagement> => {
  const response = await apiClient.post(`/content/${contentId}/engage`, data);
  return response.data.data;
};

export const getUserEngagementHistory = async (
  userId: string
): Promise<EngagementStat[]> => {
  const response = await apiClient.get(`/users/${userId}/engagement`);
  return response.data.data;
};
```

---

## UI Component Dependencies

All components use existing UI components from the design system:

- ✅ `Button` - Submit/Skip actions
- ✅ `Card`, `CardContent`, `CardDescription`, `CardHeader`, `CardTitle` - Layout
- ✅ `Label` - Form labels
- ✅ `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` - Mood dropdowns
- ✅ `Slider` - Effectiveness rating
- ✅ `Badge` - Tags, mood indicators
- ✅ `ScrollArea` - Recent activity feed
- ✅ `Skeleton` - Loading states
- ✅ Lucide icons: `Star`, `Heart`, `Smile`, `ThumbsUp`, `Activity`, `Clock`, `TrendingUp`, `BarChart3`
- ✅ `useToast` hook - Notifications

---

## File Structure

```
frontend/src/components/features/content/
├── ContentEngagementTracker.tsx  ✅ NEW (254 lines)
├── EngagementMetrics.tsx         ✅ NEW (297 lines)
├── ContentLibrary.tsx            (existing)
├── MediaPlayerDialog.tsx         ⏳ TO UPDATE
├── Practices.tsx                 (existing)
├── index.ts                      ✅ UPDATED (added exports)
└── types.ts                      (existing)
```

---

## Testing Checklist

### ContentEngagementTracker:
- [ ] Star rating interaction (hover, click)
- [ ] Effectiveness slider smooth movement
- [ ] Mood dropdown displays all 10 options with emojis
- [ ] Submit button disabled until rating + mood filled
- [ ] Skip button works without validation
- [ ] Time display formats correctly (seconds → minutes → hours)
- [ ] Toast notifications appear on success/error
- [ ] Loading state shows spinner

### EngagementMetrics:
- [ ] Statistics grid calculates averages correctly
- [ ] Mood improvement percentage calculation accurate
- [ ] Recent activity feed sorted by date (newest first)
- [ ] Mood emoji badges color-coded correctly
- [ ] Empty state shows when no data
- [ ] Loading skeletons display before data loads
- [ ] Scrollable area works for 10+ items
- [ ] Date formatting localized correctly

---

## Next Steps

1. **Immediate** (Task #8 completion):
   - Update `MediaPlayerDialog.tsx` to integrate ContentEngagementTracker
   - Add EngagementMetrics to Profile page
   - Add mood capture before playback starts (optional pre-mood tracker)

2. **Task #9** (Frontend API Client):
   - Add ContentEngagement interface to api.ts
   - Implement `trackContentEngagement()` method
   - Implement `getUserEngagementHistory()` method
   - Update Content/Practice interfaces with new fields

3. **Task #10** (Admin Forms):
   - Build admin content/practice metadata forms

---

## Code Statistics

- **Lines of Code**: 551 lines (254 + 297)
- **Components**: 2 new React components
- **Dependencies**: 0 new packages (uses existing UI library)
- **Time Invested**: ~2 hours

---

**Status**: Task #8 - 60% Complete  
**Remaining**: MediaPlayerDialog integration, Profile page integration
