# V2 Schema - Quick Reference Guide

## Overview
This guide provides quick access to V2 schema field definitions, usage patterns, and examples.

---

## V2 Schema Fields

| Field Name | Type | Purpose | Example Values |
|------------|------|---------|----------------|
| `focusAreas` | `string[]` | Target specific mental health concerns | `["anxiety", "stress", "panic"]` |
| `immediateRelief` | `boolean` | Flag 5-10 min quick relief content | `true` / `false` |
| `crisisEligible` | `boolean` | Mark crisis-safe content | `true` / `false` |
| `timeOfDay` | `string[]` | Best time to consume/practice | `["morning", "afternoon", "evening", "night"]` |
| `environment` | `string[]` | Suitable environments | `["home", "work", "public", "nature"]` |

---

## Database Schema

### Content Model
```prisma
model Content {
  // ... existing fields ...
  
  // V2 Schema Fields
  focusAreas        String?   // JSON: ["anxiety", "stress"]
  immediateRelief   Boolean?  @default(false)
  crisisEligible    Boolean?  @default(false)
  timeOfDay         String?   // JSON: ["morning", "evening"]
  environment       String?   // JSON: ["home", "work"]
  
  // ... timestamps ...
}
```

### Practice Model
```prisma
model Practice {
  // ... existing fields ...
  
  // V2 Schema Fields
  focusAreas        String?   // JSON: ["anxiety", "stress"]
  immediateRelief   Boolean?  @default(false)
  crisisEligible    Boolean?  @default(false)
  timeOfDay         String?   // JSON: ["morning", "evening"]
  environment       String?   // JSON: ["home", "work"]
  
  // ... timestamps ...
}
```

**Note**: Array fields are stored as JSON strings in SQLite.

---

## Backend API

### Validation Rules
```typescript
// Content & Practice Validation
focusAreas: Joi.array().items(Joi.string()).optional()
immediateRelief: Joi.boolean().optional()
crisisEligible: Joi.boolean().optional()
timeOfDay: Joi.array().items(Joi.string().valid('morning', 'afternoon', 'evening', 'night')).optional()
environment: Joi.array().items(Joi.string().valid('home', 'work', 'public', 'nature')).optional()
```

### POST Request Example
```typescript
// Content POST
{
  title: "Managing Anxiety: Quick Techniques",
  type: "article",
  description: "5-minute anxiety relief techniques",
  // ... other fields ...
  
  // V2 Schema Fields
  focusAreas: ["anxiety", "panic", "stress"],
  immediateRelief: true,
  crisisEligible: true,
  timeOfDay: ["morning", "afternoon"],
  environment: ["home", "work"]
}

// Practice POST
{
  title: "5-Minute Breathing Exercise",
  type: "breathing",
  duration: 5,
  // ... other fields ...
  
  // V2 Schema Fields
  focusAreas: ["anxiety", "stress"],
  immediateRelief: true,
  crisisEligible: true,
  timeOfDay: ["morning", "afternoon", "evening"],
  environment: ["home", "work", "public"]
}
```

### Database Storage
```typescript
// Arrays are JSON.stringify'd before storage
focusAreas: focusAreas && focusAreas.length > 0 
  ? JSON.stringify(focusAreas) 
  : undefined

// Booleans default to false
immediateRelief: immediateRelief ?? false
crisisEligible: crisisEligible ?? false

// Empty arrays stored as undefined
timeOfDay: timeOfDay && timeOfDay.length > 0 
  ? JSON.stringify(timeOfDay) 
  : undefined
```

### Database Retrieval
```typescript
// Arrays are JSON.parse'd on retrieval
const content = await prisma.content.findUnique({ where: { id } });

// Parse JSON arrays
const focusAreas = content.focusAreas 
  ? JSON.parse(content.focusAreas) 
  : [];
const timeOfDay = content.timeOfDay 
  ? JSON.parse(content.timeOfDay) 
  : [];
const environment = content.environment 
  ? JSON.parse(content.environment) 
  : [];

// Booleans are already boolean type
const immediateRelief = content.immediateRelief ?? false;
const crisisEligible = content.crisisEligible ?? false;
```

