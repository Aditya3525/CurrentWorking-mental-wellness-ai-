# Backend TypeScript Type Resolution

## Problem Summary
The backend was failing to start with TypeScript compilation errors due to Express router type inference issues with the custom `AuthRequest` type.

## Root Cause
Express's `router.get()` and `router.post()` methods have complex type inference that doesn't properly recognize when middleware modifies the Request type. Even though:
- The `AuthRequest` interface extends `Request` correctly
- The `User` type from Prisma was properly imported
- The `authenticate` middleware properly assigns `req.user`

TypeScript's type system was comparing the Prisma `User` type as if it were different from itself.

## Solution Applied: Type Assertion Workaround

Instead of typing the route handler parameter directly:
```typescript
// ❌ This causes TypeScript errors
router.post('/:id/engage', authenticate, async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  // ...
});
```

We use type assertion inside the handler:
```typescript
// ✅ This works
router.post('/:id/engage', authenticate, async (req, res) => {
  const authReq = req as AuthRequest;
  const userId = authReq.user?.id;
  // ...
});
```

## Files Modified

### backend/src/middleware/auth.ts
✅ Updated `AuthRequest` interface to use full Prisma `User` type:
```typescript
import { PrismaClient, User } from '@prisma/client';

interface AuthRequest extends Request {
  user?: User;  // Full Prisma User type
}
```

✅ Removed `.select()` to fetch complete user object:
```typescript
const user = await prisma.user.findUnique({ where: { id: decoded.id } });
// Previously: select: { id: true, email: true, name: true }
```

### backend/src/routes/engagement.ts
Applied type assertion workaround to **all 4 authenticated routes**:

1. **POST /:id/engage** (Line 35)
   - Tracks content engagement
   - Records rating, completion, mood changes
   
2. **GET /personalized** (Line 149)
   - Crisis-aware content recommendations
   - Builds context from assessments, moods, chat messages
   
3. **GET /check** (Line 299)
   - On-demand crisis assessment
   - Provides real-time crisis level detection
   
4. **GET /:id/engagement** (Line 368)
   - Engagement statistics for specific content
   - User engagement + aggregated stats

### Pattern Used in All Routes:
```typescript
router.[method]('path', authenticate, async (req, res) => {
  const authReq = req as AuthRequest;
  const userId = authReq.user?.id;
  
  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized'
    });
  }
  
  // userId is now typed as string (not string | undefined)
  // Rest of route logic...
});
```

## Prisma Client Status
✅ Prisma Client regenerated (v6.16.2)
✅ Database schema synchronized
✅ All models available:
  - `ContentEngagement` (userId, contentId, rating, effectiveness, etc.)
  - `Content` (completions, averageRating, effectiveness fields)
  - `AssessmentResult` (uses `completedAt` field)
  - `User` (full type with all 22+ fields)

## Type Safety Maintained
Despite using `as AuthRequest`, type safety is preserved because:
1. The `authenticate` middleware ALWAYS runs first
2. Middleware ALWAYS attaches `req.user` when auth succeeds
3. The `userId` null check provides runtime safety
4. TypeScript flow analysis narrows `userId` to `string` after the guard

## Next Steps
1. ✅ Backend compiles successfully
2. ✅ Server starts on configured port
3. ⏳ Integration testing with frontend
4. ⏳ End-to-end user flow validation

## Technical Notes
- This is a known TypeScript limitation with Express middleware and custom Request types
- Alternative solutions (custom `RequestHandler` type wrappers) are more verbose
- Type assertion is pragmatic and safe given the middleware architecture
- Future: Consider migrating to Fastify or NestJS for better TypeScript support

## Status
**RESOLVED** ✅ Backend should now start successfully.
