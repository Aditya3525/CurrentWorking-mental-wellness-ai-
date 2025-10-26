# 📝 Content & Practice Creation Guide

## Complete Field Reference for Adding Content and Practices

---

## 🎨 **CONTENT FORM** - All Attributes

### **API Endpoint:**
```
POST /api/admin/content
PUT /api/admin/content/:id
```

### **Required Fields:**

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `title` | string | Content title (max 200 chars) | "5-Minute Breathing for Anxiety" |
| `type` | string | Legacy content type | "video", "audio", "article" |
| `category` | string | Content category | "Anxiety", "Depression", "Mindfulness" |
| `approach` | string | Therapeutic approach | "western", "eastern", "hybrid" |
| `description` | string | Content description (max 2000 chars) | "A quick breathing exercise..." |

### **Optional Basic Fields:**

| Field | Type | Description | Example | Default |
|-------|------|-------------|---------|---------|
| `content` | string | Article text or resource URL | "Full article text..." | `""` |
| `url` | string (URI) | External content URL | "https://example.com/resource" | `null` |
| `youtubeUrl` | string | YouTube video ID (max 50 chars) | "dQw4w9WgXcQ" | `null` |
| `thumbnailUrl` | string (URI) | Thumbnail image URL | "https://example.com/thumb.jpg" | Auto from YouTube |
| `duration` | integer | Duration in seconds | `300` (5 minutes) | `null` |
| `difficulty` | string | Legacy difficulty | "Beginner", "Intermediate", "Advanced" | `null` |
| `tags` | string or array | Tags (comma-separated or array) | "anxiety,breathing,quick" or `["anxiety","breathing"]` | `""` |
| `isPublished` | boolean | Published status | `true` or `false` | `false` |

### **✨ Enhanced Fields (New):**

| Field | Type | Valid Values | Description | Example |
|-------|------|--------------|-------------|---------|
| `contentType` | enum | VIDEO, AUDIO_MEDITATION, BREATHING_EXERCISE, ARTICLE, STORY, JOURNAL_PROMPT, CBT_WORKSHEET, YOGA_SEQUENCE, MINDFULNESS_EXERCISE, PSYCHOEDUCATION, CRISIS_RESOURCE | Specific content type | "BREATHING_EXERCISE" |
| `intensityLevel` | enum | low, medium, high | Intensity/difficulty level | "low" |
| `focusAreas` | array | Max 10 strings (max 100 chars each) | Problem areas addressed | `["anxiety", "panic-attacks", "stress"]` |
| `immediateRelief` | boolean | `true` or `false` | Quick relief content flag | `true` |
| `culturalContext` | string | Max 500 chars | Cultural considerations | "Suitable for all cultures" |
| `hasSubtitles` | boolean | `true` or `false` | Video subtitles available | `true` |
| `transcript` | string | Max 50000 chars | Full text transcript | "Welcome to this meditation..." |

### **Auto-Generated Fields (Read-Only):**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique content ID |
| `completions` | integer | Times completed by users |
| `averageRating` | float | Average user rating (1-5) |
| `effectiveness` | float | User-reported effectiveness |
| `createdAt` | datetime | Creation timestamp |
| `updatedAt` | datetime | Last update timestamp |

---

## 📋 **Example Content Creation Requests**

### **Example 1: Breathing Exercise (Video)**

```json
POST /api/admin/content

{
  "title": "5-Minute Box Breathing for Anxiety",
  "type": "video",
  "contentType": "BREATHING_EXERCISE",
  "category": "Anxiety",
  "approach": "western",
  "description": "A guided box breathing exercise to calm anxiety. Inhale for 4, hold for 4, exhale for 4, hold for 4. Perfect for acute stress relief.",
  "youtubeUrl": "dQw4w9WgXcQ",
  "duration": 300,
  "difficulty": "Beginner",
  "intensityLevel": "low",
  "tags": ["anxiety", "breathing", "quick-relief", "beginner"],
  "focusAreas": ["anxiety", "panic-attacks", "stress"],
  "immediateRelief": true,
  "hasSubtitles": true,
  "isPublished": true
}
```

### **Example 2: Psychoeducation Article**

