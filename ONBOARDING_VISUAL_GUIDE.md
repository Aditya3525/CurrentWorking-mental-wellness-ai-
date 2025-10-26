# Onboarding Flow - Visual Guide

## Before vs After

### BEFORE (Original Implementation)
```
┌─────────────────────────────────────────────────┐
│                         [Exit onboarding]       │
├─────────────────────────────────────────────────┤
│ Step 2 of 7                         28% complete│
│ ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
├─────────────────────────────────────────────────┤
│                                                 │
│          Safety & Privacy                       │
│   Your wellbeing and privacy are our...        │
│                                                 │
│  ⚠️  Important Safety Notice                    │
│  This app is designed for general...           │
│                                                 │
│  ☐ I understand that my responses...           │  ← Individual clicks
│  ☐ (Optional) Allow me to share...             │  ← Individual clicks
│                                                 │
│  • Your data is never sold...                  │
│  • All personal information...                 │
│  • You can export or delete...                 │
│                                                 │
├─────────────────────────────────────────────────┤
│  [← Previous]                        [Next →]  │
└─────────────────────────────────────────────────┘

Issues:
❌ No "Select All" for consent checkboxes
❌ No way to restart from scratch
❌ Unclear exit behavior (saves or not?)
❌ localStorage persists after completion
❌ Only one exit button (confusing purpose)
```

---

### AFTER (Enhanced Implementation)
```
┌─────────────────────────────────────────────────┐
│ [Start Fresh]    [Save & Exit]  [Exit]          │  ← NEW: 3 clear buttons
│  (if step>0)                                    │
├─────────────────────────────────────────────────┤
│ Step 2 of 7                         28% complete│
│ ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
├─────────────────────────────────────────────────┤
│                                                 │
│          Safety & Privacy                       │
│   Your wellbeing and privacy are our...        │
│                                                 │
│  ⚠️  Important Safety Notice                    │
│  This app is designed for general...           │
│                                                 │
│                      [✓ Select All]  ← NEW      │
│  ☑ I understand that my responses...           │
│  ☑ (Optional) Allow me to share...             │
│                                                 │
│  • Your data is never sold...                  │
│  • All personal information...                 │
│  • You can export or delete...                 │
│                                                 │
├─────────────────────────────────────────────────┤
│  [← Previous]                        [Next →]  │
└─────────────────────────────────────────────────┘

Improvements:
✅ "Select All" button for quick consent
✅ "Start Fresh" resets to beginning
✅ "Save & Exit" explicitly saves progress
✅ "Exit" confirms before closing
✅ localStorage auto-cleared on completion
✅ Progress auto-saved on every change
✅ Email-based isolation (multi-user)
```

---

## Feature Breakdown

### 1. Select All Button

**Location:** Above consent checkboxes (Step 2)

**States:**
```
When NOT all selected:
┌────────────────┐
│ ✓ Select All   │  ← Click to check all
└────────────────┘

When ALL selected:
┌────────────────┐
│ ✗ Deselect All │  ← Click to uncheck all
└────────────────┘
```

**Behavior:**
- Smart toggle based on current state
- Icon changes (✓ or ✗)
- Label changes dynamically
- Works with individual checkbox clicks

---

### 2. Start Fresh Button

**Visibility:**
```
Step 0 (Welcome):
┌─────────────────────────────────────────────────┐
│                    [Save & Exit]  [Exit]        │  ← No Start Fresh
│         (empty space)                           │     (nothing to reset)
└─────────────────────────────────────────────────┘

Step 1+ (Any other step):
┌─────────────────────────────────────────────────┐
│ [⚠️ Start Fresh]   [Save & Exit]  [Exit]        │  ← Start Fresh visible
└─────────────────────────────────────────────────┘
```

