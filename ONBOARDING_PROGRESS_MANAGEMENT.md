# Onboarding Progress Management - Complete Guide

## Overview
Enhanced onboarding flow with intelligent progress persistence, allowing users to resume where they left off while providing options to start fresh or exit cleanly.

## Problem Statement

### Original Issues:
1. **Exit button behavior unclear** - Clicking "Exit onboarding" saved progress but users weren't sure if data was saved
2. **No way to start fresh** - Users with saved progress couldn't easily restart from scratch
3. **localStorage not cleared on completion** - Completed onboarding left residual data in storage
4. **Confusing state for returning users** - Users logging in again would see partial progress without context

## Solution Implemented

### 1. **Clear localStorage on Completion** ✅
When users complete onboarding successfully, all saved progress is automatically cleared.

**Implementation:**
```typescript
if (currentStep === totalSteps - 1) {
  const completionData = { /* profile data */ };
  
  // Clear localStorage onboarding progress upon completion
  try {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear onboarding progress:', error);
  }
  
  onComplete(completionData);
}
```

**Impact:**
- ✅ Clean state after onboarding
- ✅ No residual data in localStorage
- ✅ Prevents accidental resume after completion

---

### 2. **Preserve Progress on Exit** ✅
When users exit mid-onboarding, their progress is saved to localStorage.

**How it Works:**
```typescript
const saveProgressToStorage = useCallback((showToast = false) => {
  try {
    const payload: StoredProgress = {
      email: sanitizedEmail,
      currentStep,
      profileData,
      securityQuestionSaved,
      hasSkippedProfileDetails,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(payload));
    if (showToast) {
      push({
        title: 'Progress saved',
        description: 'We stored your onboarding steps. You can return anytime to continue.',
        type: 'success'
      });
    }
  } catch (error) {
    console.error('Failed to persist onboarding progress:', error);
  }
}, [currentStep, hasSkippedProfileDetails, profileData, sanitizedEmail, securityQuestionSaved]);
```

**Storage Key:** `'mw-onboarding-progress'`

**Stored Data:**
- User email (for multi-user support)
- Current step number
- All form data (name, birthday, preferences, etc.)
- Security question status
- Skip flags
- Timestamp

---

### 3. **Auto-Restore on Login** ✅
When users return, their saved progress is automatically detected and restored.

**Restoration Logic:**
```typescript
useEffect(() => {
  try {
    const storedRaw = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!storedRaw) {
      setHasLoadedStoredProgress(true);
      return;
    }

    const stored: StoredProgress = JSON.parse(storedRaw);

    // Check if saved progress matches current user
    if (stored.email && stored.email !== sanitizedEmail) {
      setHasLoadedStoredProgress(true);
      return;
    }

    // Restore all saved data
    if (stored.profileData) {
      setProfileData(prev => ({ ...prev, ...stored.profileData }));
    }
    if (typeof stored.currentStep === 'number') {
      setCurrentStep(stored.currentStep);
    }
    if (typeof stored.securityQuestionSaved === 'boolean') {
      setSecurityQuestionSaved(stored.securityQuestionSaved);
    }
    if (typeof stored.hasSkippedProfileDetails === 'boolean') {
      setHasSkippedProfileDetails(stored.hasSkippedProfileDetails);
    }

    // Show welcome back message
    setTimeout(() => {
      push({
        title: 'Welcome back',
        description: 'We restored your previous onboarding progress so you can continue where you left off.',
        type: 'info'
      });
    }, 150);
  } catch (error) {
    console.error('Failed to restore onboarding progress:', error);
  } finally {
    setHasLoadedStoredProgress(true);
  }
}, [push, sanitizedEmail]);
```

**User Experience:**
- 🎯 Seamless continuation from last step
- 💾 All form fields pre-filled
- 📢 Toast notification confirms restoration
- 🔒 Email-based isolation (prevents data mixing)

---

### 4. **Start Fresh Feature** ✅ NEW!
Users can now reset their onboarding progress and start from scratch at any time.

**UI Button:**
```tsx
{currentStep > 0 ? (
  <Button
    variant="outline"
    size="sm"
    onClick={handleStartFresh}
    className="flex items-center gap-2"
  >
    <AlertTriangle className="h-4 w-4" />
    Start Fresh
  </Button>
) : (
  <div className="flex-1" />
)}
```

