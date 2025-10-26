# Onboarding Welcome Back Toast - Infinite Loop Fix

## Issue
The "Welcome back" notification was appearing continuously in an infinite loop, filling the entire screen.

## Root Cause
The `useEffect` hook that restores onboarding progress had `push` and `sanitizedEmail` in its dependency array. This caused the effect to re-run every time the component re-rendered, creating an infinite loop of toast notifications.

```typescript
// BEFORE (Problematic code):
useEffect(() => {
  // Restore progress logic...
  
  push({
    title: 'Welcome back',
    description: 'We restored your previous onboarding progress...',
    type: 'info'
  });
}, [push, sanitizedEmail]); // ❌ These dependencies cause infinite loop
```

## Solution
Added a `hasShownWelcomeBack` state flag to ensure the toast only shows once, and changed the dependency array to `[]` so the effect only runs on component mount.

```typescript
// AFTER (Fixed code):
const [hasShownWelcomeBack, setHasShownWelcomeBack] = useState(false);

useEffect(() => {
  // Only run once on mount
  if (hasShownWelcomeBack) return;
  
  try {
    const storedRaw = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    // ... restore progress logic ...
    
    // Only show toast if there's actual progress to restore
    const hasProgress = stored.currentStep > 0 || 
      stored.profileData?.firstName || 
      stored.profileData?.approach;
    
    if (hasProgress) {
      setTimeout(() => {
        push({
          title: 'Welcome back',
          description: 'We restored your previous onboarding progress...',
          type: 'info'
        });
      }, 150);
    }
  } catch (error) {
    console.error('Failed to restore onboarding progress:', error);
  } finally {
    setHasLoadedStoredProgress(true);
    setHasShownWelcomeBack(true); // ✅ Prevents re-running
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // ✅ Only run once on mount
```

## Key Changes
1. **Added flag**: `hasShownWelcomeBack` state to track if the welcome toast has been shown
2. **Early return**: Check the flag at the start of the effect
3. **Set flag**: Mark `hasShownWelcomeBack` as `true` in the `finally` block
4. **Empty deps**: Changed dependency array to `[]` so effect only runs once on mount
5. **Progress check**: Only show toast if there's actual progress to restore (not just empty state)
6. **ESLint disable**: Added comment to suppress the exhaustive-deps warning (intentional behavior)

## Testing
After this fix:
- ✅ Toast shows only ONCE when user returns to onboarding with saved progress
- ✅ Toast does NOT show if there's no saved progress
- ✅ Toast does NOT show on every re-render
- ✅ No infinite loop

## Files Modified
- `frontend/src/components/features/onboarding/OnboardingFlow.tsx`

## Related
This completes the onboarding UX improvements from the previous session, ensuring the progress restoration feature works smoothly without overwhelming the user with duplicate notifications.