**Confirmation Dialog:**
```
┌────────────────────────────────────────────────┐
│  Are you sure you want to start fresh?        │
│  This will clear all your saved progress      │
│  and start from the beginning.                │
│                                                │
│            [Cancel]  [OK]                      │
└────────────────────────────────────────────────┘
```

**On Confirm:**
1. localStorage cleared
2. State reset to Step 0
3. All form fields cleared
4. Toast: "Starting fresh"

---

### 3. Enhanced Exit Buttons

#### Save & Exit (Outline Style)
```
┌──────────────────┐
│ 💾 Save & Exit   │  ← Primary exit option
└──────────────────┘
```
**Behavior:**
- Saves to localStorage
- Shows success toast
- Navigates away
- User confident data is saved

#### Exit (Ghost Style)
```
┌──────────────────┐
│ 🚪 Exit          │  ← Secondary option
└──────────────────┘
```
**Behavior:**
- Confirms first
- Still saves (safety net)
- Less prominent
- For quick exit

**Confirmation Dialog:**
```
┌────────────────────────────────────────────────┐
│  Exit onboarding?                              │
│  Your current responses will be saved so you   │
│  can continue later.                           │
│                                                │
│            [Cancel]  [OK]                      │
└────────────────────────────────────────────────┘
```

---

### 4. Progress Persistence Flow

#### Saving Progress
```
User Action              → localStorage         → Toast
────────────────────────────────────────────────────────
Change form field        → Auto-saved           → (none)
Navigate to next step    → Auto-saved           → (none)
Click "Save & Exit"      → Explicitly saved     → "Progress saved"
Click "Exit"             → Auto-saved (safety)  → "Onboarding paused"
```

#### Restoring Progress
```
Login Event              → localStorage Check   → Result
────────────────────────────────────────────────────────
First-time user          → No data found        → Start at Step 0
Returning user           → Data found           → Restore + Toast
Different user           → Email mismatch       → Start at Step 0
Completed user           → No data (cleared)    → Start at Step 0
```

#### Email Isolation
```
User A:
email: "alice@example.com"
progress: { email: "alice@example.com", step: 3, ... }
                    ↓
localStorage: "mw-onboarding-progress"

User B logs in:
email: "bob@example.com"
Checks localStorage → email mismatch → Don't restore
User B sees fresh onboarding (Step 0)
```

---

## User Journeys

### Journey 1: Happy Path (First-Time User)
```
Step  Action                         localStorage              UI State
──────────────────────────────────────────────────────────────────────────
0     Land on welcome                 (empty)                  Welcome screen
1     Click "Next"                    { step: 1, ... }         Basic Profile
2     Fill name, birthday             { step: 1, name: ... }   Form filled
3     Click "Next"                    { step: 2, ... }         Safety & Privacy
4     Click "Select All"              { step: 2, consent: T }  Both checked ✅
5     Click "Next"                    { step: 3, ... }         Emergency Contact
6     Click "Save & Exit"             { step: 3, ... }         Toast: "Progress saved"
      → Navigate away
7     Log in next day                 Restore { step: 3 }      Toast: "Welcome back"
8     Continue to Step 7              { step: 7, ... }         Final step
9     Click "Complete Setup"          localStorage cleared     Dashboard
```

### Journey 2: User Restarts Mid-Flow
```
Step  Action                         localStorage              UI State
──────────────────────────────────────────────────────────────────────────
0     Resume at Step 4                { step: 4, ... }         Approach selection
1     Realize mistake                 —                        —
2     Click "Start Fresh"             —                        Confirmation dialog
3     Confirm reset                   localStorage cleared     Step 0
4     All fields reset                (empty)                  Fresh start
5     Toast notification              —                        "Starting fresh"
```

### Journey 3: Accidental Exit
```
Step  Action                         localStorage              UI State
──────────────────────────────────────────────────────────────────────────
0     Working on Step 2               { step: 2, ... }         Safety & Privacy
1     Accidentally click "Exit"       —                        Confirmation dialog
2     Cancel                          { step: 2, ... }         Stay on Step 2
      OR
2     Confirm                         { step: 2, ... }         Navigate away
3     Toast notification              —                        "Onboarding paused"
4     Log in later                    Restore { step: 2 }      Continue from Step 2
```

