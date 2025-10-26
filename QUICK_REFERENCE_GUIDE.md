# Quick Reference: What Changed & How to Use

**For Developers** - Quick lookup guide for the architecture improvements

---

## 🚀 Quick Start

### **Testing the New Validation**
Try sending invalid data to test validation:

```bash
# Test auth validation (invalid email)
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"invalid-email","password":"test123"}'

# Response: 422 with field errors
{
  "success": false,
  "error": "Validation failed",
  "errors": {
    "email": ["Invalid email"]
  }
}

# Test missing required fields
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Response: 422 with missing field error
{
  "success": false,
  "error": "Validation failed",
  "errors": {
    "password": ["Required"]
  }
}
```

---

## 📁 File Location Reference

### **Need to add validation to a route?**
1. Create schema in: `backend/src/api/validators/[domain].validator.ts`
2. Import in route: `backend/src/routes/[route].ts`
3. Apply: `router.post('/path', validate(yourSchema), controller)`

### **Need to throw an error in controller?**
1. Import: `import { NotFoundError, BadRequestError } from '../shared/errors/AppError'`
2. Throw: `throw new NotFoundError('ResourceName')`
3. Error middleware handles the rest automatically

### **Need to use Prisma?**
1. Import singleton: `import { prisma } from '../config/database'`
2. Use directly: `const user = await prisma.user.findUnique(...)`
3. Never create: ❌ `new PrismaClient()`

### **Need to manage frontend state?**
1. Auth: `import { useAuthStore } from '@/stores/authStore'`
2. Notifications: `import { useNotificationStore } from '@/stores/notificationStore'`
3. App state: `import { useAppStore } from '@/stores/appStore'`

### **Need to fetch data in React?**
1. Assessments: `import { useAssessments } from '@/hooks/useAssessments'`
2. Mood: `import { useMood } from '@/hooks/useMood'`
3. Chat: `import { useChat } from '@/hooks/useChat'`

---

## 🎯 Common Tasks

### **Add New API Endpoint with Validation**

1. **Create Zod schema** (`backend/src/api/validators/myfeature.validator.ts`):
```typescript
import { z } from 'zod';

export const createItemSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    price: z.number().positive()
  })
});
```

2. **Add route** (`backend/src/routes/myroute.ts`):
```typescript
import { validate } from '../middleware/validate';
import { createItemSchema } from '../api/validators/myfeature.validator';

router.post('/items', validate(createItemSchema), createItem);
```

3. **Controller throws errors** (`backend/src/controllers/myController.ts`):
```typescript
import { NotFoundError, ConflictError } from '../shared/errors/AppError';
import { prisma } from '../config/database';

export const createItem = async (req: Request, res: Response) => {
  try {
    const { name, description, price } = req.body;
    
    // Check if exists
    const existing = await prisma.item.findUnique({ where: { name } });
    if (existing) {
      throw new ConflictError('Item with this name already exists');
    }
    
    // Create item
    const item = await prisma.item.create({
      data: { name, description, price }
    });
    
    res.status(201).json({ success: true, data: { item } });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new DatabaseError('Failed to create item');
  }
};
```

Done! Validation and error handling work automatically.

---

### **Use React Query Hook in Component**

```typescript
import { useAssessments } from '@/hooks/useAssessments';

function AssessmentList() {
  const { assessments, isLoading, error } = useAssessments();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {assessments.map(assessment => (
        <div key={assessment.id}>{assessment.type}</div>
      ))}
    </div>
  );
}
```

**Benefits:**
- ✅ Automatic caching
- ✅ Background refetching
- ✅ Loading/error states
- ✅ No manual `useEffect`

---

### **Use Zustand Store for Auth**

```typescript
import { useAuthStore } from '@/stores/authStore';

function UserProfile() {
  const { user, isAuthenticated, logout } = useAuthStore();
  
  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }
  
  return (
    <div>
      <h1>Welcome, {user?.name}!</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

**Benefits:**
- ✅ Global state (no prop drilling)
- ✅ Automatic localStorage persistence
- ✅ Optimized re-renders

---

### **Show Toast Notification**

```typescript
import { useNotificationStore } from '@/stores/notificationStore';

function MyComponent() {
  const { success, error, warning, info } = useNotificationStore();
  
  const handleSave = async () => {
    try {
      await saveData();
      success('Data saved successfully!');
    } catch (err) {
      error('Failed to save data');
    }
  };
  
  return <button onClick={handleSave}>Save</button>;
}
```

**Benefits:**
- ✅ Auto-dismiss after duration
- ✅ Queue multiple notifications
- ✅ Different types (success/error/warning/info)

---

## 🐛 Debugging Guide

### **Validation Error: Field not accepted**
**Problem:** Field in request not matching schema

**Check:**
1. Schema definition in `validators/[file].validator.ts`
2. Field name spelling (case-sensitive)
3. Field type (string vs number)

**Example:**
```typescript
// Schema says:
price: z.number()

// But you send:
{ price: "100" } // ❌ String, not number

// Fix:
{ price: 100 } // ✅ Number
```

---

### **Error: Cannot find module '../config/database'**
**Problem:** Import path incorrect

**Fix:**
```typescript
// ❌ Wrong
import { prisma } from './config/database';

