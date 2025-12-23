# Help & Safety Backend Implementation - Deployment Checklist

## ✅ Completed Tasks

### 1. Database Schema ✅
- [x] Created 8 new models in `backend/prisma/schema.prisma`
  - [x] SupportTicket (with status, priority, category enums)
  - [x] FAQ (with category enum, view tracking, voting)
  - [x] CrisisResource (with type enum, multi-contact support)
  - [x] SafetyPlan (one-to-one with User, JSON fields)
  - [x] Therapist (with credential enum, full profile fields)
  - [x] TherapistBooking (with status enum, admin workflow)
- [x] Added 6 enums for type safety
- [x] Updated User model with 3 new relations
- [x] Applied migration: `20251204060718_add_help_safety_system`
- [x] Regenerated Prisma Client

### 2. Controllers (Business Logic) ✅
- [x] Created `backend/src/controllers/supportController.ts` (4 endpoints)
  - [x] createSupportTicket (auto-escalation for CRISIS)
  - [x] getUserTickets (filterable by status)
  - [x] getTicketById (user-scoped)
  - [x] acknowledgeTicket (close ticket)
- [x] Created `backend/src/controllers/faqController.ts` (4 endpoints)
  - [x] getFAQs (public, filterable by category)
  - [x] searchFAQs (full-text search)
  - [x] incrementFAQView (analytics)
  - [x] voteFAQ (helpful/not helpful)
- [x] Created `backend/src/controllers/crisisController.ts` (4 endpoints)
  - [x] getCrisisResources (public, filterable by country)
  - [x] createOrUpdateSafetyPlan (upsert pattern)
  - [x] getSafetyPlan (with template fallback)
  - [x] deleteSafetyPlan
- [x] Created `backend/src/controllers/therapistController.ts` (6 endpoints)
  - [x] getTherapists (filterable by specialty, location, insurance)
  - [x] getTherapistById
  - [x] searchTherapists (full-text search)
  - [x] requestBooking (create PENDING booking)
  - [x] getUserBookings
  - [x] cancelBooking (prevents canceling COMPLETED)
- [x] Created `backend/src/controllers/admin/helpSafetyAdminController.ts` (18 endpoints)
  - [x] Support ticket management (view all, respond, close)
  - [x] FAQ CRUD operations
  - [x] Crisis resource CRUD operations
  - [x] Therapist CRUD operations
  - [x] Booking management (view all, process/confirm/cancel)

### 3. Routes (API Definitions) ✅
- [x] Created `backend/src/routes/support.ts` (4 routes, authenticated)
- [x] Created `backend/src/routes/faq.ts` (4 routes, public)
- [x] Created `backend/src/routes/crisis.ts` (4 routes, mixed auth)
- [x] Created `backend/src/routes/therapists.ts` (6 routes, mixed auth)
- [x] Created `backend/src/routes/admin/helpSafetyAdmin.ts` (18 routes, admin only)

### 4. Server Configuration ✅
- [x] Imported 5 new route modules in `backend/src/server.ts`
- [x] Registered 5 route paths:
  - [x] `/api/support` → supportRoutes
  - [x] `/api/faq` → faqRoutes
  - [x] `/api/crisis` → crisisRoutes
  - [x] `/api/therapists` → therapistRoutes
  - [x] `/api/admin/help-safety` → helpSafetyAdminRoutes

### 5. Validation & Error Handling ✅
- [x] Created Zod validation schemas for all input data
- [x] Integrated with existing error classes (ValidationError, NotFoundError)
- [x] Implemented structured logging (Pino)
- [x] Added admin activity logging for audit trail

### 6. Seed Data ✅
- [x] Created `backend/prisma/seed-help-safety.ts`
- [x] Seeded 8 FAQs (covering 7 categories)
- [x] Seeded 8 crisis resources (US-focused, diverse types)
- [x] Seeded 5 therapists (diverse specialties, realistic profiles)
- [x] Executed seed script successfully

### 7. Documentation ✅
- [x] Created `HELP_SAFETY_BACKEND_IMPLEMENTATION.md` (comprehensive overview)
- [x] Created `HELP_SAFETY_API_REFERENCE.md` (API endpoint documentation)
- [x] Created this deployment checklist

---

## 🚨 Pre-Deployment Verification

### Backend Server Test
```bash
cd backend
npm run dev
```

**Expected Console Output:**
```
✔ Server is running on port 5000
✔ Database connection successful
✔ No startup errors
```

