# Conversation History Feature - Testing Guide

**Last Updated:** October 18, 2025  
**Status:** Ready for Testing

---

## 🚀 Quick Start

### 1. Start the Backend Server
```powershell
cd "c:\Users\adity\Downloads\Mental Wellbeing AI App Overview\backend"
npm run dev
```

**Expected Output:**
```
Server running on port 5000
Database connected
```

### 2. Start the Frontend Server
```powershell
cd "c:\Users\adity\Downloads\Mental Wellbeing AI App Overview\frontend"
npm run dev
```

**Expected Output:**
```
Local: http://localhost:5173
```

### 3. Login to Application
- Navigate to `http://localhost:5173`
- Login with your test account
- Navigate to the Chatbot page

---

## ✅ Testing Checklist

### Basic Conversation Flow

#### Test 1: Create First Conversation
**Steps:**
1. Open chatbot (should see empty sidebar on desktop, or menu button on mobile)
2. Type a message: "I've been feeling stressed lately"
3. Press Send or Enter

**Expected Results:**
- ✅ Message appears in chat
- ✅ Bot responds with supportive message
- ✅ New conversation appears in sidebar under "Today"
- ✅ AI-generated title appears (e.g., "Discussing stress management")
- ✅ Message count shows (2)

**Check Console:**
```
🤖 Sending message to chat API: I've been feeling stressed lately conversationId: null
📥 Chat API response: { success: true, data: { conversationId: "...", conversationTitle: "..." } }
📝 Setting conversation ID: cm2a3b4c5d000000000000001
```

---

#### Test 2: Continue Conversation
**Steps:**
1. Send another message in the same conversation
2. Send a third message

**Expected Results:**
- ✅ All messages stay in same conversation
- ✅ Message count increases (4, 6, etc.)
- ✅ `lastMessageAt` updates (should show "Just now")
- ✅ Conversation stays at top of "Today" group

---

#### Test 3: Create New Conversation
**Steps:**
1. Click "New Chat" button in sidebar
2. Type a different message: "I want to improve my sleep"
3. Press Send

**Expected Results:**
- ✅ Previous conversation clears from view
- ✅ New conversation starts fresh
- ✅ Both conversations now visible in sidebar
- ✅ New conversation gets different AI title (e.g., "Sleep improvement strategies")
- ✅ New conversation appears at top of list

---

### Sidebar Functionality

#### Test 4: Switch Between Conversations
**Steps:**
1. Have at least 2 conversations created
2. Click on the older conversation in sidebar
3. Send a new message
4. Click back to the first conversation

**Expected Results:**
- ✅ Active conversation highlights in sidebar
- ✅ Console shows: `📝 Setting conversation ID: [different-id]`
- ✅ Message goes to correct conversation
- ✅ Switching back loads correct conversationId
- ✅ Message counts update correctly

---

#### Test 5: Search Conversations
**Steps:**
1. Create 3+ conversations with different topics (stress, sleep, anxiety)
2. Type "stress" in search box
3. Clear search box

**Expected Results:**
- ✅ Only conversations matching "stress" appear
- ✅ Date grouping still works
- ✅ Clearing search shows all conversations again
- ✅ Search is case-insensitive

---

#### Test 6: Rename Conversation
**Steps:**
1. Hover over a conversation
2. Click the ⋮ (three dots) menu button
3. Click "Rename"
4. Type new title: "My Custom Title"
5. Press Enter

**Expected Results:**
- ✅ Inline input appears with current title
- ✅ Typing updates input value
- ✅ Enter saves new title
- ✅ Title updates immediately in sidebar
- ✅ Escape key cancels rename

**Alternative Test:**
- Click rename, type new title, click outside input
- Should save automatically on blur

---

#### Test 7: Delete Conversation
**Steps:**
1. Click ⋮ menu on a conversation
2. Click "Delete"
3. Confirm deletion

**Expected Results:**
- ✅ Confirmation dialog appears: "Are you sure you want to delete this conversation?"
- ✅ Clicking OK removes conversation from sidebar
- ✅ If deleted conversation was active, chat clears and shows greeting
- ✅ Conversation count in footer decreases
- ✅ Console shows no errors

---

#### Test 8: Archive Conversation
**Steps:**
1. Click ⋮ menu on a conversation
2. Click "Archive"

