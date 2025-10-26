# Quick Testing Guide - UX Improvements

## 🚀 Quick Start

### Prerequisites
```powershell
# Ensure you have Node.js installed
node --version  # Should be v18 or higher
npm --version   # Should be v9 or higher
```

### 1. Start the Application

```powershell
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm install
npm run dev
```

Frontend will be available at: `http://localhost:5173`

---

## 🧪 Testing Workflows

### Test 1: Onboarding Save & Restore (2 minutes)

1. **Navigate to Onboarding** (if not already there)
   - Go to `http://localhost:5173/onboarding`

2. **Fill First Step**
   - Enter a name
   - Click "Continue"

3. **Fill Second Step Partially**
   - Select a few preferences
   - **Do NOT click Continue**

4. **Close Tab/Browser**
   - Close the browser tab or entire browser

5. **Reopen Application**
   - Go back to `http://localhost:5173/onboarding`

6. **✅ Expected Result:**
   - Toast notification: "Welcome back! Restored your progress"
   - You should be on step 2 with your selections intact

7. **Test Skip**
   - Click "Skip for now" on profile details
   - Should advance to next step

---

### Test 2: Dashboard Tour (2 minutes)

1. **Complete Onboarding**
   - Finish all onboarding steps
   - Submit final form

2. **Land on Dashboard**
   - You should be redirected to `/dashboard`

3. **✅ Expected Result:**
   - Tour overlay appears automatically
   - Shows 4 steps:
     1. Welcome to Dashboard
     2. Take Assessment → highlights "Take New Assessment" card
     3. View Results → highlights recent results section
     4. Customize Dashboard → highlights settings button

4. **Navigate Tour**
   - Click "Next" through all steps
   - Or click "Skip Tour"

5. **Verify Tour Won't Repeat**
   - Reload page
   - Tour should NOT appear again
   - (It only shows once)

---

### Test 3: Dashboard Widget Customization (3 minutes)

1. **Open Customizer**
   - Click the "Customize Dashboard" button (Settings icon)
   - Dialog should open

2. **Toggle Widgets**
   - Turn OFF "Mood Calendar Heatmap"
   - Turn OFF "Wellness Score Trend"
   - Click "Save Changes"

3. **✅ Expected Result:**
   - Dialog closes
   - Those two widgets should disappear from dashboard
   - Other widgets still visible

4. **Reload Page**
   - Refresh the browser
   - ✅ Widgets should still be hidden (localStorage persistence)

5. **Reset to Default**
   - Open customizer again
   - Click "Reset to Default"
   - ✅ All widgets should reappear

---

### Test 4: Single Assessment Flow (5 minutes)

1. **Start Assessment**
   - Click "Take New Assessment" from dashboard
   - Or navigate to `/assessments`
   - Select any single assessment (e.g., PHQ-9)

2. **Check Progress Indicators**
   - ✅ "Question 1 of 9" displayed at top
   - ✅ Progress bar shows 11% (1/9)
   - ✅ "~4 min remaining" displayed
   - ✅ Assessment title shown

3. **Answer First Question**
   - Click on any answer card
   - ✅ Card border turns blue
   - ✅ Background becomes light blue
   - ✅ Radio button fills

4. **Test Navigation**
   - Click "Previous" → ✅ Should be disabled
   - Click "Next" → ✅ Advances to Q2
   - Progress updates: "Question 2 of 9", "~4 min remaining"

5. **Test Keyboard Navigation**
   - Press TAB → Should move focus between answer cards
   - Press ENTER or SPACE → Should select focused answer
   - Press TAB to "Next" button → Press ENTER → Should advance

6. **Go Backwards**
   - Answer question 2
   - Click "Previous"
   - ✅ Returns to Q1 with your answer still selected

7. **Complete Assessment**
   - Answer all questions
   - On last question, button changes to "Submit Assessment"
   - Click Submit
   - ✅ Should show results or redirect to insights

---

### Test 5: Combined Assessment Flow (8 minutes)

1. **Select Multiple Assessments**
   - Navigate to `/assessments`
   - Click "Combined Assessment" or similar
   - Select 2-3 assessments (e.g., PHQ-9, GAD-7, PSS-4)
   - Click "Start Combined Assessment"

2. **Check Overall Progress**
   - ✅ "Question 1 of X" (where X is total from all assessments)
   - ✅ Progress bar starts at low percentage
   - ✅ "~N min remaining" based on total questions
   - ✅ "3 assessments combined" shown
   - ✅ Elapsed time: "0 min"

3. **Check Assessment Context**
   - ✅ Blue badge shows current assessment name (e.g., "PHQ-9")
   - ✅ "Question 1 of 9" shows position within that assessment
   - ✅ Question text displayed clearly

4. **Answer Questions**
   - Answer first few questions
   - Progress bar increases
   - Time estimate decreases
   - Elapsed time increases

5. **Transition Between Assessments**
   - When you finish all questions from first assessment
   - Next question should show different badge (e.g., "GAD-7")
   - ✅ Question numbering resets for new assessment
   - ✅ Overall progress continues

6. **Test Previous Across Assessments**
   - When on first question of second assessment
   - Click "Previous"
   - ✅ Should go back to last question of first assessment
   - Badge updates correctly