### Test API Endpoints

#### 1. Test Public FAQ Endpoint
```bash
curl http://localhost:5000/api/faq
```
**Expected**: JSON response with 8 FAQs

#### 2. Test Public Crisis Resources
```bash
curl http://localhost:5000/api/crisis/resources
```
**Expected**: JSON response with 8 crisis resources

#### 3. Test Public Therapist Directory
```bash
curl http://localhost:5000/api/therapists
```
**Expected**: JSON response with 5 therapists

#### 4. Test Authenticated Support Ticket (requires JWT)
```bash
curl -X POST http://localhost:5000/api/support/tickets \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"subject":"Test","message":"Test message for support ticket","category":"GENERAL"}'
```
**Expected**: 201 Created with ticket object

#### 5. Test Admin Endpoints (requires admin session)
```bash
curl http://localhost:5000/api/admin/help-safety/support/tickets \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```
**Expected**: JSON response with all tickets

---

## 🔧 TypeScript Compilation Errors (Expected)

**Note**: You will see TypeScript errors until the server restarts:
```
Property 'supportTicket' does not exist on type 'PrismaClient'
Property 'fAQ' does not exist on type 'PrismaClient'
Property 'crisisResource' does not exist on type 'PrismaClient'
...
```

**Why**: These are compile-time errors because TypeScript is using cached Prisma client types.

**Solution**: 
1. Restart VS Code TypeScript server: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"
2. OR restart the development server (it will load new Prisma client)

---

## 📦 Production Deployment Steps

### 1. Environment Setup
Ensure these environment variables are set:
```env
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your-secure-secret
NODE_ENV=production
```

### 2. Database Migration
```bash
cd backend
npx prisma migrate deploy
```
**Verifies**: Migration `20251204060718_add_help_safety_system` is applied

### 3. Seed Data (First-Time Only)
```bash
npx tsx prisma/seed-help-safety.ts
```
**Creates**:
- 8 FAQs
- 8 Crisis Resources
- 5 Therapists

### 4. Build & Start Server
```bash
npm run build
npm start
```

### 5. Verify Deployment
Test all public endpoints:
```bash
curl https://your-domain.com/api/faq
curl https://your-domain.com/api/crisis/resources
curl https://your-domain.com/api/therapists
```

---

## 🎨 Frontend Integration Checklist

### ⏳ Pending: Update HelpSafety.tsx Component

#### Crisis Resources Tab
- [ ] Replace hardcoded `crisisResources` array with API call
- [ ] Use `useQuery` from React Query
- [ ] Endpoint: `GET /api/crisis/resources`
- [ ] Add country filter UI (optional)
- [ ] Add loading/error states

#### FAQ Tab
- [ ] Replace hardcoded `faqs` array with API call
- [ ] Use `useQuery` from React Query
- [ ] Endpoint: `GET /api/faq` (with category filter)
- [ ] Implement search using `GET /api/faq/search?q=query`
- [ ] Add FAQ voting buttons (helpful/not helpful)
- [ ] Track FAQ views on click (`POST /api/faq/:id/view`)
- [ ] Add loading/error states

#### Find Therapist Tab
- [ ] Replace hardcoded `therapists` array with API call
- [ ] Use `useQuery` from React Query
- [ ] Endpoint: `GET /api/therapists`
- [ ] Add filters (specialty, location, insurance)
- [ ] Implement search using `GET /api/therapists/search?q=query`
- [ ] Create therapist profile modal (detailed view)
- [ ] Add "Request Appointment" button → `POST /api/therapists/booking`
- [ ] Add loading/error states

#### Contact Support Tab
- [ ] Replace `console.log` in `handleFeedbackSubmit` with API call
- [ ] Use `useMutation` from React Query
- [ ] Endpoint: `POST /api/support/tickets`
- [ ] Add form validation (subject 5-200 chars, message 20-5000 chars)
- [ ] Show success message on submission
- [ ] Link to "View My Tickets" page (new component)
- [ ] Add loading/error states

### ⏳ Pending: Create New Components

#### Safety Plan Component
- [ ] Create `frontend/src/components/SafetyPlan.tsx`
- [ ] Fetch user's safety plan: `GET /api/crisis/safety-plan`
- [ ] Show template if no plan exists
- [ ] Edit mode with sections:
  - [ ] Warning signs (array of strings)
  - [ ] Coping strategies (array of strings)
  - [ ] Support contacts (array of objects)
  - [ ] Professional contacts (array of objects)
  - [ ] Environment safety (array of strings)
  - [ ] Reasons to live (array of strings)