**Handler Logic:**
```typescript
const handleStartFresh = () => {
  const confirmReset = window.confirm(
    'Are you sure you want to start fresh? This will clear all your saved progress and start from the beginning.'
  );
  if (!confirmReset) return;
  
  try {
    // Remove saved progress
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    
    // Reset all state to initial values
    setCurrentStep(0);
    setProfileData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      dataConsent: false,
      clinicianSharing: false,
    });
    setSecurityQuestionSaved(false);
    setHasSkippedProfileDetails(false);
    setValidationErrors({});
    setBirthdayError(null);
    
    push({
      title: 'Starting fresh',
      description: 'Your onboarding progress has been cleared.',
      type: 'success'
    });
  } catch (error) {
    console.error('Failed to clear onboarding progress:', error);
    push({
      title: 'Error',
      description: 'Failed to clear progress. Please try again.',
      type: 'error'
    });
  }
};
```

**When Visible:**
- Shows when `currentStep > 0` (not on welcome screen)
- Hidden on first step to avoid confusion
- Positioned on the left side of header

**User Confirmation:**
- Browser native confirm dialog
- Clear warning about data loss
- Cancellable action

---

### 5. **Enhanced Exit Options** ✅
Two exit buttons with clear purposes:

#### **Save & Exit** (Primary)
```tsx
<Button
  variant="outline"
  size="sm"
  onClick={handleSaveAndExit}
  className="flex items-center gap-2"
>
  <Save className="h-4 w-4" />
  Save & Exit
</Button>
```

**Behavior:**
- Explicitly saves progress to localStorage
- Shows success toast
- Navigates to exit destination
- **User knows** their data is saved

#### **Exit** (Secondary)
```tsx
<Button
  variant="ghost"
  size="sm"
  onClick={handleExitWithoutSaving}
  className="flex items-center gap-2 text-muted-foreground"
>
  <LogOut className="h-4 w-4" />
  Exit
</Button>
```

**Behavior:**
- Confirms exit with dialog
- Still saves progress (safety net)
- Shows info toast about resuming later
- Less prominent styling (ghost variant)

---

## Complete User Flows

### Flow 1: First-Time User
```
1. User creates account
2. Lands on onboarding welcome screen
3. No "Start Fresh" button (currentStep = 0)
4. Fills out Step 1 (Basic Profile)
   → Progress auto-saved to localStorage
5. Clicks "Save & Exit"
   → Toast: "Progress saved"
   → Returns to landing/assessment-invite
6. Logs in again later
   → Auto-restored to Step 1
   → Toast: "Welcome back"
7. Completes all steps
   → localStorage cleared automatically
   → Onboarding complete ✅
```

### Flow 2: Returning User (Mid-Onboarding)
```
1. User logs in with saved progress
2. OnboardingFlow detects localStorage data
3. Matches email → Restores progress
4. Lands on Step 3 (where they left off)
5. Toast: "Welcome back... continue where you left off"
6. "Start Fresh" button visible in header
7. User can either:
   a) Continue from Step 3 → Complete normally
   b) Click "Start Fresh" → Reset to Step 0
```

### Flow 3: User Wants to Start Over
```
1. User at Step 4 of onboarding
2. Realizes they want different approach
3. Clicks "Start Fresh" button
4. Confirmation dialog appears:
   "Are you sure you want to start fresh? This will clear all your saved progress..."
5. User confirms
6. localStorage cleared
7. State resets to Step 0
8. All form fields cleared (except Google data)
9. Toast: "Starting fresh. Your onboarding progress has been cleared."
```

### Flow 4: Accidental Exit
```
1. User working on Step 2
2. Accidentally clicks "Exit" button
3. Confirmation dialog:
   "Exit onboarding? Your current responses will be saved..."
4. User can:
   a) Cancel → Stay in onboarding
   b) Confirm → Progress saved, exits gracefully
5. If confirmed:
   → localStorage updated
   → Toast: "Onboarding paused. Come back anytime..."
   → Navigates to assessment-invite page
```

### Flow 5: Completion
```
1. User on final step (Step 6)
2. Fills in mood selection
3. Clicks "Complete Setup"
4. Form data collected
5. localStorage.removeItem() called
6. onComplete(profileData) triggered
7. Backend receives profile data
8. User forwarded to dashboard
9. No residual localStorage data ✅
```

---

## Technical Architecture

### State Management
```typescript
interface StoredProgress {
  email: string | null;
  currentStep: number;
  profileData: ProfileData;
  securityQuestionSaved: boolean;
  hasSkippedProfileDetails: boolean;
  savedAt: string; // ISO timestamp
}
```

### Lifecycle Hooks