---

## Toast Notifications

### Visual Design
```
Success Toast:
┌────────────────────────────────────────┐
│ ✅  Progress saved                      │
│     We stored your onboarding steps.   │
│     You can return anytime to continue.│
└────────────────────────────────────────┘

Info Toast:
┌────────────────────────────────────────┐
│ ℹ️  Welcome back                        │
│     We restored your previous          │
│     onboarding progress so you can     │
│     continue where you left off.       │
└────────────────────────────────────────┘

Success Toast (Start Fresh):
┌────────────────────────────────────────┐
│ ✅  Starting fresh                      │
│     Your onboarding progress has       │
│     been cleared.                      │
└────────────────────────────────────────┘

Info Toast (Exit):
┌────────────────────────────────────────┐
│ ℹ️  Onboarding paused                   │
│     Come back anytime—your progress    │
│     is waiting.                        │
└────────────────────────────────────────┘

Error Toast:
┌────────────────────────────────────────┐
│ ❌  Error                               │
│     Failed to clear progress.          │
│     Please try again.                  │
└────────────────────────────────────────┘
```

---

## Button States

### Start Fresh Button
```
Default:
┌─────────────────┐
│ ⚠️ Start Fresh  │  ← Warning icon
└─────────────────┘

Hover:
┌─────────────────┐
│ ⚠️ Start Fresh  │  ← Background darkens
└─────────────────┘

Pressed:
┌─────────────────┐
│ ⚠️ Start Fresh  │  ← Slight scale down
└─────────────────┘

Hidden (Step 0):
(not rendered)
```

### Select All Button
```
When NOT all selected:
┌────────────────┐
│ ✓ Select All   │  ← Check icon
└────────────────┘

When ALL selected:
┌────────────────┐
│ ✗ Deselect All │  ← X icon
└────────────────┘
```

### Exit Buttons
```
Save & Exit (Outline):
┌──────────────────┐
│ 💾 Save & Exit   │  ← Bordered, prominent
└──────────────────┘

Exit (Ghost):
┌──────────────────┐
│ 🚪 Exit          │  ← Subtle, muted color
└──────────────────┘
```

---

## localStorage Data Structure

### Stored Progress Object
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
    "clinicianSharing": true,
    "approach": "hybrid",
    "emergencyContact": "Jane Doe",
    "emergencyPhone": "+1-555-0123",
    "currentMood": "Good"
  },
  "securityQuestionSaved": true,
  "hasSkippedProfileDetails": false,
  "savedAt": "2025-10-15T14:23:45.789Z"
}
```

### Size: ~600-800 bytes

---

## Responsive Design

### Desktop (>768px)
```
┌─────────────────────────────────────────────────────────┐
│ [Start Fresh]              [Save & Exit]  [Exit]        │
│                                                          │
│  Step 2 of 7                               28% complete │
│  ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│                                                          │
│          [Card content...]                               │
└─────────────────────────────────────────────────────────┘
```

### Mobile (<768px)
```
┌────────────────────────┐
│ [Start Fresh]          │
│                        │
│ [Save & Exit]          │
│ [Exit]                 │
├────────────────────────┤
│ Step 2 of 7            │
│ 28% complete           │
│ ████████░░░░░░░░░░░░░░│
│                        │
│ [Card content...]      │
└────────────────────────┘
```

---

## Keyboard Navigation

### Tab Order
```
1. [Start Fresh]
   ↓ Tab
2. [Save & Exit]
   ↓ Tab
3. [Exit]
   ↓ Tab
4. Form fields...
   ↓ Tab
5. [Select All] (if on Step 2)
   ↓ Tab
