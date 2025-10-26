# Quick Integration Guide - Exercise Recommendations

## 🎯 How to Add Exercise Recommendations to Chat UI

### Step 1: Import the Widget

Add to `frontend/src/components/features/chat/Chatbot.tsx`:

```typescript
import ExerciseRecommendationsWidget from './ExerciseRecommendationsWidget';
import { ExerciseRecommendationsResponse, chatApi } from '../../../services/api';
```

### Step 2: Add State Management

```typescript
const [exerciseRecs, setExerciseRecs] = useState<ExerciseRecommendationsResponse | null>(null);
const [showExercises, setShowExercises] = useState(false);
const [loadingExercises, setLoadingExercises] = useState(false);
```

### Step 3: Add Fetch Function

```typescript
const handleGetExercises = async () => {
  setLoadingExercises(true);
  try {
    // Get the last user message for context
    const lastUserMessage = chatHistory
      .filter(msg => msg.sender === 'user')
      .pop()?.content;
    
    const response = await chatApi.getExerciseRecommendations(lastUserMessage);
    setExerciseRecs(response.data);
    setShowExercises(true);
  } catch (error) {
    console.error('Failed to get exercise recommendations:', error);
    // Optionally show an error toast
  } finally {
    setLoadingExercises(false);
  }
};

const handleSelectExercise = (exerciseId: string) => {
  console.log('Selected exercise:', exerciseId);
  // TODO: Navigate to exercise detail page or start guided session
  // Example: navigate(`/exercises/${exerciseId}`);
};
```

### Step 4: Add Button in UI

Add this button near your voice controls or in the chat input area:

```tsx
{/* Exercise Recommendations Button */}
<button
  onClick={handleGetExercises}
  disabled={loadingExercises || chatHistory.length === 0}
  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
  title="Get personalized exercise recommendations"
>
  {loadingExercises ? (
    <>
      <Loader2 className="w-4 h-4 animate-spin" />
      <span>Loading...</span>
    </>
  ) : (
    <>
      <Sparkles className="w-4 h-4" />
      <span>Get Exercises</span>
    </>
  )}
</button>
```

### Step 5: Display the Widget

Add this below the chat history or in a modal:

```tsx
{/* Exercise Recommendations Display */}
{showExercises && exerciseRecs && (
  <div className="my-4">
    <ExerciseRecommendationsWidget
      recommendations={exerciseRecs}
      onSelectExercise={handleSelectExercise}
    />
    
    {/* Close Button */}
    <button
      onClick={() => setShowExercises(false)}
      className="mt-4 w-full text-sm text-gray-600 hover:text-gray-800 underline"
    >
      Hide Recommendations
    </button>
  </div>
)}
```

---

## 🎨 Alternative: Modal Display

For a cleaner UI, you can show recommendations in a modal:

```tsx
{showExercises && exerciseRecs && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
      {/* Close Button */}
      <button
        onClick={() => setShowExercises(false)}
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
      >
        <X className="w-6 h-6" />
      </button>
      
      <ExerciseRecommendationsWidget
        recommendations={exerciseRecs}
        onSelectExercise={(id) => {
          handleSelectExercise(id);
          setShowExercises(false);
        }}
      />
    </div>
  </div>
)}
```

---

## 🚀 Auto-Trigger Based on Sentiment

### Automatically show exercises when high anxiety/stress is detected:

```typescript
// In sendMessage function, after receiving bot response:
const sentiment = result.botMessage?.metadata?.sentiment;

if (sentiment && (
  sentiment.score < -0.7 || // Very negative
  result.crisis // Crisis detected
)) {
  // Auto-fetch exercise recommendations
  handleGetExercises();
}
```

---

## 🎯 Smart Placement Options

### Option 1: Chat Input Area (Recommended)
Place the "Get Exercises" button next to the microphone button in the chat input area.

### Option 2: Message Actions
Add an exercise icon to each bot message that users can click to get contextual exercises.

### Option 3: Quick Actions Panel
Create a quick actions panel above the chat with multiple buttons:
- 🎙️ Voice Input
- 💡 Get Exercises
- 📊 View Summary
- ⭐ Bookmark Conversation

### Option 4: Proactive Suggestions
After 3-5 messages in a conversation, automatically suggest: "Would you like some personalized exercises to help with what you're feeling?"

---

## 🧪 Testing the Integration

### Test Scenarios:

1. **No Conversation History:**
   - Button should be disabled
   - Shows "Start a conversation first" tooltip

2. **After Anxious Message:**
   ```
   User: "I'm so anxious and worried about everything"
   → Click "Get Exercises"
   → Should show breathing exercises with high priority
   ```

3. **After Sad Message:**
   ```
   User: "I feel so down and empty today"
   → Click "Get Exercises"
   → Should show mindfulness/movement exercises
   ```

4. **After Crisis Message:**
   ```
   User: "I can't take this anymore"
   → Auto-show exercises (high priority)
   → Include crisis resources
   ```

5. **Mobile Responsiveness:**
   - Test on mobile viewport (375px width)
   - Ensure widget scrolls properly
   - Button is easily tappable

---

## 📱 Mobile Optimization Tips

```tsx
{/* Mobile-friendly button */}
<button
  onClick={handleGetExercises}
  className="
    flex items-center justify-center gap-2 
    px-3 py-2 sm:px-4 sm:py-2
    text-sm sm:text-base
    bg-gradient-to-r from-purple-600 to-indigo-600 
    text-white rounded-lg
    active:scale-95 transition-transform
  "
>
  <Sparkles className="w-4 h-4" />
  <span className="hidden sm:inline">Get Exercises</span>
  <span className="sm:hidden">Exercises</span>
</button>
```

---

## 🎨 Styling Variations

### Minimal Style:
```tsx
<button 
  onClick={handleGetExercises}
  className="text-indigo-600 hover:text-indigo-700 underline text-sm"
>
  💡 Show me exercises that might help
</button>
```

### Icon Only (Compact):
```tsx
<button 
  onClick={handleGetExercises}
  className="p-2 rounded-full bg-purple-100 hover:bg-purple-200 text-purple-600"
  title="Get exercise recommendations"
>
  <Sparkles className="w-5 h-5" />
</button>
```

---

## 🔔 User Feedback

### Loading State:
```tsx
{loadingExercises && (
  <div className="flex items-center gap-2 text-sm text-gray-600 my-2">
    <Loader2 className="w-4 h-4 animate-spin" />
    <span>Finding the best exercises for you...</span>
  </div>
)}
```

### Success Message:
```tsx
{exerciseRecs && (
  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
    <p className="text-sm text-green-800">
      ✅ Found {exerciseRecs.exercises.length} exercises tailored to how you're feeling
    </p>
  </div>
)}
```

---

## 🎯 Complete Example Implementation

```tsx
// Add to Chatbot.tsx after the chat history display

{/* Exercise Recommendations Section */}
<div className="mt-4 space-y-3">
  {/* Trigger Button */}
  {!showExercises && (
    <div className="flex justify-center">
      <button
        onClick={handleGetExercises}
        disabled={loadingExercises || chatHistory.length === 0}
        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
      >
        {loadingExercises ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Finding exercises...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            <span>Get Personalized Exercises</span>
          </>
        )}
      </button>
    </div>
  )}

  {/* Exercise Widget Display */}
  {showExercises && exerciseRecs && (
    <div className="animate-fadeIn">
      <ExerciseRecommendationsWidget
        recommendations={exerciseRecs}
        onSelectExercise={handleSelectExercise}
      />
      
      <div className="flex justify-center mt-4">
        <button
          onClick={() => setShowExercises(false)}
          className="text-sm text-gray-600 hover:text-gray-800 underline"
        >
          Hide Exercises
        </button>
      </div>
    </div>
  )}
</div>
```

---

## 💡 Pro Tips

1. **Persist Recommendations**: Store exercise recommendations in session state so users can refer back to them
2. **Track Engagement**: Log when users click on exercises to measure feature adoption
3. **A/B Testing**: Try different button placements and see which gets more engagement
4. **Keyboard Shortcuts**: Add `Ctrl+E` or `Cmd+E` to trigger exercise recommendations
5. **Accessibility**: Ensure screen readers announce when recommendations load

---

## 🎉 You're Done!

The exercise recommendations feature is now fully integrated into your chatbot. Users can:
- ✅ Get personalized exercises based on their emotional state
- ✅ See beautiful, easy-to-understand exercise cards
- ✅ Understand why each exercise was recommended
- ✅ Click to start exercises (implement navigation in `handleSelectExercise`)

**Next Steps:**
- Test with real conversations
- Gather user feedback
- Add exercise detail pages
- Implement exercise completion tracking

---

*Happy coding! 🚀*