#### 1. **Load Saved Progress** (on mount)
```typescript
useEffect(() => {
  // Load from localStorage
  // Match by email
  // Restore state
  // Show toast
}, [push, sanitizedEmail]);
```

#### 2. **Auto-Save** (on state change)
```typescript
useEffect(() => {
  if (!hasLoadedStoredProgress) return;
  saveProgressToStorage(); // No toast
}, [currentStep, profileData, saveProgressToStorage, securityQuestionSaved, hasLoadedStoredProgress, hasSkippedProfileDetails]);
```

### Data Persistence Strategy

**When to Save:**
- ✅ After each step change
- ✅ After any form field update
- ✅ On "Save & Exit" button click
- ✅ On "Exit" button click (safety net)

**When to Clear:**
- ✅ On successful onboarding completion
- ✅ On "Start Fresh" button click
- ❌ Never cleared on login (intentional)

**Email Isolation:**
```typescript
const sanitizedEmail = user?.email?.toLowerCase() || null;

// On save:
const payload = {
  email: sanitizedEmail, // Store user email
  currentStep,
  profileData,
  // ...
};

// On restore:
if (stored.email && stored.email !== sanitizedEmail) {
  // Mismatch → Don't restore
  return;
}
```

---

## UI/UX Improvements

### Header Layout
```
┌─────────────────────────────────────────────────────────┐
│ [Start Fresh]              [Save & Exit]  [Exit]        │
│  (if step>0)               (outline)      (ghost)       │
└─────────────────────────────────────────────────────────┘
```

**Responsive Behavior:**
- Mobile: Buttons stack vertically
- Desktop: Horizontal layout
- Icons for visual clarity
- Tooltips on hover (future enhancement)

### Toast Notifications

| Action | Toast |
|--------|-------|
| Progress Saved | ✅ "Progress saved" - "We stored your onboarding steps..." |
| Welcome Back | ℹ️ "Welcome back" - "We restored your previous progress..." |
| Start Fresh | ✅ "Starting fresh" - "Your onboarding progress has been cleared" |
| Exit | ℹ️ "Onboarding paused" - "Come back anytime..." |
| Clear Error | ❌ "Error" - "Failed to clear progress. Please try again." |

### Confirmation Dialogs

**Exit Confirmation:**
```javascript
window.confirm('Exit onboarding? Your current responses will be saved so you can continue later.');
```

**Start Fresh Confirmation:**
```javascript
window.confirm('Are you sure you want to start fresh? This will clear all your saved progress and start from the beginning.');
```

---

## Edge Cases Handled

### 1. **Multiple Users on Same Device**
✅ **Solution:** Email-based isolation
- Each user's progress stored with their email
- Restored only if email matches
- No data contamination

### 2. **localStorage Disabled/Full**
✅ **Solution:** Try-catch blocks
```typescript
try {
  localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(payload));
} catch (error) {
  console.error('Failed to persist onboarding progress:', error);
  // App continues, just no persistence
}
```

### 3. **Corrupted localStorage Data**
✅ **Solution:** JSON parsing wrapped in try-catch
```typescript
try {
  const stored: StoredProgress = JSON.parse(storedRaw);
  // Use stored data
} catch (error) {
  console.error('Failed to restore onboarding progress:', error);
  // Start fresh silently
}
```

### 4. **User Logs Out Mid-Onboarding**
✅ **Solution:** Progress persists in localStorage
- Data remains until explicitly cleared
- Next login restores (if same email)
- Different user won't see old data

### 5. **Browser Back Button**
✅ **Solution:** React state-based navigation
- Back button doesn't affect onboarding flow
- Use "Previous" button for step navigation
- Progress auto-saved regardless

### 6. **Page Refresh**
✅ **Solution:** Auto-restore from localStorage
- User remains at same step
- All form data intact
- No data loss

---

## Security & Privacy

### Data Stored in localStorage
```json
{
  "email": "user@example.com",
  "currentStep": 3,
  "profileData": {
    "firstName": "John",
    "lastName": "Doe",
    "birthday": "1990-01-15",
    "gender": "male",
    "region": "United States",
    "dataConsent": true,
    "clinicianSharing": false,
    "approach": "hybrid",
    "emergencyContact": "Jane Doe",
    "emergencyPhone": "+1234567890",
    "currentMood": "Good"
  },
  "securityQuestionSaved": true,
  "hasSkippedProfileDetails": false,
  "savedAt": "2025-10-15T12:34:56.789Z"
}
```

**Sensitive Data:**
- ⚠️ Personal information (name, birthday, emergency contacts)
- ⚠️ Health-related data (mood, preferences)
- ⚠️ Email address

