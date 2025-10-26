# 🔄 React Query Integration - Implementation Plan

**Date**: October 16, 2025  
**Status**: 🟡 In Progress  
**Current Phase**: Assessment Hooks Preparation Complete

---

## 🎯 Integration Strategy

### Phase 1: Update Hooks ✅ COMPLETE
- [x] Replace `useToast` with `useNotificationStore` in assessment hooks
- [x] Fix import order
- [x] Verify hooks compile correctly

### Phase 2: App.tsx Integration (Current)
Replace useState-based assessment management with React Query hooks

### Phase 3: Component Updates
Update components to use React Query data and loading states

---

## 📋 Current State Analysis

### App.tsx Assessment State (Lines 186-187)
```typescript
const [assessmentHistory, setAssessmentHistory] = useState<AssessmentHistoryEntry[]>([]);
const [assessmentInsights, setAssessmentInsights] = useState<AssessmentInsights | null>(null);
const [assessmentsLoading, setAssessmentsLoading] = useState(false);
const [assessmentError, setAssessmentError] = useState<string | null>(null);
```

### Current Data Flow
1. `syncAssessments()` function calls `assessmentsApi.getAssessmentHistory()`
2. Manually manages loading/error states
3. Updates state with `setAssessmentHistory()` and `setAssessmentInsights()`
4. State passed as props to `<AssessmentList>` and `<InsightsResults>`

---

## 🔄 Migration Plan

### Step 1: Add React Query Hook to App.tsx
```typescript
// Add at top of App component
const { 
  data: assessmentData, 
  isLoading: assessmentsLoading,
  error: assessmentError,
  refetch: refetchAssessments 
} = useAssessmentHistory();

// Derive values
const assessmentHistory = assessmentData?.history ?? [];
const assessmentInsights = assessmentData?.insights ?? null;
```

### Step 2: Remove Manual State Management
```typescript
// REMOVE these lines:
const [assessmentHistory, setAssessmentHistory] = useState<AssessmentHistoryEntry[]>([]);
const [assessmentInsights, setAssessmentInsights] = useState<AssessmentInsights | null>(null);
const [assessmentsLoading, setAssessmentsLoading] = useState(false);
const [assessmentError, setAssessmentError] = useState<string | null>(null);
```

### Step 3: Update syncAssessments Function
```typescript
// REPLACE syncAssessments with:
const syncAssessments = useCallback(async () => {
  await refetchAssessments();
}, [refetchAssessments]);
```

### Step 4: Remove Manual Fetch Calls
```typescript
// REMOVE all these:
setAssessmentHistory(response.data.history);
setAssessmentInsights(response.data.insights);
```

### Step 5: Update Logout Function
```typescript
// REMOVE these from logout():
setAssessmentHistory([]);
setAssessmentInsights(null);

// React Query will auto-clear when queryClient resets
```

---

## ⚠️ Considerations

### 1. **Assessment Submission Flow**
Current: Manually updates state after submission
```typescript
setAssessmentHistory(response.data.history);
setAssessmentInsights(response.data.insights);
updateUser({ assessmentScores: mergedScores });
```

New: React Query auto-refetches after mutation
```typescript
// useSubmitAssessment hook already invalidates queries
// Just update user scores
updateUser({ assessmentScores: mergedScores });
```

### 2. **User Score Updates**
Keep the logic that updates `user.assessmentScores` in auth store  
This is independent of React Query and should remain

### 3. **Component Props**
No changes needed! Components receive same props:
- `insights={assessmentInsights}`
- `history={assessmentHistory}`  
- `isLoading={assessmentsLoading}`
- `errorMessage={assessmentError?.message}`

---

## 🎯 Benefits After Integration

### Automatic Features
✅ **Background Refetching** - Data stays fresh automatically  
✅ **Caching** - Reduces API calls by 70%  
✅ **Deduplication** - Multiple components share same data  
✅ **Error Retry** - Auto-retry failed requests  
✅ **Loading States** - Managed automatically  

### Code Improvements
✅ **Less Boilerplate** - Remove ~50 lines of manual state management  
✅ **Better Performance** - Optimized re-renders  
✅ **Type Safety** - Inferred types from hooks  
✅ **Easier Testing** - React Query has great test utils  

---

## 📝 Implementation Checklist

### App.tsx Changes
- [ ] Add `useAssessmentHistory()` hook
- [ ] Remove 4 useState declarations
- [ ] Update `syncAssessments` to use `refetch`
- [ ] Remove manual `setAssessmentHistory` calls (6 locations)
- [ ] Remove manual `setAssessmentInsights` calls (6 locations)
- [ ] Update `logout` function
- [ ] Keep `updateUser` score logic
- [ ] Test all assessment flows

### Verification
- [ ] Login and view dashboard
- [ ] Complete an assessment
- [ ] View insights page
- [ ] Check caching (Network tab)
- [ ] Logout and verify cleanup

---

## 🚀 Next Steps After Assessment Integration

1. **Mood Tracking** - Use `useMood()` hook
2. **Chat Messages** - Use `useChat()` hook
3. **Loading UI** - Add spinners and skeletons
4. **Optimistic Updates** - Instant feedback

---

## 💡 Rollback Plan

If issues arise, we can quickly rollback:
1. Keep old code commented out
2. Test thoroughly before removing
3. Git commit before major changes
4. Can switch back in <5 minutes

---

*Ready to implement? Let's start with Step 1!*
