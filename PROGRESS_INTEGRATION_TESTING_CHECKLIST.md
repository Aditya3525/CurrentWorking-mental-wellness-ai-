# Progress Section - Integration Testing Checklist

**Purpose:** Step-by-step manual testing guide for Progress section  
**Date:** October 23, 2025  
**Tester:** _________________  
**Build Version:** _________________

---

## 🎯 PRE-TEST SETUP

### **Environment Setup**
- [ ] Backend server running on port 5000
- [ ] Frontend server running on port 3000
- [ ] Database seeded with test data
- [ ] Browser DevTools open (Console + Network tabs)

### **Test User Accounts Required**

**Account 1: New User**
- Email: test-new@example.com
- Password: Test123!
- Data: No mood entries, no assessments, no plan

**Account 2: Partial Data User**
- Email: test-partial@example.com  
- Password: Test123!
- Data: 10 mood entries, no assessments

**Account 3: Complete Data User**
- Email: test-complete@example.com
- Password: Test123!
- Data: 30+ mood entries, 5+ assessments, active plan

**Account 4: Power User**
- Email: test-power@example.com
- Password: Test123!
- Data: 100+ mood entries, 20+ assessments, completed plan

---

## 📋 TEST CASES

## **TEST SUITE 1: OVERVIEW TAB**

### **TC-1.1: Header Section**

**Steps:**
1. Navigate to Progress section
2. Verify header displays correctly

**Expected Results:**
- [ ] Gradient background visible (purple/pink/blue tones)
- [ ] BarChart3 icon with gradient badge visible
- [ ] Title "Your Progress Journey" with gradient text
- [ ] Assessment count badge shows correct number
- [ ] Back button (if present) works

**Actual Results:**
```
Status: [ ] Pass [ ] Fail
Notes: _______________________________________
```

---

### **TC-1.2: Statistics Cards**

**Test Card 1: Current Streak**

**Steps:**
1. Check Current Streak card

**Expected Results:**
- [ ] Flame icon with gradient background visible
- [ ] Current streak number displayed
- [ ] Badge shows "Active" or "Inactive"
- [ ] Mini progress bar visible with orange gradient
- [ ] Hover effect works (scale animation)

**Test Cases:**
- With 0 streak: Shows 0, badge shows "Inactive"
- With active streak: Shows correct number, badge shows "Active"

**Actual Results:**
```
Current Streak Value: _______
Badge Status: _______
Status: [ ] Pass [ ] Fail
```

---

**Test Card 2: Mood Check-ins**

**Steps:**
1. Check Mood Check-ins card

**Expected Results:**
- [ ] Heart icon visible
- [ ] Check-ins this week count correct
- [ ] Last check-in date formatted correctly
- [ ] Mini progress bar visible with blue gradient
- [ ] Hover effect works

**Validation:**
- Count mood entries manually: Expected = _____, Actual = _____
- Last check-in date: Expected = _____, Actual = _____

**Actual Results:**
```
Check-ins This Week: _______
Last Check-in: _______
Status: [ ] Pass [ ] Fail
```

---

**Test Card 3: Plan Modules**

**Steps:**
1. Check Plan Modules card

**Expected Results:**
- [ ] Target icon visible
- [ ] Completed/Total modules displayed
- [ ] Percentage calculated correctly
- [ ] Mini progress bar visible with green gradient
- [ ] Hover effect works

**Validation:**
- Manual count: Completed = _____, Total = _____
- Calculated percentage: (Completed / Total) * 100 = _____
- Displayed percentage: _____

**Actual Results:**
```
Modules: _____ / _____
Percentage: _____%
Status: [ ] Pass [ ] Fail
```

---

**Test Card 4: Average Mood**

**Steps:**
1. Check Average Mood card

**Expected Results:**
- [ ] Star icon visible
- [ ] Average mood score displayed (1-5)
- [ ] Mood label shown (Great/Good/Okay/Struggling/Anxious)
- [ ] Mini progress bar visible with yellow gradient
- [ ] Hover effect works

