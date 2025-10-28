# 📊 Dashboard Overview - Mental Wellbeing AI App

## 🎯 Purpose
The Dashboard is the **central hub** of the Mental Wellbeing AI App. It provides users with:
- **Personalized welcome** with time-based greetings
- **Quick actions** for immediate access to core features
- **Health metrics** displaying assessment scores (anxiety, stress, emotional intelligence)
- **Today's practice** recommendations based on user's chosen approach (Western/Eastern/Hybrid)
- **Recent insights** from AI-analyzed patterns
- **Weekly progress** tracking with streaks and completion rates
- **Customizable widgets** allowing users to show/hide sections

---

## 📱 Responsive Design

### Breakpoints
- **Mobile**: ≤767px (single column, bottom navigation, collapsible sections)
- **Tablet Portrait**: 768-1023px
- **Tablet Landscape**: 1024-1199px  
- **Desktop**: ≥1200px

### Mobile-Specific Features
- **Bottom Navigation Bar**: Fixed navigation with 5 quick-access buttons
- **Horizontal Scrolling**: Metrics cards scroll horizontally (snap scrolling)
- **Collapsible Sections**: "More Practices", "Recent Insights", "This Week" collapse by default
- **Overflow Menu**: Profile, logout, and settings in dropdown menu
- **Touch-Optimized**: 44×44px minimum touch targets (WCAG compliant)

### Desktop Features
- **Grid Layout**: Multi-column display for efficient space usage
- **Full Navigation**: All buttons visible without dropdown
- **Expanded Widgets**: All sections open by default
- **Profile Completion Indicator**: Visible in header

---

## 🧩 Core Components

### 1. **Dashboard.tsx** (Main Component - 889 lines)
**Location**: `frontend/src/components/features/dashboard/Dashboard.tsx`

**Key Features**:
- Time-based greeting (Good morning/afternoon/evening)
- Profile completion tracking (7 fields: firstName, lastName, birthday, region, approach, emergencyContact, emergencyPhone)
- Mood check-in with 5 moods (Great 😊, Good 🙂, Okay 😐, Struggling 😔, Anxious 😰)
- Dark mode toggle
- Customizable widget visibility

**Props**:
```typescript
interface DashboardProps {
  user: StoredUser | null;        // User data with assessment scores
  onNavigate: (page: string) => void;  // Navigation handler
  onLogout?: () => void;           // Logout callback
  showTour?: boolean;              // Show onboarding tour
  onTourDismiss?: () => void;      // Tour dismissal handler
  onTourComplete?: () => void;     // Tour completion handler
}
```

**Sections** (in priority order):
1. **Header** - Welcome message, mood check, profile actions
2. **Quick Actions** - Assessments, Chat, Library, Progress
3. **Today's Practice** - Personalized based on approach
4. **Assessment Scores** - Anxiety, Stress, Emotional Intelligence
5. **Recent Insights** - AI-generated pattern detection
6. **This Week** - Practice completion, mood check-ins, streak tracking
7. **Navigation Shortcuts** - Quick links (desktop only)

---

### 2. **Widget Components**

#### **DashboardCustomizer** 
**Location**: `frontend/src/components/features/dashboard/DashboardCustomizer.tsx`

Allows users to show/hide dashboard widgets. Uses localStorage to persist preferences.

**Widgets**:
- `mood-check` - Quick Mood Check
- `assessment-scores` - Assessment Scores
- `today-practice` - Today's Practice
- `quick-actions` - Quick Actions
- `recent-insights` - Recent Insights
- `this-week` - This Week
- `navigation-shortcuts` - Navigation Shortcuts

**Storage**: `localStorage` key = `mw-dashboard-widget-visibility`

---

#### **DashboardTourPrompt**
**Location**: `frontend/src/components/features/dashboard/DashboardTourPrompt.tsx`

Interactive onboarding tour with 4 steps:
1. **Welcome** - Introduction to personalized dashboard
2. **Smart Insights** - Explanation of AI recommendations
3. **Your Progress** - Daily check-ins and practice tracking
4. **Customize** - Widget customization and pinning favorites