**Mitigations:**
1. **localStorage is domain-scoped** - Only your app can access
2. **HTTPS enforced** - Prevents network interception
3. **Auto-cleared on completion** - No long-term storage
4. **User can manually clear** - "Start Fresh" button
5. **No passwords stored** - Security question saved separately via API

**Best Practices:**
- ✅ Clear on completion
- ✅ Email-based isolation
- ✅ Timestamp for debugging
- ❌ Don't store passwords/tokens
- ❌ Don't persist sensitive medical data permanently

---

## Testing Checklist

### Functional Tests
- [x] ✅ Progress saves on step change
- [x] ✅ Progress saves on form field change
- [x] ✅ "Save & Exit" button saves and exits
- [x] ✅ "Exit" button confirms before exit
- [x] ✅ "Start Fresh" button shows when currentStep > 0
- [x] ✅ "Start Fresh" confirms before reset
- [x] ✅ Auto-restore on login with matching email
- [x] ✅ No restore if email doesn't match
- [x] ✅ localStorage cleared on onboarding completion
- [x] ✅ Toast notifications display correctly

### Edge Case Tests
- [x] ✅ Multiple users on same device (email isolation)
- [x] ✅ localStorage disabled (graceful degradation)
- [x] ✅ Corrupted localStorage data (JSON parse error)
- [x] ✅ Page refresh mid-onboarding (state restored)
- [x] ✅ Browser back button (no effect)
- [x] ✅ Logout and login (progress persists)

### UX Tests
- [x] ✅ Button labels are clear
- [x] ✅ Icons match button actions
- [x] ✅ Confirmation dialogs have clear messaging
- [x] ✅ Toast messages are informative
- [x] ✅ Layout responsive on mobile
- [x] ✅ Keyboard navigation works

---

## Future Enhancements

### 1. **Backend Persistence** (Recommended)
Currently progress is only saved in localStorage (client-side).

**Proposed:**
```typescript
// Save to backend after each step
const saveProgressToBackend = async () => {
  await api.post('/user/onboarding-progress', {
    currentStep,
    profileData,
    updatedAt: new Date().toISOString()
  });
};

// Restore from backend on login
const restoreFromBackend = async () => {
  const response = await api.get('/user/onboarding-progress');
  if (response.data) {
    setCurrentStep(response.data.currentStep);
    setProfileData(response.data.profileData);
  }
};
```

**Benefits:**
- ✅ Cross-device sync
- ✅ Survives browser data clearing
- ✅ Better security (server-side encryption)
- ✅ Analytics tracking

### 2. **Progress Expiration**
```typescript
const PROGRESS_EXPIRY_DAYS = 30;

// Check if saved progress is too old
const isProgressExpired = (savedAt: string) => {
  const saveDate = new Date(savedAt);
  const now = new Date();
  const daysDiff = (now.getTime() - saveDate.getTime()) / (1000 * 60 * 60 * 24);
  return daysDiff > PROGRESS_EXPIRY_DAYS;
};

// Clear expired progress
if (stored.savedAt && isProgressExpired(stored.savedAt)) {
  localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  return;
}
```

### 3. **Partial Completion Badges**
Show visual indicators of what's completed:

```tsx
<div className="flex gap-2 mb-4">
  {steps.map((step, index) => (
    <div 
      key={index}
      className={`w-8 h-8 rounded-full flex items-center justify-center ${
        index < currentStep ? 'bg-green-500 text-white' :
        index === currentStep ? 'bg-primary text-white' :
        'bg-gray-200 text-gray-500'
      }`}
    >
      {index < currentStep ? '✓' : index + 1}
    </div>
  ))}
</div>
```

### 4. **Save Timestamps in UI**
```tsx
{stored.savedAt && (
  <p className="text-xs text-muted-foreground">
    Last saved: {formatDistanceToNow(new Date(stored.savedAt))} ago
  </p>
)}
```

### 5. **Export Progress**
Allow users to download their progress as JSON:

```typescript
const exportProgress = () => {
  const dataStr = JSON.stringify(profileData, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
  const exportFileDefaultName = `onboarding-progress-${new Date().toISOString()}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};