**Validation:**
- Calculate average manually: _____
- Displayed average: _____
- Mood label matches score: [ ] Yes [ ] No

**Actual Results:**
```
Average Mood: _______
Label: _______
Status: [ ] Pass [ ] Fail
```

---

### **TC-1.3: Activity Feed & Calendar**

**Test Activity Feed:**

**Steps:**
1. Scroll to Activity Feed section

**Expected Results:**
- [ ] Shows recent activities (up to 8)
- [ ] Activities sorted by date (newest first)
- [ ] Color coding correct:
  - Mood = Blue
  - Progress = Green
  - Assessment = Purple
  - Plan = Orange
- [ ] Dates formatted correctly
- [ ] Activity labels clear and descriptive

**Validation:**
Count activities by type:
- Mood: _____
- Progress: _____
- Assessment: _____
- Plan: _____
- Total: _____ (should be ≤ 8)

**Actual Results:**
```
Activities Shown: _______
Date Sort Order: [ ] Correct [ ] Incorrect
Status: [ ] Pass [ ] Fail
```

---

**Test Calendar:**

**Steps:**
1. Check calendar component

**Expected Results:**
- [ ] Calendar displays current month
- [ ] Days with activities marked (blue highlight)
- [ ] Can select dates
- [ ] Custom styling applied
- [ ] No console errors when clicking dates

**Validation:**
- Count marked dates manually: _____
- Count in activity feed: _____
- Match: [ ] Yes [ ] No

**Actual Results:**
```
Marked Dates: _______
Calendar Interactive: [ ] Yes [ ] No
Status: [ ] Pass [ ] Fail
```

---

### **TC-1.4: Analytics Widgets**

**Test Widget 1: Streak Tracker**

**Steps:**
1. Scroll to Streak Tracker widget

**Expected Results:**
- [ ] Widget loads without errors
- [ ] Current streak displayed
- [ ] Longest streak displayed
- [ ] Total check-ins displayed
- [ ] Last check-in date shown
- [ ] Hover scale animation works

**Validation:**
- Current Streak: Expected = _____, Actual = _____
- Longest Streak: Expected = _____, Actual = _____
- Total Check-ins: Expected = _____, Actual = _____

**Actual Results:**
```
Widget Loaded: [ ] Yes [ ] No
Data Correct: [ ] Yes [ ] No
Status: [ ] Pass [ ] Fail
```

---

**Test Widget 2: Mood Calendar Heatmap**

**Steps:**
1. Scroll to Mood Calendar Heatmap

**Expected Results:**
- [ ] Heatmap displays correctly
- [ ] Color coding matches moods:
  - Great = Green
  - Good = Blue
  - Okay = Yellow
  - Struggling = Orange
  - Anxious = Red
- [ ] Month labels visible
- [ ] Weekday labels visible
- [ ] Hover effects work (zoom to 150%)
- [ ] Tooltips show on hover
- [ ] Mood summary counts correct

**Validation:**
Count moods manually:
- Great: _____
- Good: _____
- Okay: _____
- Struggling: _____
- Anxious: _____

Compare with summary display: [ ] Match [ ] Mismatch

**Actual Results:**
```
Heatmap Rendered: [ ] Yes [ ] No
Colors Correct: [ ] Yes [ ] No
Summary Accurate: [ ] Yes [ ] No
Status: [ ] Pass [ ] Fail
```

---

**Test Widget 3: Wellness Score Trend**

**Steps:**
1. Check Wellness Score Trend widget

**Expected Results:**
- [ ] Line chart renders
- [ ] Shows data for last 120 days
- [ ] X-axis shows dates
- [ ] Y-axis shows scores (0-100)
- [ ] Trend line smooth
- [ ] No data gaps (or handled gracefully)

**Validation:**
- Count data points: _____
- Date range: _____ to _____
- Score range: _____ to _____

**Actual Results:**
```
Chart Rendered: [ ] Yes [ ] No
Data Accurate: [ ] Yes [ ] No
Status: [ ] Pass [ ] Fail
```