**Tour Steps Format**:
```typescript
interface TourStep {
  title: string;
  description: string;
}
```

---

#### **Chart/Visualization Widgets** (Available but not currently rendered)

These components exist but need integration:

1. **AssessmentComparisonChart** - Compare multiple assessment results over time
2. **ConversationTopicsWidget** - Visualize topics discussed in AI chat
3. **ConversationSummaryWidget** - Summary of recent chat sessions
4. **EmotionalPatternWidget** - Emotional trends visualization
5. **MoodCalendar** - Calendar view of daily mood entries
6. **MoodCalendarHeatmap** - Heatmap visualization of mood patterns
7. **StreakTracker** - Visual streak tracking (current/longest streak)
8. **WellnessScoreTrend** - Line chart of wellness scores over time

---

## 🔄 Data Flow

### Current Implementation
```
User Login
    ↓
App.tsx loads user from localStorage (auth.ts)
    ↓
Dashboard receives user prop
    ↓
Dashboard displays:
  - Profile completion (calculated from user fields)
  - Assessment scores (from user.assessmentScores)
  - Personalized practices (based on user.approach)
  - Static mock data (insights, weekly stats)
```

### Missing Backend Integration
⚠️ **The following features use MOCK DATA and need backend APIs**:

1. **Recent Insights** (Lines 619-683)
   - Currently: Hardcoded text
   - Needed: `GET /api/insights/:userId` endpoint

2. **Weekly Stats** (Lines 688-781)
   - Currently: Static values (4/7 practices, 6/7 mood checks, 3-day streak)
   - Needed: `GET /api/progress/weekly/:userId` endpoint

3. **Mood Check-In** (Lines 248-268)
   - Currently: Local state only (`setTodayMood`)
   - Needed: `POST /api/mood-entries` endpoint

4. **Today's Practice** (Lines 387-495)
   - Currently: Static recommendations
   - Needed: `GET /api/practices/recommended/:userId` endpoint

---

## 🎨 Personalization

### Approach-Based Content

The dashboard adapts content based on `user.approach`:

| Field | Western (CBT) | Eastern (Mindfulness) | Hybrid |
|-------|---------------|----------------------|---------|
| **Practice Title** | CBT Reflection Exercise | Guided Mindful Breathing | Blended Mindfulness & CBT Practice |
| **Practice Tags** | ['CBT technique', 'Thought tracking', '5–10 min'] | ['Meditation', 'Breathwork', 'Grounding'] | ['Mindfulness', 'Cognitive reframing', 'Balanced'] |
| **Approach Description** | Personalized for your chosen approach | Personalized for your chosen approach | Personalized for your chosen approach |

**Code Location**: Lines 105-120

---

## 🛠️ Technical Implementation

### Dependencies
```typescript
// UI Components
import { Button, Card, Badge, Progress } from '../../ui/*';
import { BottomNavigation, ResponsiveGrid, ResponsiveStack } from '../../ui/*';

// Icons
import { Heart, Brain, Target, Sparkles, Play, MessageCircle, ... } from 'lucide-react';

// Hooks
import { useAccessibility } from '../../../contexts/AccessibilityContext';
import { useDevice } from '../../../hooks/use-device';

// Sub-components
import { DashboardCustomizer, DashboardTourPrompt, useWidgetVisibility } from './';
```

### Custom Hooks

#### `useWidgetVisibility()`
**Location**: `DashboardCustomizer.tsx` (exported)

Manages widget visibility state with localStorage persistence.

**Returns**:
```typescript
{
  visibility: WidgetVisibility,         // Current visibility state
  updateVisibility: (v: WidgetVisibility) => void,  // Update and persist
  isVisible: (widget: DashboardWidget) => boolean   // Check visibility
}
```

#### `useDevice()`
**Location**: `frontend/src/hooks/use-device.ts`

Detects device type and viewport width.

**Returns**:
```typescript
{
  isMobile: boolean,
  isTabletPortrait: boolean,
  isTabletLandscape: boolean,
  isDesktop: boolean,
  isSmallPhone: boolean,      // ≤375px
  viewportWidth: number
}
```