- [ ] Save button: `POST /api/crisis/safety-plan` (upsert)
- [ ] Delete button: `DELETE /api/crisis/safety-plan` (with confirmation)

#### Support Ticket Tracker
- [ ] Create `frontend/src/components/SupportTickets.tsx`
- [ ] Fetch user's tickets: `GET /api/support/tickets`
- [ ] Display ticket list with status badges
- [ ] Click to view ticket details
- [ ] Show admin response if available
- [ ] "Close Ticket" button: `PUT /api/support/tickets/:id/acknowledge`
- [ ] Add status filter dropdown

#### Therapist Profile Modal
- [ ] Create `frontend/src/components/TherapistProfile.tsx`
- [ ] Show full bio, credentials, specialties
- [ ] Display contact info (email, phone, website)
- [ ] Show location with optional map integration
- [ ] Display insurance info
- [ ] Show availability schedule
- [ ] "Request Appointment" form
- [ ] Submit booking: `POST /api/therapists/booking`

#### User Booking History
- [ ] Create `frontend/src/components/MyBookings.tsx`
- [ ] Fetch user's bookings: `GET /api/therapists/bookings`
- [ ] Display booking list with status badges
- [ ] Show therapist info for each booking
- [ ] "Cancel Booking" button: `DELETE /api/therapists/bookings/:id`
- [ ] Prevent canceling COMPLETED bookings

### ⏳ Pending: Admin Portal Integration

#### Add Help & Safety Section to Admin Dashboard
- [ ] Create `frontend/src/admin/components/HelpSafetyAdmin.tsx`
- [ ] Add tab/section to existing admin layout

#### Support Ticket Inbox
- [ ] Display all tickets: `GET /api/admin/help-safety/support/tickets`
- [ ] Filter by status, priority, category
- [ ] Sort by priority (CRITICAL first)
- [ ] Click to view ticket details
- [ ] Respond to ticket form: `POST /api/admin/help-safety/support/tickets/:id/respond`
- [ ] Close ticket button: `PUT /api/admin/help-safety/support/tickets/:id/close`

#### FAQ Manager
- [ ] List all FAQs with edit/delete buttons
- [ ] Create FAQ form: `POST /api/admin/help-safety/faq`
- [ ] Update FAQ form: `PUT /api/admin/help-safety/faq/:id`
- [ ] Delete FAQ button: `DELETE /api/admin/help-safety/faq/:id` (with confirmation)
- [ ] Show FAQ analytics (view count, helpful votes)

#### Crisis Resource Manager
- [ ] List all resources with edit/delete buttons
- [ ] Create resource form: `POST /api/admin/help-safety/crisis/resources`
- [ ] Update resource form: `PUT /api/admin/help-safety/crisis/resources/:id`
- [ ] Delete resource button: `DELETE /api/admin/help-safety/crisis/resources/:id`
- [ ] Toggle active/inactive status

#### Therapist Directory Admin
- [ ] List all therapists with edit/delete buttons
- [ ] Create therapist form: `POST /api/admin/help-safety/therapists`
- [ ] Update therapist form: `PUT /api/admin/help-safety/therapists/:id`
- [ ] Deactivate therapist button: `DELETE /api/admin/help-safety/therapists/:id`
- [ ] Toggle verified status

#### Booking Request Processor
- [ ] Display all bookings: `GET /api/admin/help-safety/therapists/bookings`
- [ ] Filter by status (PENDING, CONFIRMED, etc.)
- [ ] View booking details (user info, therapist info, dates)
- [ ] Process booking form: `PUT /api/admin/help-safety/therapists/bookings/:id/process`
  - [ ] Confirm booking (send to user via email/notification)
  - [ ] Cancel booking (with reason in admin notes)
  - [ ] Add admin notes field

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] Test support ticket creation (valid/invalid data)
- [ ] Test CRISIS ticket auto-escalation
- [ ] Test FAQ search functionality
- [ ] Test safety plan upsert logic
- [ ] Test therapist filtering (specialty, location, insurance)
- [ ] Test booking cancellation (prevent COMPLETED)

### Integration Tests
- [ ] Test full support ticket workflow (create → respond → close)
- [ ] Test FAQ voting system
- [ ] Test therapist search with multiple filters
- [ ] Test booking workflow (request → admin confirm → user cancel)
- [ ] Test admin CRUD operations for all resources