---

## Frontend Forms

### TypeScript Interface
```typescript
interface ContentFormData {
  // ... existing fields ...
  
  // V2 Schema Fields
  focusAreas: string[];
  immediateRelief: boolean;
  crisisEligible: boolean;
  timeOfDay: string[];
  environment: string[];
}

interface PracticeRecord {
  // ... existing fields ...
  
  // V2 Schema Fields
  focusAreas?: string[];
  immediateRelief?: boolean;
  crisisEligible?: boolean;
  timeOfDay?: string[];
  environment?: string[];
}
```

### Initial State
```typescript
// Content Form
const [formData, setFormData] = useState<ContentFormData>({
  // ... existing fields ...
  
  // V2 Schema Fields
  focusAreas: [],
  immediateRelief: false,
  crisisEligible: false,
  timeOfDay: [],
  environment: [],
});

// Practice Form
const [formData, setFormData] = useState<Partial<PracticeRecord>>({
  // ... existing fields ...
  
  // V2 Schema Fields
  focusAreas: [],
  immediateRelief: false,
  crisisEligible: false,
  timeOfDay: [],
  environment: [],
});
```

### UI Patterns

#### Focus Areas Input
```tsx
<div className="space-y-2">
  <Label htmlFor="focusAreas">Focus Areas (comma-separated)</Label>
  <Input
    id="focusAreas"
    value={formData.focusAreas.join(', ')}
    onChange={(e) => {
      const areas = e.target.value
        .split(',')
        .map(a => a.trim().toLowerCase())
        .filter(a => a.length > 0);
      setFormData({ ...formData, focusAreas: areas });
    }}
    placeholder="anxiety, stress, panic, depression, sleep, focus"
  />
  <p className="text-xs text-muted-foreground">
    Lowercase keywords for targeted recommendations
  </p>
</div>
```

#### Immediate Relief Checkbox
```tsx
<div className="flex items-center space-x-2">
  <input
    type="checkbox"
    id="immediateRelief"
    checked={formData.immediateRelief}
    onChange={(e) => setFormData({ ...formData, immediateRelief: e.target.checked })}
    className="rounded"
  />
  <Label htmlFor="immediateRelief" className="cursor-pointer">
    ⚡ Quick Relief Content (5-10 min techniques)
  </Label>
</div>
```

#### Crisis-Eligible Checkbox
```tsx
<div className="flex items-center space-x-2">
  <input
    type="checkbox"
    id="crisisEligible"
    checked={formData.crisisEligible}
    onChange={(e) => setFormData({ ...formData, crisisEligible: e.target.checked })}
    className="rounded"
  />
  <Label htmlFor="crisisEligible" className="cursor-pointer">
    ✅ Crisis-Safe Content
  </Label>
</div>
```

#### Time of Day Multi-Select
```tsx
<div className="space-y-2">
  <Label>Best Time to Consume</Label>
  <div className="flex flex-wrap gap-2">
    {['morning', 'afternoon', 'evening', 'night'].map((time) => (
      <label key={time} className="flex items-center space-x-2 cursor-pointer">
        <input
          type="checkbox"
          checked={formData.timeOfDay.includes(time)}
          onChange={(e) => {
            const updated = e.target.checked
              ? [...formData.timeOfDay, time]
              : formData.timeOfDay.filter(t => t !== time);
            setFormData({ ...formData, timeOfDay: updated });
          }}
          className="rounded"
        />
        <span className="text-sm capitalize">{time}</span>
      </label>
    ))}
  </div>
</div>
```

#### Environment Multi-Select
```tsx
<div className="space-y-2">
  <Label>Suitable Environments</Label>
  <div className="flex flex-wrap gap-2">
    {['home', 'work', 'public', 'nature'].map((env) => (
      <label key={env} className="flex items-center space-x-2 cursor-pointer">
        <input
          type="checkbox"
          checked={formData.environment.includes(env)}
          onChange={(e) => {
            const updated = e.target.checked
              ? [...formData.environment, env]
              : formData.environment.filter(e => e !== env);
            setFormData({ ...formData, environment: updated });
          }}
          className="rounded"
        />
        <span className="text-sm capitalize">{env}</span>
      </label>
    ))}
  </div>
</div>
```