---

## 🚀 Quick Improvements You Can Make

### 1. **Connect Mock Data to Backend APIs**
**Priority**: HIGH  
**Effort**: 2-3 days

Replace static data with real API calls:
- Weekly progress stats
- Recent insights from AI
- Mood check-in persistence
- Dynamic practice recommendations

**Example**:
```typescript
// Replace static insights (line 655) with:
const { data: insights } = useQuery(['insights', user?.id], 
  () => fetch(`/api/insights/${user?.id}`).then(r => r.json())
);
```

---

### 2. **Add Missing Chart Widgets**
**Priority**: MEDIUM  
**Effort**: 1-2 days

Integrate existing but unused components:
- `WellnessScoreTrend` - Show score trends over time
- `MoodCalendarHeatmap` - Visual mood tracking
- `StreakTracker` - Animated streak display
- `EmotionalPatternWidget` - Pattern visualization

**Where to add**: After "Assessment Scores" section (line 605)

---

### 3. **Enhance Mobile Responsiveness**
**Priority**: MEDIUM  
**Effort**: 1 day

Current mobile optimizations are good, but can be improved:
- Add swipe gestures for metric cards
- Implement pull-to-refresh for data updates
- Add haptic feedback for mood selection
- Smooth scroll animations

---

### 4. **Implement Real-Time Updates**
**Priority**: LOW  
**Effort**: 2-3 days

Add WebSocket or polling for:
- New insights notifications
- Streak updates
- Assessment completion alerts
- Practice reminders

---

### 5. **Add Analytics & Tracking**
**Priority**: LOW  
**Effort**: 1 day

Track user interactions:
- Widget customization preferences
- Most-used quick actions
- Time spent on dashboard
- Feature adoption rates

---

## 📊 Current Status

### ✅ Complete Features
- [x] Responsive layout (mobile/tablet/desktop)
- [x] Dark mode support
- [x] Widget customization
- [x] Accessibility (WCAG 2.1 AA compliant)
- [x] Personalized greeting
- [x] Profile completion tracking
- [x] Touch-optimized buttons (44×44px)
- [x] Onboarding tour
- [x] Bottom navigation (mobile)

### ⚠️ Incomplete Features
- [ ] Backend API integration for insights
- [ ] Backend API for weekly progress
- [ ] Mood check-in persistence
- [ ] Dynamic practice recommendations
- [ ] Chart widgets integration
- [ ] Real-time notifications
- [ ] Analytics tracking

### 🔴 Known Issues
- No error handling for missing user data
- Static mock data displayed as real
- No loading states for data fetching
- No empty states for new users (partially implemented)

---

## 🧪 Testing Checklist

### Manual Testing
- [ ] Test on mobile (≤767px) - all interactions work
- [ ] Test on tablet portrait (768-1023px)
- [ ] Test on tablet landscape (1024-1199px)
- [ ] Test on desktop (≥1200px)
- [ ] Dark mode toggle works correctly
- [ ] Widget visibility persists after refresh
- [ ] Profile completion calculates correctly (7 fields)
- [ ] Mood selection updates state
- [ ] All navigation buttons work
- [ ] Logout confirmation works
- [ ] Tour can be completed and skipped
- [ ] Bottom navigation shows on mobile only
- [ ] Horizontal scroll works for metrics cards

### Accessibility Testing
- [ ] Screen reader announces all sections
- [ ] Keyboard navigation works (Tab, Enter, Esc)
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG 2.1 AA
- [ ] Touch targets ≥44×44px
- [ ] Dark mode readable
- [ ] Reduced motion supported

---

## 📁 File Structure