// ✅ Correct
import { prisma } from '../config/database';
```

---

### **Error: AppError is not a constructor**
**Problem:** Forgot to import error class

**Fix:**
```typescript
// ❌ Missing import
throw new NotFoundError('User');

// ✅ With import
import { NotFoundError } from '../shared/errors/AppError';
throw new NotFoundError('User');
```

---

### **Database Connection Errors**
**Problem:** Multiple Prisma clients or connection issues

**Check:**
1. Using singleton: `import { prisma } from '../config/database'`
2. Not creating new clients: ❌ `new PrismaClient()`
3. Database file exists: `backend/prisma/dev.db`

**Fix:**
```bash
# Reset database
cd backend
npx prisma migrate reset
npx prisma generate
```

---

## 📊 Validation Schema Examples

### **Common Patterns**

```typescript
import { z } from 'zod';

// String with length
z.string().min(2).max(100)

// Email
z.string().email()

// Optional string
z.string().optional()

// Number range
z.number().min(0).max(100)

// Positive number
z.number().positive()

// Integer
z.number().int()

// Enum
z.enum(['active', 'inactive', 'pending'])

// Array of strings
z.array(z.string())

// Date
z.date() // or z.string().datetime()

// Boolean
z.boolean()

// URL
z.string().url()

// UUID
z.string().uuid()

// Object
z.object({
  name: z.string(),
  age: z.number()
})

// Nested
z.object({
  user: z.object({
    email: z.string().email(),
    profile: z.object({
      bio: z.string().optional()
    })
  })
})
```

---

## 🎨 Error Response Formats

### **Validation Error (422)**
```json
{
  "success": false,
  "error": "Validation failed",
  "errors": {
    "email": ["Invalid email"],
    "password": ["String must contain at least 6 character(s)"]
  },
  "timestamp": "2025-10-16T10:30:00.000Z"
}
```

### **Not Found (404)**
```json
{
  "success": false,
  "error": "User not found",
  "statusCode": 404,
  "timestamp": "2025-10-16T10:30:00.000Z"
}
```

### **Unauthorized (401)**
```json
{
  "success": false,
  "error": "Invalid credentials",
  "statusCode": 401,
  "timestamp": "2025-10-16T10:30:00.000Z"
}
```

### **Conflict (409)**
```json
{
  "success": false,
  "error": "User already exists with this email",
  "statusCode": 409,
  "timestamp": "2025-10-16T10:30:00.000Z"
}
```

### **Database Error (500)**
```json
{
  "success": false,
  "error": "Server error during registration",
  "statusCode": 500,
  "timestamp": "2025-10-16T10:30:00.000Z"
}
```

---

## 🔍 Where to Find Things

| What | Where |
|------|-------|
| Validation schemas | `backend/src/api/validators/` |
| Custom errors | `backend/src/shared/errors/AppError.ts` |
| Database singleton | `backend/src/config/database.ts` |
| Validation middleware | `backend/src/middleware/validate.ts` |
| Error handler | `backend/src/middleware/errorHandler.ts` |
| Auth store | `frontend/src/stores/authStore.ts` |
| Notification store | `frontend/src/stores/notificationStore.ts` |
| App store | `frontend/src/stores/appStore.ts` |
| React Query hooks | `frontend/src/hooks/` |
| Query client config | `frontend/src/lib/queryClient.ts` |

---

## ⚡ Performance Tips

### **Database Queries**
✅ **Do:** Use indexes (already added)
```typescript
// Indexed queries are fast
await prisma.user.findUnique({ where: { email } });
await prisma.assessment.findMany({ where: { userId } });
```

❌ **Don't:** Full table scans
```typescript
// Slow - scans entire table
await prisma.user.findMany({ where: { name: { contains: 'John' } } });
```

### **React Query**
✅ **Do:** Use stale time for static data
```typescript
const { data } = useQuery({
  queryKey: ['templates'],
  queryFn: fetchTemplates,
  staleTime: 5 * 60 * 1000 // 5 minutes
});
```

❌ **Don't:** Fetch on every render
```typescript
// Avoid - refetches constantly
const { data } = useQuery({
  queryKey: ['templates'],
  queryFn: fetchTemplates,
  staleTime: 0
});
```

### **Zustand**
✅ **Do:** Use selectors to prevent re-renders
```typescript
const userName = useAuthStore(state => state.user?.name);
```

❌ **Don't:** Select entire store
```typescript
const store = useAuthStore(); // Re-renders on any state change
```

---

## 📞 Need Help?

### **Documentation:**
- `ARCHITECTURE_INTEGRATION_SUCCESS.md` - Overview of changes
- `INTEGRATION_PROGRESS_REPORT.md` - Detailed progress
- `ARCHITECTURE_IMPROVEMENTS.md` - Original plan

### **Code Examples:**
- Auth controller: `backend/src/controllers/authController.ts`
- Auth routes: `backend/src/routes/auth.ts`
- Auth validator: `backend/src/api/validators/auth.validator.ts`

---

**Last Updated:** October 16, 2025  
**Quick Reference Version:** 1.0