```json
POST /api/admin/content

{
  "title": "Understanding Cognitive Behavioral Therapy (CBT)",
  "type": "article",
  "contentType": "PSYCHOEDUCATION",
  "category": "Education",
  "approach": "western",
  "description": "Learn the fundamentals of CBT and how it can help manage anxiety and depression through thought patterns.",
  "content": "Cognitive Behavioral Therapy (CBT) is a type of psychotherapy...\n\n[Full article text here]",
  "thumbnailUrl": "https://example.com/cbt-thumbnail.jpg",
  "difficulty": "Beginner",
  "intensityLevel": "low",
  "tags": ["education", "cbt", "therapy", "mental-health"],
  "focusAreas": ["anxiety", "depression", "cognitive-distortions"],
  "immediateRelief": false,
  "culturalContext": "Evidence-based Western therapeutic approach",
  "isPublished": true
}
```

### **Example 3: Crisis Resource**

```json
POST /api/admin/content

{
  "title": "24/7 Crisis Support Hotline",
  "type": "article",
  "contentType": "CRISIS_RESOURCE",
  "category": "Crisis Support",
  "approach": "hybrid",
  "description": "Immediate help available 24/7. Call 988 for Suicide & Crisis Lifeline or text HOME to 741741 for Crisis Text Line.",
  "content": "**988 Suicide & Crisis Lifeline**\nCall or text 988\nAvailable 24/7\n\n**Crisis Text Line**\nText HOME to 741741\n\n**Emergency Services**\nCall 911 for immediate danger",
  "thumbnailUrl": "https://example.com/crisis-help.jpg",
  "tags": ["crisis", "emergency", "hotline", "immediate-help"],
  "focusAreas": ["suicidal-ideation", "crisis", "emergency"],
  "immediateRelief": true,
  "isPublished": true
}
```

### **Example 4: Audio Meditation**

```json
POST /api/admin/content

{
  "title": "10-Minute Body Scan Meditation",
  "type": "audio",
  "contentType": "AUDIO_MEDITATION",
  "category": "Mindfulness",
  "approach": "eastern",
  "description": "A guided body scan meditation to release tension and promote deep relaxation. Perfect for bedtime or stress relief.",
  "url": "https://example.com/audio/body-scan.mp3",
  "thumbnailUrl": "https://example.com/body-scan-thumb.jpg",
  "duration": 600,
  "difficulty": "Beginner",
  "intensityLevel": "low",
  "tags": ["meditation", "body-scan", "relaxation", "mindfulness"],
  "focusAreas": ["stress", "sleep", "anxiety"],
  "immediateRelief": false,
  "transcript": "Welcome to this 10-minute body scan meditation. Find a comfortable position...",
  "hasSubtitles": false,
  "isPublished": true
}
```

---

## 🧘 **PRACTICE FORM** - All Attributes

### **API Endpoint:**
```
POST /api/admin/practices
PUT /api/admin/practices/:id
```

### **Required Fields:**

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `title` | string | Practice title (max 200 chars) | "Morning Breathing Ritual" |
| `type` | string | Legacy practice type | "breathing", "meditation", "yoga", "sleep" |
| `duration` | integer | Duration in **minutes** | `10` (10 minutes) |
| `difficulty` | string | Difficulty level | "Beginner", "Intermediate", "Advanced" |
| `approach` | string | Therapeutic approach | "Western", "Eastern", "Hybrid", "All" |
| `format` | string | Media format | "Audio", "Video" (NOT "Audio/Video") |

### **Optional Basic Fields:**

| Field | Type | Description | Example | Default |
|-------|------|-------------|---------|---------|
| `description` | string | Practice description (max 2000 chars) | "A calming morning practice..." | `null` |
| `audioUrl` | string (URI) | Audio file URL | "https://example.com/audio.mp3" | `null` |
| `videoUrl` | string (URI) | Video file URL | "https://example.com/video.mp4" | `null` |
| `youtubeUrl` | string | YouTube video ID (max 50 chars) | "dQw4w9WgXcQ" | `null` |
| `thumbnailUrl` | string (URI) | Thumbnail image URL | "https://example.com/thumb.jpg" | Auto from YouTube |
| `tags` | string or array | Tags | "meditation,morning,breathing" | `null` |
| `isPublished` | boolean | Published status | `true` or `false` | `false` |
| `instructions` | string | Practice instructions (max 5000 chars) | "Step 1: Find a comfortable seat..." | `null` |
| `benefits` | string | Practice benefits (max 2000 chars) | "Reduces anxiety, improves focus..." | `null` |
| `precautions` | string | Safety precautions (max 2000 chars) | "Avoid if you have back pain..." | `null` |