---

**Test Widget 4: Assessment Comparison Chart**

**Steps:**
1. Check Assessment Comparison Chart

**Expected Results:**
- [ ] Chart renders (radar or bar chart)
- [ ] Shows latest assessment for each type
- [ ] Assessment labels readable
- [ ] Scores normalized correctly
- [ ] Legend present

**Validation:**
- Count assessment types: _____
- Check if showing latest: [ ] Yes [ ] No

**Actual Results:**
```
Chart Type: [ ] Radar [ ] Bar
Assessments Shown: _______
Status: [ ] Pass [ ] Fail
```

---

**Test Widgets 5-7: Conversation Widgets**

**⚠️ CRITICAL: These depend on API endpoints**

**Steps:**
1. Check ConversationSummaryWidget
2. Check ConversationTopicsWidget
3. Check EmotionalPatternWidget

**For Each Widget, Verify:**
- [ ] Loading state appears first
- [ ] Widget loads without errors OR shows error state
- [ ] If data exists: displays correctly
- [ ] If no data: shows empty state
- [ ] No console errors

**API Endpoints to Verify:**
- `/api/chat/summary/:userId`
- `/api/chat/memory/:userId`

**Actual Results:**
```
ConversationSummaryWidget:
  Status: [ ] Loaded [ ] Empty [ ] Error
  
ConversationTopicsWidget:
  Status: [ ] Loaded [ ] Empty [ ] Error
  
EmotionalPatternWidget:
  Status: [ ] Loaded [ ] Empty [ ] Error

Overall: [ ] Pass [ ] Fail
Notes: _______________________________________
```

---

## **TEST SUITE 2: TRENDS TAB**

### **TC-2.1: Time Range Filters**

**Steps:**
1. Click on Trends tab
2. Test each time range button (7d, 30d, 6m)

**Expected Results:**
- [ ] Three buttons visible
- [ ] Active button has different styling (shadow)
- [ ] Calendar icons visible on buttons
- [ ] Clicking button updates data
- [ ] Charts re-render with filtered data

**Test Each Filter:**
- Click 7d: Data updates [ ] Yes [ ] No
- Click 30d: Data updates [ ] Yes [ ] No
- Click 6m: Data updates [ ] Yes [ ] No

**Validation:**
- Check network tab for new API calls
- Verify data range matches selection

**Actual Results:**
```
Filters Work: [ ] Yes [ ] No
Data Updates: [ ] Yes [ ] No
Status: [ ] Pass [ ] Fail
```

---

### **TC-2.2: Anxiety & Stress Levels Card**

**Steps:**
1. Check Anxiety & Stress card

**Expected Results:**
- [ ] Gradient header (red to orange)
- [ ] Brain icon with badge visible
- [ ] Shows anxiety/stress metrics
- [ ] Average displayed with trend badge
- [ ] Individual entries shown with progress bars
- [ ] Trend arrow (↑↓→) correct
- [ ] Color coding based on levels

**Validation:**
- Calculate average manually: _____
- Displayed average: _____
- Trend direction: [ ] Up [ ] Down [ ] Stable

**Actual Results:**
```
Average: _______
Trend: _______
Status: [ ] Pass [ ] Fail
```

---

### **TC-2.3: Mood & Practice Consistency Card**

**Steps:**
1. Check Mood & Practice Consistency card

**Expected Results:**
- [ ] Gradient header (pink to purple)
- [ ] Three sections visible:
  1. Average Mood
  2. Plan Progress
  3. Assessment Cadence
- [ ] Each section has:
  - Icon badge
  - Large number display
  - Progress bar with gradient
  - Status badge

**Validation:**
1. Average Mood: Expected = _____, Actual = _____
2. Plan Progress: Expected = ____%, Actual = _____%
3. Assessment Cadence: Expected = _____, Actual = _____

**Actual Results:**
```
All Sections Render: [ ] Yes [ ] No
Data Accurate: [ ] Yes [ ] No
Status: [ ] Pass [ ] Fail
```

