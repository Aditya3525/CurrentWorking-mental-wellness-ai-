# Input Text Visibility Fix

## Issue
When high contrast mode was turned off, input fields in the onboarding form (and potentially other forms) showed **white text on a white/light background**, making the input text invisible to users.

## Root Cause Analysis

### CSS Reset Behavior
In `frontend/src/styles/index.css` (line 258-268), the `@layer base` section includes:

```css
button, input, select, optgroup, textarea {
  font: inherit;
  font-feature-settings: inherit;
  font-variation-settings: inherit;
  letter-spacing: inherit;
  color: inherit;  /* <-- Inherits color from parent */
  opacity: 1;
  background-color: #0000;
  border-radius: 0;
}
```

### Theme Configuration
In normal (non-high-contrast) mode:
```css
:root {
  --foreground: #2d3748;           /* Dark gray text */
  --input-background: #f7fafc;     /* Light gray/blue background */
  --input: transparent;
}
```

In high-contrast mode:
```css
:root.a11y-high-contrast {
  --foreground: oklch(.96 .02 266);  /* Light text */
  --input: oklch(.36 .03 284);       /* Dark input background */
}
```

### The Problem
The Input component (`frontend/src/components\ui\input.tsx`) was using:
- ✅ `bg-input-background` for background color
- ❌ **Missing `text-foreground`** for text color

Due to `color: inherit` in the CSS reset, the input was inheriting color from parent elements, which could be white/light in certain contexts.

## Solution

### File Modified
`frontend/src/components/ui/input.tsx`

### Change Applied
Added `text-foreground` class to explicitly set the text color:

```tsx
// BEFORE (line 11)
"file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base bg-input-background transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",

// AFTER (line 11)
"file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base text-foreground bg-input-background transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
```

**Key Addition:** `text-foreground` after `text-base`

## Impact

### Forms Affected
This fix applies to **ALL forms** using the Input component:
- ✅ Onboarding Flow (`OnboardingFlow.tsx`)
- ✅ User Login Page
- ✅ Registration Form
- ✅ All other forms across the application

### Color Behavior
**Normal Mode:**
- Background: Light gray/blue (`#f7fafc`)
- Text: Dark gray (`#2d3748`) ✅ **Now visible!**
- Placeholder: Muted gray (`#718096`)

**High-Contrast Mode:**
- Background: Dark (`oklch(.36 .03 284)`)
- Text: Light (`oklch(.96 .02 266)`)
- Already working correctly

**Dark Mode:**
- Background: Semi-transparent dark (`var(--input)` with 30% opacity)
- Text: Light (`#F5F6F7`)
- Already working correctly

## Testing Recommendations

1. **Test in Normal Mode**
   - Verify text is visible (dark on light background)
   - Check all input fields across the app

2. **Test in High-Contrast Mode**
   - Ensure text remains visible (light on dark background)
   - Verify no regression

3. **Test in Dark Mode**
   - Confirm light text on dark background
   - Check all theme transitions

4. **Specific Pages to Test**
   - `/onboarding` - "Tell us about yourself" step
   - `/login` - Email/password fields
   - `/register` - All registration inputs
   - Settings pages with text inputs

## Status
✅ **FIXED** - Input text color now explicitly set to `text-foreground` for proper contrast in all modes

## Technical Details
- **File:** `frontend/src/components/ui/input.tsx`
- **Line:** 11
- **Change Type:** Accessibility fix (CSS class addition)
- **Risk Level:** Low (additive change, improves visibility)
- **Browser Compatibility:** All modern browsers (Tailwind CSS classes)

## Related Issues
- Registration validation fix (previously completed)
- Accessibility improvements (ongoing)