```

---

## API Integration

### Current Implementation
Onboarding completion sends all data at once:

```typescript
// frontend/src/App.tsx
const completeOnboardingFlow = async (profileData: {...}) => {
  if (profileData.approach) {
    const updatedUser = await completeOnboarding(profileData.approach, profileData);
    if (updatedUser) {
      setUser(updatedUser);
      setCurrentPage('assessment-invite');
    }
  }
};
```

### Backend Endpoint
```typescript
// backend/src/controllers/auth.ts
export async function completeOnboardingHandler(req: Request, res: Response) {
  const { approach, ...profileData } = req.body;
  
  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      approach,
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      birthday: profileData.birthday,
      gender: profileData.gender,
      region: profileData.region,
      emergencyContact: profileData.emergencyContact,
      emergencyPhone: profileData.emergencyPhone,
      onboardingCompleted: true,
      onboardingCompletedAt: new Date()
    }
  });
  
  res.json({ success: true, user: updatedUser });
}
```

---

## Troubleshooting

### Issue: Progress Not Saving
**Symptoms:** User exits but progress not restored on return

**Checks:**
1. Open DevTools → Application → Local Storage
2. Look for `mw-onboarding-progress` key
3. Verify JSON structure is valid

**Possible Causes:**
- localStorage disabled in browser
- Private/Incognito mode
- Browser data clearing extension
- Storage quota exceeded

**Solutions:**
```typescript
// Check if localStorage is available
const isLocalStorageAvailable = () => {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

// Use only if available
if (isLocalStorageAvailable()) {
  saveProgressToStorage();
}
```

### Issue: Wrong User's Data Restored
**Symptoms:** User A sees User B's onboarding progress

**Check:**
```typescript
console.log('Current user:', sanitizedEmail);
console.log('Stored email:', stored.email);
```

**Solution:**
Ensure email matching is working:
```typescript
if (stored.email && stored.email !== sanitizedEmail) {
  console.log('Email mismatch - not restoring');
  return;
}
```

### Issue: "Start Fresh" Not Working
**Symptoms:** Button click doesn't reset

**Debug:**
```typescript
const handleStartFresh = () => {
  console.log('Start Fresh clicked');
  const confirmReset = window.confirm('...');
  console.log('User confirmed:', confirmReset);
  
  if (!confirmReset) {
    console.log('User cancelled');
    return;
  }
  
  console.log('Clearing localStorage...');
  localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  console.log('localStorage cleared');
  
  // Reset state
  setCurrentStep(0);
  console.log('State reset complete');
};
```

---

## Performance Considerations

### localStorage Operations
- **Read:** ~0.1ms (negligible)
- **Write:** ~1-2ms (acceptable)
- **JSON.parse/stringify:** ~0.5ms for onboarding data

**Optimization:**
- Debounce auto-save to avoid excessive writes
- Compress data if payload grows large
- Use binary encoding for storage efficiency

### Current Data Size
```javascript
JSON.stringify(payload).length // ~500-800 bytes
```

**localStorage Limit:** 5-10MB (browser-dependent)
**Current Usage:** <1KB
**Headroom:** Plenty ✅

---

## Accessibility

### Keyboard Navigation
- ✅ Tab to "Start Fresh" button
- ✅ Tab to "Save & Exit" button
- ✅ Tab to "Exit" button
- ✅ Enter/Space to activate buttons

### Screen Readers
- ✅ Button labels are descriptive
- ✅ Icons have aria-labels (via lucide-react)
- ✅ Confirmation dialogs read by screen reader

### ARIA Attributes
```tsx
<Button
  variant="outline"
  size="sm"
  onClick={handleStartFresh}
  aria-label="Start onboarding from the beginning"
>
  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
  Start Fresh
</Button>
```

---

## Related Files

- **Main Component:** `frontend/src/components/features/onboarding/OnboardingFlow.tsx`
- **App Integration:** `frontend/src/App.tsx` (lines 929-933)
- **Backend Handler:** `backend/src/controllers/auth.ts` (completeOnboardingHandler)
- **API Service:** `frontend/src/services/auth.ts` (completeOnboarding)

---

## Changelog

### Version 1.2.0 (Current)
- ✅ Added "Start Fresh" button
- ✅ Clear localStorage on onboarding completion
- ✅ Enhanced exit buttons (Save & Exit, Exit)
- ✅ Improved toast messages
- ✅ Email-based progress isolation

### Version 1.1.0
- ✅ Auto-save progress on state change
- ✅ Auto-restore on login
- ✅ "Save & Continue" button
- ✅ "Exit onboarding" button

### Version 1.0.0
- ✅ Basic onboarding flow
- ✅ 7 steps with validation
- ✅ Profile data collection

---

**Status:** ✅ Production Ready  
**Last Updated:** October 15, 2025  
**Maintained By:** Development Team