---

### **TC-2.4: Insights & Patterns Card**

**Steps:**
1. Check Insights & Patterns card

**Expected Results:**
- [ ] Gradient header (purple to indigo)
- [ ] Two columns visible:
  - Positive Trends (left)
  - Areas for Focus (right)
- [ ] Each trend/focus item has:
  - Icon (CheckCircle or Zap)
  - Title
  - Description
  - Hover effect
- [ ] If no insights: shows empty state with CTA

**Validation:**
- Count positive trends: _____ (max 3)
- Count focus areas: _____ (max 3)
- Content makes sense: [ ] Yes [ ] No

**Actual Results:**
```
Insights Generated: [ ] Yes [ ] No
Quality: [ ] Good [ ] Poor
Status: [ ] Pass [ ] Fail
```

---

## **TEST SUITE 3: GOALS TAB**

### **TC-3.1: Plan Module Cards**

**Steps:**
1. Click on Goals tab
2. Check each module card

**Expected Results:**
- [ ] Gradient header section visible
- [ ] "View personalised plan" button works
- [ ] Each module card shows:
  - Icon badge (CheckCircle if completed, Target if active)
  - Module title
  - Description
  - Progress percentage
  - Progress bar (gradient based on completion)
  - Scheduled date
  - "Update plan" button
- [ ] Hover effects work
- [ ] Completed modules have green theme
- [ ] Active modules have blue theme

**Validation:**
For Each Module:
- Title: _____________________
- Progress: _____%
- Status: [ ] Completed [ ] Active
- Visual Theme: [ ] Correct [ ] Incorrect

**Actual Results:**
```
Modules Displayed: _______
Data Accurate: [ ] Yes [ ] No
Navigation Works: [ ] Yes [ ] No
Status: [ ] Pass [ ] Fail
```

---

### **TC-3.2: Empty State**

**Steps:**
1. Test with user who has no plan
2. Check empty state display

**Expected Results:**
- [ ] Target icon with gradient background
- [ ] "Your personalised plan isn't set up yet" message
- [ ] "Build my plan" button visible
- [ ] Button navigates to plan builder

**Actual Results:**
```
Empty State Shown: [ ] Yes [ ] No
CTA Works: [ ] Yes [ ] No
Status: [ ] Pass [ ] Fail
```

---

## **TEST SUITE 4: ACHIEVEMENTS TAB**

### **TC-4.1: Achievement Cards**

**Steps:**
1. Click on Achievements tab
2. Check each achievement card

**Expected Results:**
- [ ] Gradient header banner (yellow to orange)
- [ ] Trophy icon badge visible
- [ ] Cards in 3-column grid (desktop)
- [ ] Each card shows:
  - Icon (colored if earned, gray if locked)
  - Title
  - Description
  - Earned badge + date OR Progress bar
- [ ] Earned achievements have:
  - Yellow/golden gradient background
  - Yellow borders
  - Shadow effects
- [ ] Locked achievements have:
  - Muted appearance
  - Progress bar showing % complete
- [ ] Hover scale animation (1.02x zoom)

**Validation:**
Count Achievements:
- Total: _____
- Earned: _____
- Locked: _____

Verify Logic for Common Achievements:
- "First Steps": Earned if ≥1 assessment completed
- "Week Warrior": Earned if current streak ≥ 7 days
- "Dedicated": Earned if ≥10 assessments completed
- "Self-Aware": Earned if all plan modules completed

**Actual Results:**
```
Achievements Shown: _______
Unlock Logic Correct: [ ] Yes [ ] No
Visual Design: [ ] Good [ ] Issues
Status: [ ] Pass [ ] Fail
```

---

## **TEST SUITE 5: ERROR HANDLING**

### **TC-5.1: Network Errors**

**Steps:**
1. Open DevTools → Network tab
2. Throttle to "Offline"
3. Navigate to Progress section
4. Restore network
5. Click refresh/retry