```
frontend/src/components/features/dashboard/
├── index.ts                           # Exports all dashboard components
├── Dashboard.tsx                      # Main dashboard component (889 lines)
├── DashboardCustomizer.tsx            # Widget visibility customizer (243 lines)
├── DashboardTourPrompt.tsx            # Onboarding tour (145 lines)
├── AssessmentComparisonChart.tsx      # Assessment comparison widget
├── ConversationTopicsWidget.tsx       # Chat topics visualization
├── ConversationSummaryWidget.tsx      # Chat summary widget
├── EmotionalPatternWidget.tsx         # Emotional pattern visualization
├── MoodCalendar.tsx                   # Calendar mood view
├── MoodCalendarHeatmap.tsx            # Heatmap mood visualization
├── StreakTracker.tsx                  # Streak tracking widget
└── WellnessScoreTrend.tsx             # Wellness score trend chart
```

---

## 🔗 Related Components

### Used by Dashboard
- `frontend/src/components/ui/button.tsx`
- `frontend/src/components/ui/card.tsx`
- `frontend/src/components/ui/badge.tsx`
- `frontend/src/components/ui/progress.tsx`
- `frontend/src/components/ui/bottom-navigation.tsx`
- `frontend/src/components/ui/responsive-layout.tsx`
- `frontend/src/components/ui/dropdown-menu.tsx`
- `frontend/src/contexts/AccessibilityContext.tsx`
- `frontend/src/hooks/use-device.ts`
- `frontend/src/services/auth.ts` (StoredUser type)

### Navigation Targets
- `assessments` - Assessment flow
- `chatbot` - AI chat interface
- `library` - Content library
- `progress` - Progress tracking
- `practices` - Practice exercises
- `profile` - User profile
- `help` - Help & safety

---

## 💡 Pro Tips

1. **Widget Customization**: Users can hide widgets they don't use. Core widgets (mood-check, assessment-scores, today-practice, quick-actions) are most important.

2. **Mobile-First**: The dashboard is built mobile-first. Desktop layout adds more columns and expands sections.

3. **Personalization**: The `user.approach` field (western/eastern/hybrid) drives practice recommendations. Always check this field exists.

4. **Profile Completion**: Tracking 7 fields (firstName, lastName, birthday, region, approach, emergencyContact, emergencyPhone). Update `getProfileCompletion()` if fields change.

5. **Dark Mode**: Uses AccessibilityContext. Toggle persists across sessions.

6. **Empty States**: Partial empty state for "No insights yet". Add more for new users.

7. **Loading States**: Currently missing. Add React Query for loading/error states.

---

## 📞 Next Steps

### For Backend Developers
1. Create `/api/insights/:userId` endpoint
2. Create `/api/progress/weekly/:userId` endpoint
3. Create `POST /api/mood-entries` endpoint
4. Create `/api/practices/recommended/:userId` endpoint
5. Add WebSocket events for real-time updates

### For Frontend Developers
1. Integrate chart widgets (WellnessScoreTrend, MoodCalendarHeatmap, StreakTracker)
2. Replace mock data with React Query API calls
3. Add loading skeletons
4. Implement error boundaries
5. Add analytics tracking

### For Designers
1. Design empty states for new users
2. Design error states
3. Design loading states
4. Review mobile touch targets
5. Test dark mode color contrast

---

## 🎓 Learning Resources

- **Responsive Layout Patterns**: See `frontend/src/components/ui/responsive-layout.tsx`
- **Device Detection**: See `frontend/src/hooks/use-device.ts`
- **Accessibility Context**: See `frontend/src/contexts/AccessibilityContext.tsx`
- **Bottom Navigation**: See `frontend/src/components/ui/bottom-navigation.tsx`
- **Widget Customization Pattern**: See `DashboardCustomizer.tsx`

---

## 📝 Summary

The Dashboard is the **most feature-rich component** in the app. It's:
- ✅ Fully responsive
- ✅ Highly accessible
- ✅ Customizable
- ✅ Personalized
- ⚠️ Using mock data (needs backend integration)
- ⚠️ Missing some widgets (need integration)

**Current State**: 80% complete - core functionality works, but needs backend APIs and widget integration for full feature set.

---

**Last Updated**: October 28, 2025  
**Component Version**: 1.0  
**Lines of Code**: 889 (Dashboard.tsx)  
**Dependencies**: 15+ UI components, 2 contexts, 2 hooks
