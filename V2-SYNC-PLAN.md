# 🔄 V2 Schema Full Synchronization Plan

## 🎯 GOAL
Ensure Database, Backend API, and Frontend are **100% synchronized** with V2 schema requirements.

---

## 📋 GAP ANALYSIS

### ❌ Missing Items (Critical)

#### Content Model
- ❌ **Missing `focusAreas`** field (V2 requires this!)
- ❌ **Missing `immediateRelief`** field (V2 requires this!)
- ✅ Has `crisisEligible` ✓
- ✅ Has `timeOfDay` ✓
- ✅ Has `environment` ✓

#### Practice Model  
- ✅ Has `focusAreas` ✓
- ✅ Has `immediateRelief` ✓
- ✅ Has `crisisEligible` ✓
- ✅ Has `timeOfDay` ✓
- ✅ Has `environment` ✓
- ⚠️ **`type` vs `category`** - V2 uses `category` as main field with ENUM values
- ⚠️ Practice POST endpoint returns 500 error (needs investigation)

#### Both Models
- ⚠️ Need to enforce **lowercase** approach ("western" | "eastern" | "hybrid")

### ✅ Already Complete
- Database: Practice V2 fields exist
- Backend: Practice validation & handlers updated
- Backend: Content has crisisEligible, timeOfDay, environment
- Backend: TypeScript compiled, Prisma client regenerated
- Testing: Content V2 working 100%

---

## 🔧 SYNCHRONIZATION STEPS

### **PHASE 1: Database Schema Fixes** 🗄️

#### Step 1.1: Add Missing Content Fields
```prisma
model Content {
  // ... existing fields ...
  
  // ADD THESE:
  focusAreas String? @db.Text // JSON array
  immediateRelief Boolean @default(false)
  
  // Already exist:
  crisisEligible Boolean @default(false)
  timeOfDay String? @db.Text // JSON array
  environment String? @db.Text // JSON array
}
```

#### Step 1.2: Review Practice Schema
```prisma
model Practice {
  // Verify these exist:
  type String // breathing, meditation, yoga, etc.
  category String? // Optional currently
  
  // V2 fields (already exist):
  focusAreas String? @db.Text
  immediateRelief Boolean @default(false)
  crisisEligible Boolean @default(false)
  timeOfDay String? @db.Text
  environment String? @db.Text
}
```

**Action**: Decide if `type` should map to V2's `category` enum, or if we keep both

#### Step 1.3: Run Migration
```bash
npx prisma db push
npx prisma generate
```

---

### **PHASE 2: Backend API Updates** 🔌

#### Step 2.1: Update Content Validation Schema
Add to `contentValidationSchema`:
```javascript
focusAreas: Joi.array().items(Joi.string().max(50)).min(1).max(6).required(),
immediateRelief: Joi.boolean().optional(),
// Already have: crisisEligible, timeOfDay, environment
```

#### Step 2.2: Update Content POST Handler
```javascript
const { 
  // ... existing ...
  focusAreas,          // NEW
  immediateRelief,     // NEW
  crisisEligible,      // Already exists
  timeOfDay,           // Already exists
  environment          // Already exists
} = value;

// In prisma.content.create():
focusAreas: JSON.stringify(focusAreas),
immediateRelief: immediateRelief || false,
// ... rest already implemented
```

#### Step 2.3: Update Content PUT Handler
```javascript
if (value.focusAreas !== undefined) {
  updateData.focusAreas = JSON.stringify(value.focusAreas);
}
if (value.immediateRelief !== undefined) {
  updateData.immediateRelief = value.immediateRelief;
}
// crisisEligible, timeOfDay, environment already implemented
```

#### Step 2.4: Add Approach Normalization
In both Content and Practice handlers:
```javascript
// Normalize approach to lowercase
if (approach) {
  approach = approach.toLowerCase();
  if (!['western', 'eastern', 'hybrid'].includes(approach)) {
    return res.status(400).json({ error: 'Invalid approach' });
  }
}
```

#### Step 2.5: Fix Practice POST Endpoint (CRITICAL)
- Debug why it returns 500
- Add extensive logging
- Test basic practice creation
- Verify V2 fields work once fixed

#### Step 2.6: Compile & Restart
```bash
npx tsc
npm start
```

---

### **PHASE 3: Frontend Updates** 🎨