**Expected Results:**
- [ ] Loading state appears
- [ ] Error message appears (user-friendly)
- [ ] No app crash
- [ ] Retry option available
- [ ] After restore: data loads successfully

**Actual Results:**
```
Error Handled: [ ] Yes [ ] No
Error Message: _______________________
Recovery Works: [ ] Yes [ ] No
Status: [ ] Pass [ ] Fail
```

---

### **TC-5.2: API Errors**

**Steps:**
1. Simulate 404/500 errors from backend
2. Check each tab

**Expected Results:**
- [ ] Graceful error handling
- [ ] Widgets show error states
- [ ] No JavaScript errors in console
- [ ] User can still navigate

**Actual Results:**
```
Error States Shown: [ ] Yes [ ] No
Console Errors: [ ] Yes [ ] No
Status: [ ] Pass [ ] Fail
```

---

### **TC-5.3: No Data (New User)**

**Steps:**
1. Login with new user account (no data)
2. Navigate to Progress section
3. Check all tabs

**Expected Results:**
- [ ] No errors or crashes
- [ ] All stat cards show 0 or "N/A"
- [ ] Empty states visible in:
  - Activity feed
  - Calendar
  - All widgets
- [ ] Empty state messages are helpful
- [ ] CTAs direct users to create data

**Actual Results:**
```
Empty States Shown: [ ] Yes [ ] No
No Crashes: [ ] Yes [ ] No
UX Quality: [ ] Good [ ] Poor
Status: [ ] Pass [ ] Fail
```

---

## **TEST SUITE 6: RESPONSIVENESS**

### **TC-6.1: Mobile View (375px)**

**Steps:**
1. Resize browser to 375px width (iPhone SE)
2. Test all tabs

**Expected Results:**
- [ ] Layout adapts to mobile
- [ ] All content readable
- [ ] No horizontal scroll
- [ ] Cards stack vertically
- [ ] Buttons accessible
- [ ] Touch targets adequate (44x44px minimum)

**Check Each Tab:**
- Overview: [ ] Pass [ ] Fail
- Trends: [ ] Pass [ ] Fail
- Goals: [ ] Pass [ ] Fail
- Achievements: [ ] Pass [ ] Fail

**Actual Results:**
```
Mobile Responsive: [ ] Yes [ ] No
Issues: _______________________
Status: [ ] Pass [ ] Fail
```

---

### **TC-6.2: Tablet View (768px)**

**Steps:**
1. Resize to 768px width (iPad)
2. Test all tabs

**Expected Results:**
- [ ] 2-column layouts work
- [ ] Widgets properly sized
- [ ] No overflow issues
- [ ] Touch-friendly

**Actual Results:**
```
Tablet Responsive: [ ] Yes [ ] No
Status: [ ] Pass [ ] Fail
```

---

### **TC-6.3: Desktop View (1920px)**

**Steps:**
1. Resize to 1920px width (Full HD)
2. Test all tabs

**Expected Results:**
- [ ] 3-column layouts work
- [ ] Content doesn't stretch too wide
- [ ] Proper spacing maintained
- [ ] All animations smooth

**Actual Results:**
```
Desktop Responsive: [ ] Yes [ ] No
Status: [ ] Pass [ ] Fail
```

---

## **TEST SUITE 7: PERFORMANCE**

### **TC-7.1: Load Time**

**Steps:**
1. Clear browser cache
2. Open DevTools → Performance tab
3. Navigate to Progress section
4. Measure load time

**Expected Results:**
- [ ] Initial render < 2 seconds
- [ ] All widgets loaded < 5 seconds
- [ ] No long-running scripts
- [ ] No layout shifts

**Measurements:**
- Time to First Contentful Paint: _____ ms
- Time to Interactive: _____ ms
- Total Load Time: _____ ms

**Actual Results:**
```
Load Time Acceptable: [ ] Yes [ ] No
Performance: [ ] Good [ ] Needs Optimization
Status: [ ] Pass [ ] Fail
```

---

### **TC-7.2: Tab Switching**

