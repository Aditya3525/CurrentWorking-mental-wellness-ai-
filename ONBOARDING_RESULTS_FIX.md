# Onboarding Assessment Results Page - Behavior Fix

## Issue Description
The onboarding assessment results page was automatically redirecting to the dashboard after a few seconds, preventing users from fully reviewing their insights.

## Changes Made

### 1. **Removed Automatic Redirection** (`frontend/src/App.tsx`)
   
   **Before:** After completing an assessment, the insights page would automatically redirect to the dashboard after 6 seconds via a `useEffect` hook.
   
   **After:** Commented out the auto-redirect `useEffect` hook (lines 188-198):
   ```typescript
   // Removed automatic redirect - users now manually navigate via button
   // useEffect(() => {
   //   if (currentPage === 'insights' && postAssessmentRedirect) {
   //     const timer = window.setTimeout(() => {
   //       setPostAssessmentRedirect(null);
   //       setCurrentPage(postAssessmentRedirect);
   //     }, 6000);
   //     return () => window.clearTimeout(timer);
   //   }
   //   return undefined;
   // }, [currentPage, postAssessmentRedirect]);
   ```

### 2. **Removed postAssessmentRedirect State** (`frontend/src/App.tsx`)
   
   Since we're no longer using automatic redirection, removed the `postAssessmentRedirect` state and all its usages:
   - Removed state declaration: `const [postAssessmentRedirect, setPostAssessmentRedirect] = useState<'dashboard' | null>(null);`
   - Removed `setPostAssessmentRedirect(null)` calls from:
     - `beginOverallAssessment()` function
     - `completeCombinedAssessment()` function
     - `completeAssessment()` function

### 3. **Added "Go to Dashboard" Button** (`frontend/src/components/features/assessment/InsightsResults.tsx`)
   
   **Before:** Only had a "Back to Dashboard" ghost button on the left side of the header.
   
   **After:** Added a prominent "Go to Dashboard" button on the right side of the header:
   ```tsx
   <div className="flex items-center justify-between gap-4 mb-6">
     <Button variant="ghost" size="sm" onClick={() => onNavigate('dashboard')}>
       <ArrowLeft className="h-4 w-4 mr-2" />
       Back to Dashboard
     </Button>
     <Button onClick={() => onNavigate('dashboard')}>
       Go to Dashboard
     </Button>
   </div>
   ```

## User Experience Improvements

### Before:
1. ❌ User completes assessment
2. ❌ Results page loads
3. ❌ After 6 seconds, page automatically redirects to dashboard
4. ❌ User loses access to insights if they want to review them longer

### After:
1. ✅ User completes assessment
2. ✅ Results page loads with full insights
3. ✅ Page stays on results indefinitely
4. ✅ User can review insights at their own pace
5. ✅ User manually clicks "Go to Dashboard" button when ready to leave
6. ✅ "Back to Dashboard" link also available for quick navigation

## Benefits

1. **Better User Control**: Users can now spend as much time as needed reviewing their assessment results and insights
2. **Improved Accessibility**: No time pressure to read through potentially important mental health information
3. **Clear Navigation**: Prominent "Go to Dashboard" button makes it obvious how to proceed
4. **No Unexpected Behavior**: Eliminates the jarring auto-redirect that could interrupt user reading

## Testing Recommendations

To verify the fix works correctly:

1. Start both backend and frontend servers
2. Complete the onboarding flow with multiple assessments selected
3. Wait on the results/insights page for more than 6 seconds
4. Verify the page **does not** automatically redirect
5. Click the "Go to Dashboard" button
6. Verify navigation to dashboard works correctly

## Files Modified

1. `frontend/src/App.tsx`
   - Commented out auto-redirect useEffect
   - Removed postAssessmentRedirect state and all usages

2. `frontend/src/components/features/assessment/InsightsResults.tsx`
   - Added "Go to Dashboard" button to header
   - Updated header layout to justify-between for button placement

## Related Issues

This fix addresses both requirements from the user request:
1. ✅ Stop automatic redirection behavior after few seconds
2. ✅ Add button to navigate to dashboard manually