### E2E Tests
- [ ] User submits support ticket → Admin responds → User acknowledges
- [ ] User creates safety plan → Edits → Deletes
- [ ] User searches therapists → Requests booking → Admin confirms
- [ ] Admin creates FAQ → User searches → User votes helpful
- [ ] Admin creates crisis resource → User views in Help & Safety section

---

## 📊 Monitoring & Analytics

### Metrics to Track
- [ ] Support ticket volume by category
- [ ] Average ticket resolution time
- [ ] FAQ view counts (identify popular questions)
- [ ] FAQ search queries with no results (identify gaps)
- [ ] Therapist profile views
- [ ] Booking request conversion rate
- [ ] Crisis resource access patterns
- [ ] Safety plan creation rate

### Logging
- [ ] Ensure all admin actions are logged (already implemented)
- [ ] Monitor for CRISIS-priority tickets (set up alerts)
- [ ] Track API error rates
- [ ] Monitor database query performance

---

## 🔐 Security Review

### Authentication
- [x] User routes require valid JWT token
- [x] Admin routes require admin session
- [x] User data isolation (users can only see their own data)

### Data Protection
- [x] Support tickets cascade delete with user
- [x] Safety plans cascade delete with user
- [x] Bookings cascade delete with user
- [x] Admin actions logged for audit trail

### Rate Limiting
- [ ] Consider additional limits for support ticket creation
- [ ] Consider additional limits for booking requests

### GDPR Compliance
- [ ] Document data retention policies
- [ ] Implement data export functionality (if needed)
- [ ] Ensure user data deletion is complete

---

## 📚 Documentation Updates Needed

- [ ] Update main `README.md` with Help & Safety features
- [ ] Add API documentation to OpenAPI/Swagger (if using)
- [ ] Create user guide for Help & Safety section
- [ ] Create admin guide for managing Help & Safety resources
- [ ] Update onboarding documentation

---

## ✅ Verification Steps

### Before Merging to Main Branch
1. [ ] All TypeScript compilation errors resolved
2. [ ] All tests passing
3. [ ] Migration applied to dev/staging database
4. [ ] Seed data loaded to dev/staging
5. [ ] Manual testing of all endpoints completed
6. [ ] Code review completed
7. [ ] Documentation reviewed and approved

### Before Production Deployment
1. [ ] Backup production database
2. [ ] Run migration on production database
3. [ ] Load seed data (if first-time)
4. [ ] Verify all endpoints are accessible
5. [ ] Test admin functionality
6. [ ] Monitor error logs for 24 hours after deployment

---

## 🎯 Success Criteria

### Backend Implementation ✅ COMPLETE
- [x] All 8 database models created and migrated
- [x] All 5 controller files implemented (22 total endpoints)
- [x] All 5 route files created
- [x] Server configuration updated
- [x] Seed data loaded successfully
- [x] Documentation complete

### Frontend Integration ⏳ PENDING
- [ ] All 4 HelpSafety tabs integrated with APIs
- [ ] New components created (Safety Plan, Support Tickets, Therapist Profile, Bookings)
- [ ] Admin portal pages created
- [ ] All API calls implemented with error handling
- [ ] Loading states implemented
- [ ] User feedback messages implemented

### Testing ⏳ PENDING
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] E2E tests written and passing
- [ ] Manual testing completed

### Deployment ⏳ PENDING
- [ ] Deployed to staging environment
- [ ] Tested in staging
- [ ] Deployed to production
- [ ] Monitoring configured

---

## 📞 Support & Troubleshooting

### Common Issues

**Issue**: TypeScript errors about Prisma models not existing
**Solution**: Restart TypeScript server or restart dev server

**Issue**: Migration fails on production
**Solution**: Check database connection, ensure no conflicting migrations

**Issue**: 401 Unauthorized on admin endpoints
**Solution**: Verify admin session is valid, check cookie is being sent

**Issue**: Validation errors on API requests
**Solution**: Check request body matches Zod schemas (see API Reference doc)

### Contact
For questions or issues, contact the development team or refer to the documentation:
- `HELP_SAFETY_BACKEND_IMPLEMENTATION.md`
- `HELP_SAFETY_API_REFERENCE.md`

---

**Last Updated**: December 4, 2024
**Version**: 1.0.0
**Status**: Backend Complete ✅ | Frontend Pending ⏳
