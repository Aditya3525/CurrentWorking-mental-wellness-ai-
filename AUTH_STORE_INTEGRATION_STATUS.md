# Auth Store Integration - In Progress

**Date:** October 16, 2025  
**Status:** PARTIAL INTEGRATION - REFACTORING REQUIRED

---

## 🎯 Objective

Replace `useState` for user authentication with Zustand's `useAuthStore` in App.tsx.

---

## 📊 Current Status

### **Completed** ✅
1. ✅ Added `useAuthStore` import to App.tsx
2. ✅ Replaced `const [user, setUser] = useState<User | null>(null)` with Zustand selectors
3. ✅ Imported store actions: `setUser`, `updateUser`, `logout`

### **Challenge Identified** ⚠️

The existing code uses **callback-based setState** extensively:

```typescript
// Current pattern (doesn't work with Zustand's setUser)
setUser(prev => {
  if (!prev) return prev;
  return { ...prev, assessmentScores: newScores };
});
```

**Problem:** Zustand's `setUser` expects `User | null`, not a callback function.

**Occurrences:** ~15+ places in App.tsx use this pattern

---

## 🔄 Required Refactoring

### **Option 1: Use `updateUser` for Partial Updates (Recommended)**

Replace callback-based updates with `updateUser`:

**Before:**
```typescript
setUser(prev => prev ? { ...prev, isOnboarded: true } : null);
```

**After:**
```typescript
if (user) {
  updateUser({ isOnboarded: true });
}
```

### **Option 2: Enhance Auth Store with Callback Support**

Add a new method to auth store:

```typescript
updateUserCallback: (updater: (user: User | null) => User | null) =>
  set((state) => ({
    user: updater(state.user),
    isAuthenticated: !!updater(state.user),
  })),
```

---

## 📝 Locations Requiring Updates

### **1. Assessment Score Updates** (3 locations)
Lines: 246, 446, 502

**Pattern:**
```typescript
setUser(prev => {
  if (!prev) return prev;
  return { ...prev, assessmentScores: mergedScores };
});
```

**Fix:**
```typescript
if (user) {
  updateUser({ assessmentScores: mergedScores });
}
```

### **2. Onboarding Completion** (1 location)
Line: 766

**Pattern:**
```typescript
setUser(prev => prev ? { ...prev, isOnboarded: true } : null);
```

**Fix:**
```typescript
if (user) {
  updateUser({ isOnboarded: true });
}
```

### **3. Direct User Sets** (5+ locations)
Lines: 545, 575, 613, 667, 753, 795, 857, 862

**Pattern:**
```typescript
setUser({
  id: data.id,
  name: data.name,
  // ...other fields
});
```

**Fix:** ✅ These work as-is (no change needed)

---

## 🚧 Implementation Plan

### **Phase 1: Update Callback-Based setUser Calls**
1. Find all `setUser(prev =>` calls
2. Replace with conditional `updateUser()` calls
3. Handle null user cases explicitly

### **Phase 2: Update Logout Flow**
1. Replace `setUser(null)` with `logoutStore()`
2. Ensure tokens are cleared
3. Update navigation logic

### **Phase 3: Verify Dependencies**
1. Fix useEffect dependencies
2. Remove callback functions from dependency arrays
3. Add store methods if needed

### **Phase 4: Test Integration**
1. Test login flow
2. Test logout flow
3. Test user updates (onboarding, profile, assessments)
4. Verify localStorage persistence

---

## 💡 Lessons Learned

### **Zustand vs useState Differences**

| Feature | useState | Zustand |
|---------|----------|---------|
| Callback updates | ✅ Supported | ❌ Not supported |
| Direct updates | ✅ Supported | ✅ Supported |
| Persistence | Manual | ✅ Built-in |
| Global access | ❌ No | ✅ Yes |
| Re-render optimization | Manual | ✅ Automatic |

### **Best Practices**

1. ✅ **Use `updateUser` for partial updates**
   ```typescript
   updateUser({ isOnboarded: true });
   ```

2. ✅ **Check for null before updating**
   ```typescript
   if (user) {
     updateUser({ /* updates */ });
   }
   ```

3. ✅ **Use `setUser` for complete replacement**
   ```typescript
   setUser(newUserObject);
   setUser(null); // logout
   ```

4. ❌ **Avoid callback-based updates**
   ```typescript
   // Don't do this
   setUser(prev => ({ ...prev, field: value }));
   ```

---

## 🎯 Next Steps

### **Immediate:**
1. **Refactor callback setUser calls** - Replace ~15 occurrences
2. **Update logout** - Use `logoutStore()` instead of `setUser(null)`
3. **Fix useEffect dependencies** - Add store methods to arrays

### **After Refactoring:**
1. Test all authentication flows
2. Verify localStorage persistence
3. Check for memory leaks
4. Document any API changes

---

## 📊 Estimated Effort

| Task | Effort | Status |
|------|--------|--------|
| Identify patterns | 15 min | ✅ Complete |
| Refactor callback updates | 30-45 min | ⏳ Pending |
| Update logout flow | 15 min | ⏳ Pending |
| Fix dependencies | 15 min | ⏳ Pending |
| Testing | 30 min | ⏳ Pending |
| **Total** | **2 hours** | **20% Complete** |

---

## 🤔 Decision Point

**Should we:**

**A) Continue with full refactoring** (2 hours)
- Complete auth store integration
- Cleaner code architecture
- Better performance

**B) Pause and move to React Query** (recommended)
- Come back to auth store later
- Focus on data fetching improvements first
- Less risky, incremental progress

**C) Enhance auth store to support callbacks**
- Faster migration
- Less code changes
- Maintains existing patterns

---

## 📝 Recommendation

**Option B: Pause and focus on React Query integration**

**Reasoning:**
1. React Query hooks are independent of auth changes
2. Less risky - fewer breaking changes
3. Can be tested separately
4. Auth store refactoring can be done more carefully later

**Next:** Integrate React Query for assessments, mood, and chat data fetching.

---

**Status:** PAUSED - Waiting for decision  
**Last Updated:** October 16, 2025