### **✨ Enhanced Fields (New):**

| Field | Type | Valid Values | Description | Example |
|-------|------|--------------|-------------|---------|
| `category` | enum | MEDITATION, YOGA, BREATHING, MINDFULNESS, JOURNALING, CBT_TECHNIQUE, GROUNDING_EXERCISE, SELF_REFLECTION, MOVEMENT, SLEEP_HYGIENE | Specific practice category | "BREATHING" |
| `intensityLevel` | enum | low, medium, high | Physical/mental intensity | "low" |
| `requiredEquipment` | array | Max 20 strings (max 100 chars each) | Equipment needed | `["yoga mat", "cushion", "quiet space"]` |
| `environment` | array | home, work, public, nature | Suitable environments | `["home", "nature"]` |
| `timeOfDay` | array | morning, afternoon, evening, night | Best time to practice | `["morning", "evening"]` |
| `sensoryEngagement` | array | Max 10 strings (max 100 chars each) | Senses engaged | `["visual", "auditory", "tactile"]` |
| `steps` | array of objects | Max 50 steps | Structured practice steps | See example below |
| `contraindications` | array | Max 20 strings (max 200 chars each) | When NOT to practice | `["pregnancy", "recent injury"]` |

### **Steps Object Structure:**

```typescript
{
  step: number,        // Step number (1, 2, 3...)
  instruction: string, // Step instruction (max 500 chars)
  duration: number     // Optional step duration in seconds
}
```

### **Auto-Generated Fields (Read-Only):**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique practice ID |
| `createdAt` | datetime | Creation timestamp |
| `updatedAt` | datetime | Last update timestamp |

---

## 📋 **Example Practice Creation Requests**

### **Example 1: Breathing Practice (Audio)**

```json
POST /api/admin/practices

{
  "title": "4-7-8 Breathing Technique",
  "type": "breathing",
  "category": "BREATHING",
  "duration": 5,
  "difficulty": "Beginner",
  "intensityLevel": "low",
  "approach": "Western",
  "format": "Audio",
  "description": "A simple breathing technique to calm the nervous system. Inhale for 4, hold for 7, exhale for 8.",
  "audioUrl": "https://example.com/478-breathing.mp3",
  "thumbnailUrl": "https://example.com/breathing-thumb.jpg",
  "tags": ["breathing", "quick", "anxiety", "sleep"],
  "instructions": "1. Sit comfortably with your back straight\n2. Place tongue behind upper teeth\n3. Exhale completely through mouth\n4. Close mouth, inhale through nose for 4 counts\n5. Hold breath for 7 counts\n6. Exhale through mouth for 8 counts\n7. Repeat 3-4 times",
  "benefits": "Reduces anxiety, promotes sleep, lowers blood pressure, improves focus",
  "precautions": "May cause lightheadedness if done too rapidly. Start slowly.",
  "requiredEquipment": ["quiet space"],
  "environment": ["home", "work"],
  "timeOfDay": ["evening", "night"],
  "sensoryEngagement": ["auditory", "proprioceptive"],
  "steps": [
    {
      "step": 1,
      "instruction": "Sit comfortably with your back straight and tongue behind upper teeth",
      "duration": 10
    },
    {
      "step": 2,
      "instruction": "Exhale completely through your mouth with a whoosh sound",
      "duration": 8
    },
    {
      "step": 3,
      "instruction": "Close mouth and inhale quietly through nose for 4 counts",
      "duration": 4
    },
    {
      "step": 4,
      "instruction": "Hold your breath for 7 counts",
      "duration": 7
    },
    {
      "step": 5,
      "instruction": "Exhale completely through mouth for 8 counts",
      "duration": 8
    },
    {
      "step": 6,
      "instruction": "Repeat cycle 3 more times",
      "duration": 60
    }
  ],
  "contraindications": ["severe respiratory conditions", "COPD"],
  "isPublished": true
}
```