---

## Testing Examples

### Test Content Creation
```javascript
const axios = require('axios');

const token = 'your-admin-token';
const baseURL = 'http://localhost:5000/api/admin';

// Create content with V2 fields
const response = await axios.post(
  `${baseURL}/contents`,
  {
    title: 'Test Content',
    type: 'article',
    description: 'Testing V2 fields',
    isPublished: true,
    
    // V2 Schema Fields
    focusAreas: ['anxiety', 'stress', 'panic'],
    immediateRelief: true,
    crisisEligible: true,
    timeOfDay: ['morning', 'afternoon', 'evening'],
    environment: ['home', 'work', 'public']
  },
  { headers: { Authorization: `Bearer ${token}` } }
);

console.log('Created content:', response.data);
```

### Test Practice Creation
```javascript
const axios = require('axios');

const token = 'your-admin-token';
const baseURL = 'http://localhost:5000/api/admin';

// Create practice with V2 fields
const response = await axios.post(
  `${baseURL}/practices`,
  {
    title: 'Test Practice',
    type: 'breathing',
    duration: 5,
    level: 'Beginner',
    approach: 'All',
    isPublished: true,
    
    // V2 Schema Fields
    focusAreas: ['anxiety', 'stress'],
    immediateRelief: true,
    crisisEligible: false,
    timeOfDay: ['morning', 'evening'],
    environment: ['home', 'nature']
  },
  { headers: { Authorization: `Bearer ${token}` } }
);

console.log('Created practice:', response.data);
```

### Verify JSON Parsing
```javascript
// Retrieve content and verify V2 fields
const content = await axios.get(
  `${baseURL}/contents/${contentId}`,
  { headers: { Authorization: `Bearer ${token}` } }
);

// Parse JSON arrays
const focusAreas = JSON.parse(content.data.focusAreas);
const timeOfDay = JSON.parse(content.data.timeOfDay);
const environment = JSON.parse(content.data.environment);

console.log('Focus Areas:', focusAreas);
console.log('Immediate Relief:', content.data.immediateRelief);
console.log('Crisis Eligible:', content.data.crisisEligible);
console.log('Time of Day:', timeOfDay);
console.log('Environment:', environment);
```

---

## Common Use Cases

### Crisis Mode Content Filtering
```typescript
// Filter for crisis-safe content only
const crisisSafeContent = await prisma.content.findMany({
  where: {
    crisisEligible: true,
    isPublished: true
  }
});
```

### Immediate Relief Recommendations
```typescript
// Get quick relief content/practices
const immediateReliefItems = await prisma.content.findMany({
  where: {
    immediateRelief: true,
    duration: { lte: 10 }, // 10 minutes or less
    isPublished: true
  }
});
```

### Focus Area Matching
```typescript
// Find content matching user's focus areas
const userFocusAreas = ['anxiety', 'stress'];

// Note: This requires custom logic since focusAreas is JSON string
const allContent = await prisma.content.findMany({
  where: { isPublished: true }
});

const matchedContent = allContent.filter(content => {
  if (!content.focusAreas) return false;
  const areas = JSON.parse(content.focusAreas);
  return areas.some(area => userFocusAreas.includes(area));
});
```

### Context-Aware Recommendations
```typescript
// Recommend content based on time and location
const currentTime = 'morning';
const currentLocation = 'home';

const allContent = await prisma.content.findMany({
  where: { isPublished: true }
});

const contextualContent = allContent.filter(content => {
  const timeMatch = !content.timeOfDay || 
    JSON.parse(content.timeOfDay).includes(currentTime);
  
  const envMatch = !content.environment || 
    JSON.parse(content.environment).includes(currentLocation);
  
  return timeMatch && envMatch;
});
```

---

## Validation Rules

