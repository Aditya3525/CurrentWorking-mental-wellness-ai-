# Admin Panel Setup (Extended Practices & Content Library)

## Overview
The Admin Panel enables creation and management of Practices and Content items for the Mental Wellbeing AI application. Each Practice is classified by approach:
- Western (therapy / evidence-based)
- Eastern (yoga / mindfulness / contemplative)
- Hybrid (combined methodologies)

Current feature set provides:
- Practice CRUD (`/api/admin/practices`) with rich fields + filtering (approach, level/difficulty, type, tag, duration range, search)
- Content CRUD (`/api/admin/content`) with fields (category, duration, difficulty, approach, media/embed support, tags) + filtering (approach, type, category, search)
- React admin UI (login, dashboard with tabs for Practices & Content, list + forms)
- Approach classification persisted for both Practice + Content (`approach` = western | eastern | hybrid | all [content only])

## Backend Additions
### Practice Model (Extended)
`backend/prisma/schema.prisma` now includes an extended `Practice` model with:
- `types` (CSV multi-select) + derived legacy `type` (first entry) for analytics compatibility
- `level` + legacy alias `difficulty`
- Media: `audioUrl`, `videoUrl`, `youtubeUrl`, `thumbnailUrl`
- `tags` (CSV)
- Core: `title`, `duration` (minutes), `approach`, `description`, `isPublished`, `viewCount`

Controller: `backend/src/controllers/adminSimplePracticeController.ts`
Capabilities:
- Validation & normalization (CSV splitting/joining)
- Filters: `approach`, `level`, `type` (matches within `types`), `tag`, `minDuration`, `maxDuration`, `search`
- Derived fields persisted: `type` (first of `types`), `difficulty` (mirror of `level`)

### Content Model Support (Simplified CRUD Layer)
Controller: `backend/src/controllers/adminSimpleContentController.ts`
Fields handled:
- Required: `title`, `contentType` (maps to `Content.type`), `approach`, `category` (defaults to `General`)
- Optional: `description`, `body` (mapped to `content`), `duration`, `difficulty`, media URLs (`audioUrl`, `videoUrl`, `youtubeUrl`), `thumbnailUrl`, `tags`, `isPublished`
- Storage mapping priority for `content`: `body || audioUrl || videoUrl || youtubeUrl || ''`
- `fileUrl` used when audio/video supplied; `externalUrl` for YouTube.
Filters: `approach`, `contentType`, `category`, `search` (title, description, content, tags)

Routes:
- Practices: `backend/src/routes/adminPractices.ts` → `/api/admin/practices`
- Content: `backend/src/routes/adminContent.ts` → `/api/admin/content`

Registered in `backend/src/server.ts` alongside existing admin auth & analytics routes.

### Practice API (Extended)
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/admin/practices` | Query: `approach`, `level`, `type`, `tag`, `minDuration`, `maxDuration`, `search` |
| GET | `/api/admin/practices/:id` | Retrieve one |
| POST | `/api/admin/practices` | Body: `title`, `types[]` or CSV, `duration`, `level`, `approach`, optional media, `description`, `tags`, `isPublished` |
| PUT | `/api/admin/practices/:id` | Partial update; transforms arrays to CSV |
| DELETE | `/api/admin/practices/:id` | Delete |

Validation summary:
- `level`: Beginner | Intermediate | Advanced
- `approach`: western | eastern | hybrid
- `duration`: integer minutes 1–600
- `types`: at least one string

### Content API (Simplified Layer)
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/admin/content` | Query: `approach`, `contentType`, `category`, `search` |
| GET | `/api/admin/content/:id` | Retrieve one |
| POST | `/api/admin/content` | Body: `title`, `contentType` (article|story|audio|video), `approach` (western|eastern|hybrid|all), optional `category`, `body`, media URLs, `duration`, `difficulty`, `tags`, `isPublished` |
| PUT | `/api/admin/content/:id` | Partial update |
| DELETE | `/api/admin/content/:id` | Remove |

Validation summary:
- `contentType`: audio | video | story | article
- `approach`: western | eastern | hybrid | all
- `difficulty`: Beginner | Intermediate | Advanced (optional)
- `tags`: CSV or array accepted (normalized to CSV)

## Frontend Additions
Directory: `frontend/src/admin/`
- `AdminLogin.tsx` – simple login form hitting `/api/admin/auth/login`.
- `AdminDashboard.tsx` – tabbed dashboard (Practices | Content)
- `PracticesList.tsx` – now supports filtering by approach, type, tag, search (duration filter optional)
- `PracticeForm.tsx` – multi-select types, level, media URLs, tags, published toggle
- `ContentList.tsx` – filtering by approach, type, category, search
- `ContentForm.tsx` – category, duration, difficulty, media URLs, tags, published toggle

Landing page already includes a discrete “Admin Access” trigger via existing modal; these new pages can be wired into a router if desired (e.g. using React Router) by mapping `/admin/login` and `/admin/dashboard` to the components above.

## Setup / Migration Steps (PowerShell)
Run from repository root (Windows PowerShell):
```powershell
# 1. Install dependencies (root + backend workspace via workspaces if configured)
npm install

# 2. Regenerate Prisma client (pick up Practice + any schema adjustments)
cd backend
npm run db:generate

# 3. Create / apply migration (names are suggestions; if already applied skip new name)
npm run migrate -- --name extend_practice_and_content_simple_layer

# 4. (Optional) Open Prisma Studio
npm run db:studio

# 5. Start backend dev server (in one terminal)
npm run dev

# 6. Start frontend (from repo root or frontend dir if separate script)
cd ..
npm run dev:frontend  # if defined; otherwise cd frontend && npm run dev
```

If migration fails due to drift (e.g., existing tables with conflicting shape):
```powershell
# WARNING: Destroys data – only for local dev
npm run db:reset
```

Create an admin user if none exists (SQLite quick insert example):
```powershell
cd backend
sqlite3 ./prisma/dev.db "INSERT INTO admin_users (id,email,name,password,role,isActive,createdAt,updatedAt) VALUES (lower(hex(randomblob(16))),'admin@example.com','Admin','<bcrypt-hash>','admin',1,datetime('now'),datetime('now'));"
```
Generate a bcrypt hash (Node REPL):
```powershell
node -e "console.log(require('bcryptjs').hashSync('AdminPass123!',10))"
```

## Future Enhancements
- Merge with advanced (richer) practice schema present in `schema-enhanced.prisma`.
- Role-based segmentation (content_manager vs admin vs super_admin).
- Surface admin activity logs from `admin_activities` table.
- Add analytics dashboard view pulling from existing analytics endpoints.
- Convert `approach` to Prisma enum (include `all` variant for Content) with migration.
- Optional file upload endpoint (multer) to replace raw media URLs.
- Tag normalization & join table for better querying.
- Admin activity logging integration surfacing CRUD history for practices/content.
- Role-based permissions gating Content vs Practice management.

## Troubleshooting
- If `Property 'practice' does not exist on type 'PrismaClient'` run `cd backend; npm run db:generate` (ensures new model types are generated).
- Missing fields in API responses? Confirm migration applied (`npm run migrate`).
- Tag filtering not working? Ensure CSV contains exact tag without spaces; improvement: store normalized lowercase tags.
- Ensure `adminToken` cookie present after login; otherwise verify `/api/admin/auth/login` route and JWT secret alignment.

---
This document reflects the extended scaffold; further hardening (rate limits, CSRF, granular RBAC, audit surfacing) recommended before production.