### **Example 2: Meditation Practice (Video)**

```json
POST /api/admin/practices

{
  "title": "Morning Gratitude Meditation",
  "type": "meditation",
  "category": "MEDITATION",
  "duration": 10,
  "difficulty": "Beginner",
  "intensityLevel": "low",
  "approach": "Hybrid",
  "format": "Video",
  "description": "Start your day with gratitude. This guided meditation helps cultivate appreciation and positive mindset.",
  "youtubeUrl": "abc123xyz",
  "tags": ["meditation", "gratitude", "morning", "positive"],
  "instructions": "Find a quiet space, sit comfortably, and follow the guided meditation. Focus on things you're grateful for.",
  "benefits": "Increases positive emotions, improves mood, enhances resilience, better sleep",
  "precautions": "None - suitable for all",
  "requiredEquipment": ["quiet space", "cushion or chair"],
  "environment": ["home"],
  "timeOfDay": ["morning"],
  "sensoryEngagement": ["visual", "auditory"],
  "steps": [
    {
      "step": 1,
      "instruction": "Find a comfortable seated position with spine straight",
      "duration": 30
    },
    {
      "step": 2,
      "instruction": "Close eyes and take 3 deep breaths",
      "duration": 30
    },
    {
      "step": 3,
      "instruction": "Think of 3 things you're grateful for today",
      "duration": 180
    },
    {
      "step": 4,
      "instruction": "Visualize each thing and feel the gratitude",
      "duration": 240
    },
    {
      "step": 5,
      "instruction": "Gently open eyes and carry gratitude with you",
      "duration": 30
    }
  ],
  "contraindications": [],
  "isPublished": true
}
```

### **Example 3: Yoga Practice (Video)**

```json
POST /api/admin/practices

{
  "title": "Gentle Evening Yoga Flow",
  "type": "yoga",
  "category": "YOGA",
  "duration": 20,
  "difficulty": "Beginner",
  "intensityLevel": "low",
  "approach": "Eastern",
  "format": "Video",
  "description": "A gentle yoga sequence to release tension and prepare your body for restful sleep.",
  "videoUrl": "https://example.com/evening-yoga.mp4",
  "thumbnailUrl": "https://example.com/yoga-thumb.jpg",
  "tags": ["yoga", "evening", "relaxation", "sleep"],
  "instructions": "Follow along with the video. Move slowly and breathe deeply. Listen to your body.",
  "benefits": "Releases muscle tension, calms nervous system, improves flexibility, promotes better sleep",
  "precautions": "Avoid if you have recent injuries. Modify poses as needed.",
  "requiredEquipment": ["yoga mat", "comfortable clothing", "blocks (optional)"],
  "environment": ["home"],
  "timeOfDay": ["evening", "night"],
  "sensoryEngagement": ["visual", "proprioceptive", "tactile"],
  "contraindications": ["recent back injury", "severe joint problems", "pregnancy (consult doctor)"],
  "isPublished": true
}
```

### **Example 4: Sleep Hygiene Practice (Audio ONLY)**

