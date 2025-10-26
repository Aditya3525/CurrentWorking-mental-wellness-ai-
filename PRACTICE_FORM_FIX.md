# Practice Form Validation Fix

## Issue
When trying to add practices through the admin form, the backend was rejecting requests with a 400 (Bad Request) error due to validation failures.

## Root Cause
The backend validation schema uses Joi to validate practice payloads. The schema expects:

1. **Optional enum fields** (like `category`, `intensityLevel`) to be either valid enum values OR `null`
   - `category`: Must be one of `'MEDITATION'`, `'YOGA'`, `'BREATHING'`, etc. OR `null`
   - `intensityLevel`: Must be one of `'low'`, `'medium'`, `'high'` OR `null`

2. **Empty strings** (`''`) were being sent from the frontend instead of `null` for optional fields
   - Joi's `.allow(null)` does NOT accept empty strings
   - Empty string `''` !== `null` in validation

## Solution Implemented

### Backend Changes (`backend/src/routes/admin.ts`)
Added detailed logging to help debug validation failures:
```typescript
console.log('Practice creation request body:', JSON.stringify(req.body, null, 2));
console.error('Practice validation failed:', error.details.map(d => d.message));
```

### Frontend Changes (`frontend/src/admin/PracticeForm.tsx`)

1. **Added payload cleaning logic** to convert empty strings to `null`:
```typescript
const finalPayload: any = { ...payload, ...updated };
if (finalPayload.category === '') finalPayload.category = null;
if (finalPayload.intensityLevel === '') finalPayload.intensityLevel = null;
```

2. **Removed empty arrays** to avoid sending unnecessary data:
```typescript
if (Array.isArray(finalPayload.requiredEquipment) && finalPayload.requiredEquipment.length === 0) {
  delete finalPayload.requiredEquipment;
}
// ... similar for environment, timeOfDay, sensoryEngagement, steps, contraindications
```

3. **Improved error handling** to show actual validation errors:
```typescript
const errorData = await response.json().catch(() => ({}));
const errorMessage = errorData.details ? 
  `Validation errors: ${errorData.details.join(', ')}` : 
  errorData.error || `Failed to ${existing ? 'update' : 'create'} practice`;
```

4. **Added debug logging** to see exactly what's being sent:
```typescript
console.log('Sending practice payload:', JSON.stringify(finalPayload, null, 2));
```

## Validation Schema Reference

The backend expects these exact values for enum fields:

### Required Fields
- `title`: string (max 200 chars)
- `type`: string
- `approach`: string
- `duration`: number (integer, min 0)
- `difficulty`: string
- `format`: string (optional)

### Optional Enum Fields (must be valid value OR null, NOT empty string)
- `category`: `'MEDITATION'` | `'YOGA'` | `'BREATHING'` | `'MINDFULNESS'` | `'JOURNALING'` | `'CBT_TECHNIQUE'` | `'GROUNDING_EXERCISE'` | `'SELF_REFLECTION'` | `'MOVEMENT'` | `'SLEEP_HYGIENE'` | `null`
- `intensityLevel`: `'low'` | `'medium'` | `'high'` | `null`

### Optional Array Fields
- `requiredEquipment`: array of strings (max 20 items, each max 100 chars)
- `environment`: array of `'home'` | `'work'` | `'public'` | `'nature'`
- `timeOfDay`: array of `'morning'` | `'afternoon'` | `'evening'` | `'night'`
- `sensoryEngagement`: array of strings (max 10 items, each max 100 chars)
- `steps`: array of objects with `{ step: number, instruction: string, duration?: number }`
- `contraindications`: array of strings (max 20 items, each max 200 chars)

## Testing
After this fix, try adding a practice again. The console logs will now show:
1. **Frontend**: The exact payload being sent (in browser console)
2. **Backend**: The received payload and any validation errors (in backend console/logs)

## Next Steps
1. Try creating a practice again
2. Check the console logs for the payload details
3. If validation still fails, the error message will now clearly state which field(s) are invalid
4. The backend logs will show the exact validation error messages

## Common Issues to Check

### If you still get validation errors:
1. **Format validation**: Make sure `format` is either `'Audio'` or `'Video'` (not `'Audio/Video'`)
2. **Sleep practices**: Must use `format: 'Audio'` (enforced by backend)
3. **Required media URLs**: 
   - Audio format requires `audioUrl`
   - Video format requires either `videoUrl` OR `youtubeUrl`
4. **Thumbnail**: Required - either direct URL or will be auto-generated from YouTube ID
5. **Duration**: Must be a positive integer (minutes)

## Files Modified
- `backend/src/routes/admin.ts` - Added debug logging
- `frontend/src/admin/PracticeForm.tsx` - Fixed payload cleaning and error handling