7. **Complete All Assessments**
   - Answer all questions from all selected assessments
   - On last question, button shows "Complete Assessment"
   - Click it

8. **AI Insights Screen**
   - ✅ Animated spinner appears
   - ✅ Brain icon with pulse animation
   - ✅ "Analyzing Your Responses" message
   - ✅ "Processing X responses" count
   - After ~1.5 seconds → redirects to results

---

### Test 6: Dashboard Visualizations (3 minutes)

**Prerequisites:** You need some mock data or real assessment data

1. **Mood Calendar Heatmap**
   - ✅ Grid of squares representing days
   - ✅ Hover over a square → tooltip shows date and mood
   - ✅ Color intensity indicates mood level
   - ✅ Summary stats at bottom (total entries, best/worst)

2. **Wellness Score Trend**
   - ✅ Line chart showing trend over time
   - ✅ Gradient fill under line
   - ✅ Trend indicator (↑ improving / ↓ declining / → stable)
   - ✅ Stats: Average, Current, Min, Max

3. **Streak Tracker**
   - ✅ Current streak number with fire icon
   - ✅ Milestone progress bars
   - ✅ Next milestone preview
   - ✅ Trophy icon for gamification

4. **Assessment Comparison Chart**
   - ✅ Horizontal bars for each assessment
   - ✅ Color coded (red/yellow/green)
   - ✅ Interpretation labels
   - ✅ Summary statistics

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot find module" errors

**Solution:**
```powershell
# Clear node_modules and reinstall
rm -r node_modules
rm package-lock.json
npm install
```

### Issue: localStorage not persisting

**Solution:**
- Check browser console for errors
- Ensure you're not in Private/Incognito mode
- Clear browser cache and reload

### Issue: Tour doesn't appear

**Solution:**
```javascript
// Open browser console and run:
localStorage.removeItem('onboarding-completed');
localStorage.removeItem('dashboard-tour-completed');
// Then reload page
```

### Issue: Widgets not showing

**Solution:**
```javascript
// Open browser console and run:
localStorage.removeItem('dashboard-widget-visibility');
// Then reload page
```

### Issue: Assessment not loading

**Solution:**
- Check backend is running on correct port
- Check browser Network tab for API errors
- Verify backend has assessment templates in database

---

## ✅ Success Criteria

After testing, you should have verified:

- [x] Onboarding saves and restores correctly
- [x] Skip buttons work on optional fields
- [x] Dashboard tour appears once after onboarding
- [x] Widget customization persists across reloads
- [x] All 5 dashboard widgets render
- [x] Single assessment shows progress indicators
- [x] Keyboard navigation works in assessments
- [x] Combined assessment handles multiple types
- [x] Assessment badges update correctly
- [x] AI insights screen appears after completion
- [x] Previous/Next navigation works properly
- [x] No TypeScript/console errors

---

## 📊 Performance Check

### Expected Load Times
- **Dashboard initial load:** < 1 second
- **Assessment template fetch:** < 500ms
- **Assessment submission:** < 1 second
- **Widget render:** < 100ms each

### Browser Console
Should see **0 errors** in:
- Console tab
- Network tab (all requests 200 OK)
- TypeScript compilation

---

## 📸 Screenshot Checklist

For documentation, capture:
1. Onboarding restore toast notification
2. Dashboard tour overlay (step 1)
3. Widget customizer dialog
4. Assessment progress indicators
5. Combined assessment badge
6. AI insights generation screen
7. All dashboard widgets

---

## 🎬 Video Demo Script

**Duration:** 5 minutes

1. **Intro (30s)**
   - Show landing page
   - Start onboarding

2. **Onboarding (1m)**
   - Fill first step
   - Close browser
   - Reopen → show restore
   - Skip optional field
   - Complete

3. **Dashboard Tour (1m)**
   - Show tour appearing
   - Navigate through 4 steps
   - Skip tour

4. **Widget Customization (1m)**
   - Open customizer
   - Toggle widgets off
   - Reload → show persistence
   - Reset to default

5. **Assessment Flow (2m)**
   - Start single assessment
   - Show progress indicators
   - Demonstrate keyboard navigation
   - Complete and submit

6. **Combined Assessment (30s)**
   - Select 2 assessments
   - Show badge transitions
   - Complete → AI insights screen

---

## 🔍 Edge Cases to Test

### Advanced Testing
1. **Long Assessment (20+ questions)**
   - Progress bar accuracy
   - Time estimates
   - Performance

2. **Rapid Navigation**
   - Spam Previous/Next buttons
   - Should handle gracefully

3. **Incomplete Assessment**
   - Start assessment
   - Navigate away
   - Come back
   - (Currently: state lost, could be future enhancement)

4. **Offline Mode**
   - Disconnect network
   - Try to load assessment
   - Should show error state

5. **Small Screen**
   - Test on mobile viewport (375px)
   - All buttons accessible
   - Text readable

---

**Happy Testing! 🎉**

*For issues or questions, check the comprehensive documentation in:*
- `UX_IMPROVEMENTS_FINAL_SUMMARY.md`
- `ASSESSMENT_FLOW_FIXES.md`
- `COMBINED_ASSESSMENT_FLOW_COMPLETE.md`
