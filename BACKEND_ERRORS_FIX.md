# Backend Errors - Diagnosis & Fix Plan

## Issues Identified

### 1. **Missing Prisma Model: ContentEngagement**
- Error: `Property 'contentEngagement' does not exist on type 'PrismaClient'`
- **Cause**: The ContentEngagement model was added to schema.prisma but migrations were not applied
- **Fix**: Need to run `npx prisma db push` or create migration

### 2. **Missing Content Fields**
- Error: Properties `completions`, `averageRating` don't exist
- **Cause**: Schema has these fields but Prisma client not regenerated
- **Fix**: Regenerate Prisma client after migration

### 3. **User Model Missing Fields**
- Errors: `preferredApproach`, `wellnessScore`, `moodEntries`, `assessmentResults` don't exist
- **Cause**: These relations/fields don't exist in current User model
- **Fix**: Need to either:
  - Add these fields to User model, OR
  - Fetch them separately with individual queries

### 4. **Crisis Detection Missing Context Parameter**
- Error: `Expected 2 arguments, but got 1`
- **Cause**: `detectCrisisLevel(userId, context)` requires context object
- **Fix**: Build context object before calling

### 5. **CrisisDetectionResult Missing 'factors' Property**
- Error: `Property 'factors' does not exist`
- **Cause**: The interface only has: level, confidence, indicators, recommendations, immediateAction
- **Fix**: Remove `factors` from response or add to interface

### 6. **AuthRequest Type Mismatch**
- Error: `Types of property 'user' are incompatible`
- **Cause**: Prisma User type doesn't match custom AuthRequest.user type
- **Fix**: Cast to `any` or update AuthRequest interface

### 7. **ChatMessage 'role' Field**
- Error: `'role' does not exist in type 'ChatMessageWhereInput'`
- **Cause**: ChatMessage model doesn't have a 'role' field in Prisma schema
- **Fix**: Remove the `where: { role: 'user' }` filter

## Recommended Fix Strategy

**Option 1: Minimal Fix (Quick - 15 min)**
- Comment out problematic routes temporarily
- Focus on getting server running
- Fix one endpoint at a time

**Option 2: Proper Fix (Medium - 1-2 hours)**
- Apply Prisma migrations properly
- Regenerate Prisma client
- Fix all type mismatches
- Test each endpoint

**Option 3: Simplified Implementation (Recommended - 30-45 min)**
- Simplify engagement routes to work with existing schema
- Remove dependency on non-existent User fields
- Build minimal context for crisis detection
- Get server running, then enhance incrementally

## Immediate Actions (Option 3)

1. ✅ Fix `authenticateJWT` → `authenticate` (3 locations)
2. ✅ Fix `req.user!.id` → `(req.user as any)?.id` (all locations)
3. ✅ Remove `factors` from crisis detection response
4. ✅ Build minimal crisis context without User relations
5. ✅ Remove `where: { role: 'user' }` from ChatMessage query
6. ✅ Comment out or simplify personalized recommendations temporarily
7. ✅ Apply Prisma migration for ContentEngagement model