6. Checkboxes...
   ↓ Tab
7. [Previous]
   ↓ Tab
8. [Next]
   ↓ Shift+Tab (goes back)
```

### Keyboard Shortcuts
- **Tab**: Move focus forward
- **Shift+Tab**: Move focus backward
- **Enter/Space**: Activate focused button
- **Esc**: Close confirmation dialogs

---

## Error Handling

### localStorage Not Available
```javascript
try {
  localStorage.setItem(ONBOARDING_STORAGE_KEY, data);
} catch (error) {
  console.error('Failed to persist:', error);
  // App continues, just no persistence
  // No crash, graceful degradation
}
```

### Corrupted Data
```javascript
try {
  const stored = JSON.parse(localStorage.getItem(KEY));
  // Use stored data
} catch (error) {
  console.error('Failed to restore:', error);
  // Start fresh silently
  // No error shown to user
}
```

### Clear Failure
```javascript
try {
  localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  toast.success('Starting fresh');
} catch (error) {
  console.error('Failed to clear:', error);
  toast.error('Failed to clear progress. Please try again.');
}
```

---

## Accessibility Features

### ARIA Labels
```tsx
<Button
  aria-label="Reset onboarding and start from the beginning"
  onClick={handleStartFresh}
>
  <AlertTriangle aria-hidden="true" />
  Start Fresh
</Button>
```

### Screen Reader Announcements
- "Button: Start Fresh - Reset onboarding and start from beginning"
- "Button: Select All - Check all consent options"
- "Button: Save and Exit - Save progress and return later"

### Focus Management
- Visible focus indicators
- Logical tab order
- Trapped focus in dialogs

---

## Testing Scenarios

### Scenario 1: Select All
```
1. Navigate to Step 2 (Safety & Privacy)
2. Verify "Select All" button visible
3. Click "Select All"
   → Both checkboxes checked ✅
4. Button changes to "Deselect All" ✅
5. Click "Deselect All"
   → Both checkboxes unchecked ✅
6. Button changes back to "Select All" ✅
```

### Scenario 2: Start Fresh
```
1. Progress to Step 4
2. Verify "Start Fresh" button visible
3. Click "Start Fresh"
4. Confirmation dialog appears
5. Click "Cancel"
   → Still on Step 4 ✅
6. Click "Start Fresh" again
7. Click "OK"
   → Returns to Step 0 ✅
   → localStorage cleared ✅
   → Form fields reset ✅
   → Toast shows "Starting fresh" ✅
```

### Scenario 3: Save & Exit
```
1. Progress to Step 3
2. Click "Save & Exit"
   → Progress saved to localStorage ✅
   → Toast shows "Progress saved" ✅
   → Navigate to assessment-invite ✅
3. Log in again
   → Auto-restored to Step 3 ✅
   → Toast shows "Welcome back" ✅
```

### Scenario 4: Complete Onboarding
```
1. Progress through all steps
2. Click "Complete Setup" on Step 6
   → Form submitted ✅
   → localStorage cleared ✅
   → Navigate to dashboard ✅
3. Check DevTools → localStorage
   → "mw-onboarding-progress" not found ✅
4. Log in again
   → No auto-restore (data cleared) ✅
   → Fresh onboarding (if needed) ✅
```

---

## Visual Indicators

### Progress Bar
```
Step 1 of 7 (14%):
████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░

Step 4 of 7 (57%):
████████████████████████████░░░░░░░░░░░░░░░░░░

Step 7 of 7 (100%):
████████████████████████████████████████████████
```

### Checkbox States
```
Unchecked:
☐ I understand that my responses...

Checked:
☑ I understand that my responses...

Disabled:
☐ I understand that my responses... (grayed out)
```

---

**Status:** ✅ Complete & Production Ready  
**TypeScript Errors:** 0  
**Documentation:** Comprehensive  
**Testing:** Ready for E2E