```json
POST /api/admin/practices

{
  "title": "Progressive Muscle Relaxation for Sleep",
  "type": "sleep",
  "category": "SLEEP_HYGIENE",
  "duration": 15,
  "difficulty": "Beginner",
  "intensityLevel": "low",
  "approach": "Western",
  "format": "Audio",
  "description": "A progressive muscle relaxation technique to release physical tension and promote deep sleep. Tense and release each muscle group.",
  "audioUrl": "https://example.com/pmr-sleep.mp3",
  "thumbnailUrl": "https://example.com/pmr-thumb.jpg",
  "tags": ["sleep", "relaxation", "pmr", "bedtime"],
  "instructions": "Lie down in bed. Tense each muscle group for 5 seconds, then release for 10 seconds. Start with toes, move upward.",
  "benefits": "Reduces muscle tension, promotes deep relaxation, improves sleep quality, reduces anxiety",
  "precautions": "Don't tense muscles too hard. Skip any areas with pain or injury.",
  "requiredEquipment": ["bed or comfortable surface"],
  "environment": ["home"],
  "timeOfDay": ["night"],
  "sensoryEngagement": ["auditory", "proprioceptive"],
  "steps": [
    {
      "step": 1,
      "instruction": "Lie comfortably in bed, close eyes",
      "duration": 30
    },
    {
      "step": 2,
      "instruction": "Tense feet and toes for 5 seconds, then release for 10 seconds",
      "duration": 15
    },
    {
      "step": 3,
      "instruction": "Tense calves for 5 seconds, release for 10 seconds",
      "duration": 15
    },
    {
      "step": 4,
      "instruction": "Continue through thighs, buttocks, stomach, chest, arms, hands",
      "duration": 300
    },
    {
      "step": 5,
      "instruction": "Tense shoulders and neck, release",
      "duration": 15
    },
    {
      "step": 6,
      "instruction": "Tense face muscles, release",
      "duration": 15
    },
    {
      "step": 7,
      "instruction": "Breathe naturally and allow body to sink into relaxation",
      "duration": 120
    }
  ],
  "contraindications": ["recent muscle or joint injury"],
  "isPublished": true
}
```

---

## ⚠️ **Important Validation Rules**

### **Content Rules:**
1. ✅ `title` is REQUIRED (max 200 chars)
2. ✅ `type`, `category`, `approach`, `description` are REQUIRED
3. ✅ `duration` must be in **seconds** (not minutes)
4. ✅ Video content must have `url` OR `youtubeUrl` OR `content`
5. ✅ Audio content must have `url` OR `content`
6. ✅ `contentType` enum values are case-sensitive (UPPERCASE)
7. ✅ `intensityLevel` values are lowercase: "low", "medium", "high"
8. ✅ `focusAreas` max 10 items, each max 100 chars
9. ✅ `transcript` max 50000 chars

### **Practice Rules:**
1. ✅ `title`, `type`, `duration`, `difficulty`, `approach`, `format` are REQUIRED
2. ✅ `duration` must be in **minutes** (not seconds - different from Content!)
3. ✅ `format` CANNOT be "Audio/Video" (legacy, not supported)
4. ✅ Sleep practices (`type: "sleep"`) MUST use `format: "Audio"`
5. ✅ Audio format practices MUST have `audioUrl`
6. ✅ Video format practices MUST have `videoUrl` OR `youtubeUrl`
7. ✅ `thumbnailUrl` is required (or auto-generated from YouTube)
8. ✅ `category` enum values are UPPERCASE: "MEDITATION", "YOGA", etc.
9. ✅ `steps` max 50 items, each instruction max 500 chars
10. ✅ `requiredEquipment` max 20 items, each max 100 chars

---

## 🎯 **Quick Reference**

### **Content Duration:** SECONDS
### **Practice Duration:** MINUTES

### **Content Enums:**
- **contentType:** VIDEO, AUDIO_MEDITATION, BREATHING_EXERCISE, ARTICLE, STORY, JOURNAL_PROMPT, CBT_WORKSHEET, YOGA_SEQUENCE, MINDFULNESS_EXERCISE, PSYCHOEDUCATION, CRISIS_RESOURCE
- **intensityLevel:** low, medium, high

### **Practice Enums:**
- **category:** MEDITATION, YOGA, BREATHING, MINDFULNESS, JOURNALING, CBT_TECHNIQUE, GROUNDING_EXERCISE, SELF_REFLECTION, MOVEMENT, SLEEP_HYGIENE
- **intensityLevel:** low, medium, high
- **environment:** home, work, public, nature
- **timeOfDay:** morning, afternoon, evening, night

---

## 📝 **Summary**

### **Content = Educational/Resources (articles, videos, audio)**
- Duration in **SECONDS**
- Can be text, video, audio, worksheets, etc.
- 11 `contentType` options
- Tracks completions, ratings, effectiveness

### **Practice = Active Exercises (meditation, yoga, breathing)**
- Duration in **MINUTES**
- Always has audio OR video component
- 10 `category` options
- Can include structured steps
- Tracks equipment, environment, time preferences

---

**Need help? Check the validation schemas in the code for exact requirements!**
