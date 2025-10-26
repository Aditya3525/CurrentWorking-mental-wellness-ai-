# 🔄 Migration Plan: Content & Practice Schema Updates

## 📊 Summary of Changes

### **Version 2 Key Improvements:**
1. **Standardized approach casing:** "western" | "eastern" | "hybrid" (lowercase everywhere)
2. **Added to Practice:** `focusAreas`, `immediateRelief`, `crisisEligible`
3. **Added to Content:** `crisisEligible`, `timeOfDay`, `environment`
4. **Removed complex fields:** `culturalContext`, `sensoryEngagement`, `intensityLevel` (optional)
5. **Simplified:** Focus on high-impact fields only

---

## 🗃️ Step 1: Database Schema Changes

### **Content Model Changes:**
- ✅ Add `crisisEligible: Boolean @default(false)`
- ✅ Add `timeOfDay: String?` (JSON array)
- ✅ Add `environment: String?` (JSON array)
- ⚠️ Keep existing fields for backward compatibility

### **Practice Model Changes:**
- ✅ Add `focusAreas: String?` (JSON array)
- ✅ Add `immediateRelief: Boolean @default(false)`
- ✅ Add `crisisEligible: Boolean @default(false)`
- ✅ Keep existing `timeOfDay` and `environment`

### **Data Migration Notes:**
- All new fields are optional or have defaults
- No breaking changes to existing data
- Can migrate in phases

---

## 🔧 Step 2: Backend Changes

### **2.1 Update Validation Schemas** (`backend/src/routes/admin.ts`)
- Add `crisisEligible` validation for Content
- Add `timeOfDay` and `environment` validation for Content
- Add `focusAreas`, `immediateRelief`, `crisisEligible` for Practice
- Ensure approach accepts lowercase values

### **2.2 Update API Handlers**
- Modify Content POST/PUT to handle new fields
- Modify Practice POST/PUT to handle new fields
- Update response serialization

### **2.3 Update Recommendation Services**
- `enhancedRecommendationService.ts` - Use new fields in matching
- `recommendationService.ts` - Incorporate `crisisEligible` in safety checks

---

## 🎨 Step 3: Frontend Changes

### **3.1 Admin Content Form**
- Add `crisisEligible` checkbox
- Add `timeOfDay` multi-select
- Add `environment` multi-select
- Ensure approach dropdown uses lowercase values

### **3.2 Admin Practice Form**
- Add `focusAreas` input (array)
- Add `immediateRelief` checkbox
- Add `crisisEligible` checkbox
- Ensure approach dropdown uses lowercase values

---

## 📝 Step 4: Data Consistency

### **4.1 Migration Script** (optional)
- Convert existing approach values to lowercase
- Default `crisisEligible = false` for all existing records
- No data loss

### **4.2 Seeding Updates**
- Update seed data to include new fields
- Ensure test data has proper values

---

## ✅ Implementation Order

1. **Phase 1: Database** (Non-breaking)
   - Update Prisma schema
   - Run migration
   - Generate Prisma client

2. **Phase 2: Backend** (Backward compatible)
   - Update validation schemas
   - Update API handlers
   - Update recommendation logic

3. **Phase 3: Frontend** (Progressive enhancement)
   - Update admin forms
   - Test CRUD operations
   - Verify recommendations

4. **Phase 4: Testing**
   - Test content creation with new fields
   - Test practice creation with new fields
   - Test recommendation matching
   - Verify backward compatibility

---

## 🚨 Breaking Changes: NONE

All changes are additive and backward compatible:
- New fields are optional or have defaults
- Existing records continue to work
- Frontend gracefully handles missing fields

---

## 📊 Field Mapping

| Field | Current | New | Action |
|-------|---------|-----|--------|
| **Content.crisisEligible** | ❌ None | ✅ Boolean | ADD |
| **Content.timeOfDay** | ❌ None | ✅ String (JSON) | ADD |
| **Content.environment** | ❌ None | ✅ String (JSON) | ADD |
| **Practice.focusAreas** | ❌ None | ✅ String (JSON) | ADD |
| **Practice.immediateRelief** | ❌ None | ✅ Boolean | ADD |
| **Practice.crisisEligible** | ❌ None | ✅ Boolean | ADD |
| **approach casing** | Mixed | Lowercase only | STANDARDIZE |

---

## 🎯 Success Criteria

- ✅ Database migrations run without errors
- ✅ Backend validation accepts new fields
- ✅ Frontend forms include new fields
- ✅ Existing content/practices still work
- ✅ New content/practices can be created with new fields
- ✅ Recommendation system uses new fields
- ✅ Tests pass
- ✅ No data loss

---

## 📅 Estimated Timeline

- Database: 15 minutes
- Backend: 45 minutes
- Frontend: 30 minutes
- Testing: 30 minutes
- **Total: ~2 hours**

---

**Ready to proceed with implementation?**