### Focus Areas
- **Format**: Comma-separated string input
- **Processing**: Auto-lowercase, trimmed, filtered empty strings
- **Storage**: JSON array in database
- **Examples**: `"anxiety, stress, panic"` → `["anxiety", "stress", "panic"]`

### Immediate Relief
- **Type**: Boolean checkbox
- **Default**: `false`
- **Purpose**: Flag 5-10 minute quick relief content/practices
- **UI Icon**: ⚡

### Crisis Eligible
- **Type**: Boolean checkbox
- **Default**: `false`
- **Purpose**: Mark content/practices safe for users in crisis
- **UI Icon**: ✅

### Time of Day
- **Options**: `morning`, `afternoon`, `evening`, `night`
- **Format**: Multi-select checkboxes
- **Storage**: JSON array in database
- **Validation**: Only allowed values accepted

### Environment
- **Options**: `home`, `work`, `public`, `nature`
- **Format**: Multi-select checkboxes
- **Storage**: JSON array in database
- **Validation**: Only allowed values accepted

---

## Troubleshooting

### Empty Arrays in Database
**Issue**: Arrays showing as `null` or `undefined` in database

**Solution**: Arrays with no items are stored as `undefined`:
```typescript
focusAreas: focusAreas && focusAreas.length > 0 
  ? JSON.stringify(focusAreas) 
  : undefined
```

### JSON Parse Errors
**Issue**: `JSON.parse()` failing on array fields

**Solution**: Always check for null/undefined before parsing:
```typescript
const focusAreas = content.focusAreas 
  ? JSON.parse(content.focusAreas) 
  : [];
```

### Boolean Defaults
**Issue**: Boolean fields showing as `null`

**Solution**: Use nullish coalescing operator:
```typescript
const immediateRelief = content.immediateRelief ?? false;
const crisisEligible = content.crisisEligible ?? false;
```

### Validation Errors
**Issue**: `timeOfDay` or `environment` validation failing

**Solution**: Ensure only allowed enum values are used:
- **timeOfDay**: `morning`, `afternoon`, `evening`, `night`
- **environment**: `home`, `work`, `public`, `nature`

---

## File Locations

### Backend
- **Schema**: `backend/prisma/schema.prisma`
- **Validation**: `backend/src/routes/admin.ts` (lines 40-110)
- **Handlers**: `backend/src/routes/admin.ts` (lines 550-1028)

### Frontend
- **Content Form**: `frontend/src/components/admin/EnhancedContentForm.tsx`
- **Practice Form**: `frontend/src/admin/PracticeForm.tsx`

### Testing
- **Test Suite**: `test-v2-complete.js` (root directory)

### Documentation
- **Completion Report**: `V2-SYNCHRONIZATION-COMPLETE.md`
- **Before/After**: `V2-BEFORE-AFTER-COMPARISON.md`
- **Mission Summary**: `V2-MISSION-ACCOMPLISHED.md`
- **Quick Reference**: `V2-QUICK-REFERENCE.md` (this file)

---

## Quick Commands

### Database Operations
```bash
# Push schema changes to database
npx prisma db push

# Regenerate Prisma client
npx prisma generate

# Open Prisma Studio to view data
npx prisma studio
```

### Backend Operations
```bash
# Compile TypeScript
cd backend
npx tsc

# Start backend server
npm start

# Run in development mode
npm run dev
```

### Testing
```bash
# Run V2 comprehensive test suite
node test-v2-complete.js

# Run simple practice test
node test-basic-practice.js
```

### Frontend Operations
```bash
# Start frontend dev server
cd frontend
npm run dev

# Build for production
npm run build
```

---

## Additional Resources

- **V2 Schema Guide**: See original documentation for detailed field specifications
- **Synchronization Plan**: `V2-SYNC-PLAN.md`
- **Completion Report**: `V2-SYNCHRONIZATION-COMPLETE.md`
- **Before/After Comparison**: `V2-BEFORE-AFTER-COMPARISON.md`
- **Mission Summary**: `V2-MISSION-ACCOMPLISHED.md`

---

**Last Updated**: January 2025  
**Status**: Production Ready ✅  
**Version**: V2 Schema (Complete)