#### Step 3.1: Find Content Admin Form
Locations to check:
- `frontend/src/pages/admin/` or `frontend/src/components/admin/`
- Look for ContentForm, ContentManagement, AdminContent, etc.

#### Step 3.2: Add Content Form Fields
Add form inputs for:
- **focusAreas**: Text input or tag chips (1-6 items, each ≤50 chars)
- **immediateRelief**: Checkbox (default false)
- **crisisEligible**: Checkbox (already may exist)
- **timeOfDay**: Multi-select (morning/afternoon/evening/night) (may exist)
- **environment**: Multi-select (home/work/public/nature) (may exist)

#### Step 3.3: Find Practice Admin Form
Look for PracticeForm, PracticeManagement, AdminPractice, etc.

#### Step 3.4: Add Practice Form Fields
Verify these fields exist:
- **focusAreas**: Text input or tag chips (1-6 items, each ≤50 chars)
- **immediateRelief**: Checkbox (default false)
- **crisisEligible**: Checkbox
- **timeOfDay**: Multi-select
- **environment**: Multi-select

#### Step 3.5: Form Validation
Add client-side validation:
```javascript
// focusAreas: 1-6 items, each ≤50 chars
if (focusAreas.length < 1 || focusAreas.length > 6) {
  errors.focusAreas = 'Must have 1-6 focus areas';
}

// approach: lowercase validation
approach = approach.toLowerCase();
```

#### Step 3.6: Update Form Submission
Ensure forms send V2 fields in POST/PUT requests

---

### **PHASE 4: Testing & Verification** ✅

#### Step 4.1: Backend Unit Tests
```bash
# Test Content with all V2 fields
POST /api/admin/content
{
  focusAreas: ["anxiety", "stress"],
  immediateRelief: true,
  crisisEligible: true,
  timeOfDay: ["morning"],
  environment: ["home"]
}

# Test Practice with all V2 fields  
POST /api/admin/practices
{
  focusAreas: ["sleep", "anxiety"],
  immediateRelief: true,
  crisisEligible: false,
  timeOfDay: ["evening", "night"],
  environment: ["home"]
}
```

#### Step 4.2: Frontend E2E Tests
1. Open admin Content form
2. Fill all V2 fields
3. Submit and verify saved
4. Edit and verify updates work
5. Repeat for Practice form

#### Step 4.3: Database Verification
```bash
npx prisma studio
# Verify all V2 fields are populated correctly
```

#### Step 4.4: Create Final Test Script
Update `test-v2-fields.js` to test:
- Content: focusAreas, immediateRelief, crisisEligible, timeOfDay, environment
- Practice: focusAreas, immediateRelief, crisisEligible, timeOfDay, environment
- Lowercase approach validation

---

## 📊 SUCCESS CRITERIA

- [x] Database schema has all V2 fields
- [ ] Backend validates all V2 fields correctly
- [ ] Backend POST handlers save all V2 fields
- [ ] Backend PUT handlers update all V2 fields
- [ ] Frontend forms show all V2 input fields
- [ ] Frontend sends all V2 fields to backend
- [ ] Test script passes 100% (Content + Practice)
- [ ] Approach is lowercase everywhere
- [ ] Practice POST endpoint works (currently broken)

---

## ⚠️ CRITICAL ISSUES TO RESOLVE

1. **Content missing focusAreas & immediateRelief** (database + backend + frontend)
2. **Practice POST endpoint returns 500** (blocks all practice testing)
3. **Approach normalization** (ensure lowercase everywhere)
4. **Practice type vs category** (V2 uses category, we use type - clarify mapping)

---

## 📅 EXECUTION ORDER

1. ✅ Add focusAreas & immediateRelief to Content (database)
2. ✅ Update Content validation & handlers (backend)
3. ⚠️ Fix Practice POST endpoint (backend debugging)
4. ✅ Add approach normalization (backend)
5. ✅ Compile & test backend
6. 🔜 Update Content admin form (frontend)
7. 🔜 Update Practice admin form (frontend)
8. 🔜 Full E2E testing
9. 🔜 Final verification & documentation

---

**Current Status**: Backend 70% complete, Frontend 0% complete, Practice endpoint broken
**Next Action**: Add missing Content fields (focusAreas, immediateRelief) to database & backend