**Steps:**
1. Switch between tabs rapidly
2. Measure response time

**Expected Results:**
- [ ] Tab switch < 500ms
- [ ] No flickering
- [ ] Smooth animations
- [ ] No data re-fetching (cached)

**Actual Results:**
```
Switching Smooth: [ ] Yes [ ] No
Status: [ ] Pass [ ] Fail
```

---

### **TC-7.3: Large Dataset**

**Steps:**
1. Test with power user (100+ entries)
2. Check performance

**Expected Results:**
- [ ] No lag in rendering
- [ ] Charts render smoothly
- [ ] No memory leaks
- [ ] Browser doesn't slow down

**Actual Results:**
```
Handles Large Data: [ ] Yes [ ] No
Status: [ ] Pass [ ] Fail
```

---

## **TEST SUITE 8: ACCESSIBILITY**

### **TC-8.1: Keyboard Navigation**

**Steps:**
1. Use only keyboard (Tab, Enter, Arrow keys)
2. Navigate through Progress section

**Expected Results:**
- [ ] Can tab through all interactive elements
- [ ] Focus visible on all elements
- [ ] Enter key activates buttons
- [ ] Can navigate tabs with arrow keys
- [ ] No keyboard traps

**Actual Results:**
```
Keyboard Accessible: [ ] Yes [ ] No
Issues: _______________________
Status: [ ] Pass [ ] Fail
```

---

### **TC-8.2: Screen Reader**

**Steps:**
1. Enable screen reader (NVDA/JAWS/VoiceOver)
2. Navigate Progress section

**Expected Results:**
- [ ] All content announced
- [ ] Proper heading hierarchy
- [ ] Alt text on images/icons
- [ ] ARIA labels present
- [ ] Status updates announced

**Actual Results:**
```
Screen Reader Friendly: [ ] Yes [ ] No
Issues: _______________________
Status: [ ] Pass [ ] Fail
```

---

### **TC-8.3: Color Contrast**

**Steps:**
1. Use browser extension (WAVE, axe DevTools)
2. Check color contrast ratios

**Expected Results:**
- [ ] All text meets WCAG AA standards (4.5:1)
- [ ] Important elements meet AAA (7:1)
- [ ] Color not sole indicator of info

**Actual Results:**
```
Contrast Compliant: [ ] Yes [ ] No
Issues: _______________________
Status: [ ] Pass [ ] Fail
```

---

## 📊 TEST SUMMARY

### **Test Statistics**

Total Test Cases: _____ / 32  
Passed: _____  
Failed: _____  
Blocked: _____  
Not Tested: _____

Success Rate: _____%

---

### **Critical Issues Found**

**Issue #1:**
- Severity: [ ] Critical [ ] High [ ] Medium [ ] Low
- Description: _______________________________
- Steps to Reproduce: _______________________
- Expected: _______________
- Actual: _________________

**Issue #2:**
- Severity: [ ] Critical [ ] High [ ] Medium [ ] Low
- Description: _______________________________
- Steps to Reproduce: _______________________
- Expected: _______________
- Actual: _________________

*(Add more as needed)*

---

### **Non-Critical Issues**

1. _________________________________________
2. _________________________________________
3. _________________________________________

---

### **Recommendations**

**Must Fix Before Release:**
- [ ] _________________________________________
- [ ] _________________________________________

**Should Fix Soon:**
- [ ] _________________________________________
- [ ] _________________________________________

**Nice to Have:**
- [ ] _________________________________________
- [ ] _________________________________________

---

### **Sign-Off**

**Tester Name:** _________________  
**Date:** _________________  
**Build Version:** _________________

**Overall Assessment:**
- [ ] ✅ APPROVED - Ready for Production
- [ ] ⚠️ APPROVED WITH ISSUES - Minor fixes needed
- [ ] ❌ REJECTED - Critical issues must be fixed

**Comments:**
_____________________________________________
_____________________________________________
_____________________________________________

---

**Next Steps:**
1. _________________________________________
2. _________________________________________
3. _________________________________________