**Expected Results:**
- ✅ Conversation removed from active list
- ✅ If conversation was active, chat clears
- ✅ Conversation count decreases
- ✅ Archive icon appears (if viewing archived conversations)

**Note:** To view archived conversations, you'll need to add a filter toggle (future enhancement)

---

### Mobile Responsiveness

#### Test 9: Mobile Sidebar (Resize browser to <1024px width)
**Steps:**
1. Resize browser window to mobile size (< 1024px width)
2. Note the hamburger menu (☰) button appears
3. Click the menu button
4. Try all sidebar features (search, create, switch conversations)

**Expected Results:**
- ✅ Desktop sidebar hidden
- ✅ Menu button visible in header
- ✅ Clicking menu opens drawer from left
- ✅ Clicking outside drawer closes it
- ✅ Selecting conversation closes drawer
- ✅ All sidebar features work in drawer
- ✅ "New Chat" button works
- ✅ Search works in drawer

---

### Edge Cases

#### Test 10: Empty State
**Steps:**
1. Delete all conversations (or use fresh account)
2. Look at sidebar

**Expected Results:**
- ✅ Shows folder icon
- ✅ "No conversations yet" message
- ✅ "Start a new chat to begin" subtitle
- ✅ No error messages

---

#### Test 11: Search with No Results
**Steps:**
1. Search for term that doesn't exist: "xyzabc123"

**Expected Results:**
- ✅ Shows folder icon
- ✅ "No conversations found" message
- ✅ "Try a different search term" subtitle

---

#### Test 12: API Error Handling
**Steps:**
1. Stop backend server
2. Try to send a message or load conversations
3. Restart backend server
4. Retry operation

**Expected Results:**
- ✅ Shows error icon in sidebar
- ✅ "Failed to load conversations" message
- ✅ Error details displayed
- ✅ Chat shows error toast/message
- ✅ After backend restart, can retry successfully

---

#### Test 13: Long Conversation Titles
**Steps:**
1. Rename a conversation to very long title (100+ characters)

**Expected Results:**
- ✅ Title truncates with ellipsis (...)
- ✅ Full title visible on hover (tooltip)
- ✅ UI doesn't break

---

#### Test 14: Many Conversations (20+)
**Steps:**
1. Create 20+ conversations over multiple days
2. Scroll through sidebar

**Expected Results:**
- ✅ Date grouping works (Today, Yesterday, Last 7 Days, Last 30 Days, Older)
- ✅ Scroll works smoothly
- ✅ Conversations sorted by lastMessageAt (newest first within each group)
- ✅ Performance remains good

---

### AI Title Generation

#### Test 15: AI Title Quality
**Steps:**
1. Create conversations with different topics:
   - "I'm feeling anxious about work"
   - "How can I sleep better?"
   - "I want to exercise more"
2. Check AI-generated titles

**Expected Results:**
- ✅ Titles are descriptive (not generic)
- ✅ Titles reflect conversation topic
- ✅ Titles are concise (< 50 characters)
- ✅ Examples:
  - "Managing work-related anxiety"
  - "Sleep improvement strategies"
  - "Building an exercise routine"

---

#### Test 16: AI Title Fallback
**Steps:**
1. Check conversations where AI title generation might fail
2. Look at conversations list

**Expected Results:**
- ✅ If AI fails, shows "Untitled Conversation"
- ✅ User can still rename manually
- ✅ No errors in console

---

### Performance Testing

#### Test 17: Conversation Switching Speed
**Steps:**
1. Create 10 conversations
2. Rapidly click between them
3. Monitor console for errors

**Expected Results:**
- ✅ Switches happen quickly (< 500ms)
- ✅ No race conditions or errors
- ✅ Active highlight updates correctly
- ✅ No duplicate messages

---

#### Test 18: Search Performance
**Steps:**
1. Have 20+ conversations
2. Type quickly in search box: "stress"
3. Delete search, type again

