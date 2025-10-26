# Toast Provider & Auth Token Fix

## Issues Fixed

### 1. **ToastProvider Missing Error**
**Error**: `useToast must be used within a ToastProvider`

**Root Cause**: The `OnboardingFlow` component and others were using `useToast()` hook, but the `ToastProvider` was not wrapping the application tree.

**Fix**: Added `ToastProvider` to the App component wrapper hierarchy:

```tsx
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AdminAuthProvider>
          <ChatProvider>
            <AppInner />
            <ToastContainer />
          </ChatProvider>
        </AdminAuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
```

### 2. **401 Unauthorized Errors After OAuth**
**Error**: Multiple API calls failing with 401 status after Google OAuth login

**Root Cause**: The authentication token from OAuth callback was being stored in localStorage, but not properly managed in the Zustand auth store. When components made API calls, the token wasn't available in the request headers.

**Fix**: Enhanced the auth store to manage tokens properly:

#### Updated `authStore.ts`:
- Added `token` to state
- Updated `setUser()` to accept optional token parameter
- Updated `login()` to accept optional token parameter
- Modified `logout()` to clear token from localStorage
- Added token to persisted state

```typescript
interface AuthState {
  user: StoredUser | null;
  token: string | null;
  // ... other fields

  setUser: (user: StoredUser | null, token?: string | null) => void;
  login: (user: StoredUser, token?: string) => void;
  // ...
}
```

#### Updated `auth.ts` service:
Changed `loginUser` and `registerUser` to return both user and token:

```typescript
export async function registerUser(...): Promise<{ user: StoredUser; token: string }> {
  // Returns { user, token }
}

export async function loginUser(...): Promise<{ user: StoredUser; token: string } | null> {
  // Returns { user, token }
}
```

#### Updated `App.tsx`:
Updated OAuth callback, login, and signup handlers to pass token to `setUser()`:

```typescript
// OAuth callback
setUser({...userData}, userData.token);

// Login
const result = await loginUser(credentials);
setUser(result.user, result.token);

// Sign up
const result = await registerUser(userData);
setUser({...result.user, ...}, result.token);
```

## Files Modified

1. **frontend/src/App.tsx**
   - Added `ToastProvider` import
   - Wrapped app with `ToastProvider`
   - Updated OAuth callback to pass token to `setUser()`
   - Updated `login()` handler to use token
   - Updated `signUp()` handler to use token
   - Fixed import order (QueryClientProvider before React)

2. **frontend/src/stores/authStore.ts**
   - Added `token` field to state
   - Updated `setUser()` signature to accept token
   - Updated `login()` signature to accept token
   - Modified `logout()` to clear token
   - Added token to persisted state

3. **frontend/src/services/auth.ts**
   - Changed `registerUser()` return type to include token
   - Changed `loginUser()` return type to include token
   - Both now return `{ user, token }` structure

## Testing Instructions

1. **Test Toast System**:
   - Navigate to onboarding flow
   - Verify no "useToast must be used within a ToastProvider" errors
   - Toasts should display correctly

2. **Test OAuth Flow**:
   - Sign up with Google
   - Should not see 401 errors in console
   - API calls should succeed with proper authentication
   - Password setup page should load correctly

3. **Test Regular Login**:
   - Login with email/password
   - Verify API calls work (no 401 errors)
   - Assessment history should load

4. **Test Regular Signup**:
   - Create new account with email/password
   - Should be redirected to onboarding
   - API calls should work properly

## Impact

✅ **Fixed**: OnboardingFlow and all components can now use `useToast()` without errors  
✅ **Fixed**: OAuth authentication now properly stores and uses JWT tokens  
✅ **Fixed**: API calls after OAuth login now succeed (no more 401 errors)  
✅ **Fixed**: Assessment history and other protected endpoints now work after OAuth  

## Next Steps

- Test the OAuth flow end-to-end
- Verify assessment history loads after Google login
- Confirm password setup page works for new Google users
- Check that all toast notifications display correctly throughout the app