**Expected Results:**
- ✅ Search results appear quickly
- ✅ No lag or freezing
- ✅ Debouncing works (doesn't search on every keystroke)
- ✅ Can clear and search again smoothly

---

### Data Persistence

#### Test 19: Refresh Page
**Steps:**
1. Create a conversation, send several messages
2. Note the conversationId in console
3. Refresh page (F5)
4. Navigate back to chatbot

**Expected Results:**
- ✅ All conversations still visible in sidebar
- ✅ Can click on conversation
- ✅ Message counts correct
- ✅ Timestamps correct
- ✅ Last message previews correct

---

#### Test 20: Logout/Login
**Steps:**
1. Create conversations
2. Logout
3. Login as same user
4. Navigate to chatbot

**Expected Results:**
- ✅ All conversations visible
- ✅ Can continue conversations
- ✅ Data persisted correctly

---

## 🐛 Common Issues & Solutions

### Issue 1: Sidebar Not Showing
**Symptoms:** No sidebar visible on desktop
**Solutions:**
1. Check browser width (needs ≥1024px)
2. Check console for import errors
3. Verify ConversationHistorySidebar component renders
4. Check CSS for `display: none` overrides

---

### Issue 2: No ConversationId in Response
**Symptoms:** Console shows `conversationId: undefined`
**Solutions:**
1. Check backend is running
2. Verify chatService returns conversationId
3. Check API response in Network tab
4. Verify chatApi.sendMessage() passes conversationId correctly

---

### Issue 3: Conversations Not Loading
**Symptoms:** Empty sidebar when should have conversations
**Solutions:**
1. Check authentication token
2. Verify userId in conversations table
3. Check API endpoint: `GET /api/conversations`
4. Check React Query DevTools for errors
5. Look at console for API errors

---

### Issue 4: Search Not Working
**Symptoms:** Search returns no results
**Solutions:**
1. Check search query in Network tab
2. Verify backend search endpoint works
3. Check if conversations have matching content
4. Try exact title match first

---

### Issue 5: Mobile Drawer Not Opening
**Symptoms:** Click menu button, nothing happens
**Solutions:**
1. Check Sheet component imported correctly
2. Verify `showMobileSidebar` state updates
3. Check console for errors
4. Verify Sheet component in DOM

---

## 📊 Test Results Template

Use this template to record your test results:

```markdown
## Test Session: [Date/Time]

### Environment
- Backend: ✅ Running on port 5000
- Frontend: ✅ Running on port 5173
- Browser: Chrome 118.0
- User: test@example.com

### Tests Completed

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | Create First Conversation | ✅ Pass | Title: "Managing stress" |
| 2 | Continue Conversation | ✅ Pass | Message count updated |
| 3 | Create New Conversation | ✅ Pass | Both visible in sidebar |
| 4 | Switch Conversations | ✅ Pass | Active highlight works |
| 5 | Search Conversations | ✅ Pass | Found 2/5 conversations |
| 6 | Rename Conversation | ✅ Pass | Updated instantly |
| 7 | Delete Conversation | ✅ Pass | Confirmation shown |
| 8 | Archive Conversation | ⚠️ Issue | See note below |
| ... | ... | ... | ... |

### Issues Found
1. **Archive not removing from list**
   - Severity: Medium
   - Steps to reproduce: Click archive, conversation still visible
   - Expected: Should remove from active list
   - Console errors: None

### Summary
- Tests Passed: 15/20 (75%)
- Tests Failed: 2/20 (10%)
- Tests Skipped: 3/20 (15%)
- Overall Status: Needs fixes before deployment
```

---

## 🎯 Acceptance Criteria

Feature is ready for production when:

- ✅ All 20 tests pass
- ✅ No console errors during normal usage
- ✅ Mobile and desktop views work
- ✅ Search returns accurate results
- ✅ CRUD operations work reliably
- ✅ AI title generation works 80%+ of time
- ✅ Performance is acceptable (< 1s for most operations)
- ✅ Data persists correctly across sessions
- ✅ No data loss or corruption
- ✅ Error states handled gracefully

---

## 📝 Notes

### Known Limitations
1. **Message Loading:** When switching conversations, messages aren't currently loaded from API (shows placeholder)
2. **Accessibility:** Some keyboard navigation warnings (non-critical)
3. **Archived View:** No toggle to view archived conversations (future enhancement)
4. **Export:** No conversation export yet (future enhancement)

### Future Enhancements to Test
- [ ] Load actual messages when switching conversations
- [ ] Add conversation pinning
- [ ] Add conversation tags
- [ ] Add conversation export
- [ ] Add keyboard shortcuts (Cmd+K, Cmd+F)
- [ ] Add infinite scroll for large lists

---

## 🎉 Happy Testing!

If you find any bugs or have questions, check the console logs first, then review the implementation summary document for architecture details.

**Good luck testing! 🚀**
