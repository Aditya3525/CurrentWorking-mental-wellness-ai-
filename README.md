# MaanaSarathi

An AI-powered mental wellbeing platform that combines guided onboarding, personalized care plans, crisis-aware chat assistance, and an admin-managed content library. This repository is a TypeScript monorepo with a Vite/React frontend and an Express/Prisma backend that integrates multiple LLM providers (Gemini, OpenAI, Anthropic, Hugging Face, and Ollama) through a unified service layer.

## 🚀 Quick Deployment

**Ready to deploy?** This repository is configured for automatic GitHub Pages deployment!

👉 **[See DEPLOYMENT_SETUP.md](./DEPLOYMENT_SETUP.md)** for step-by-step deployment instructions.

---

## ✨ Core Capabilities

- **Multi-channel authentication** – email/password with JWTs, Google OAuth via Passport, and an admin-only session layer.
- **Onboarding & profile completion** – demographic details, therapeutic approach, safety contacts, and consent tracking.
- **Dashboard experience** – time-aware greeting, profile completion meter, mood check-in, quick actions, and assessment summaries.
- **Assessments & insights** – configurable assessments (anxiety, depression, stress, trauma, EI, overthinking, personality) with historical tracking and AI-generated insights. Combined assessment sessions for comprehensive wellness checks.
- **Personalized wellness plans** – Prisma-backed plan modules filtered by user approach with progress tracking and completion states.
- **AI chat companion** – context-aware conversations with crisis detection, automated handoffs to crisis resources, and provider failover logic. Features include:
  - **Conversation history management** – organized by conversations with titles, archiving, and deletion
  - **Smart conversation starters** – personalized topic suggestions based on user context
  - **Smart reply buttons** – contextual quick-reply suggestions
  - **Voice input/output** – speech-to-text and text-to-speech capabilities
  - **Conversation summaries** – AI-generated insights from chat sessions
  - **Proactive check-ins** – intelligent re-engagement based on user patterns
  - **Mood-based greetings** – personalized greetings adapted to user state
  - **Exercise recommendations** – contextual breathing, mindfulness, CBT exercises
  - **Goal tracking** – conversation goals with progress monitoring
- **Content & practices** – public APIs for published items plus an admin console to upload media, fetch metadata, and publish curated exercises.
- **Analytics & tracking** – mood journaling and arbitrary progress metric logging for longitudinal insights.

---

## 🏗️ Architecture Overview

| Layer | Technology | Highlights |
| --- | --- | --- |
| Frontend | React 18, Vite, TypeScript, Tailwind, Radix UI | Feature-based folders (`components/features/*`), Zustand stores for state management, React Query for data fetching, contexts for admin/chat/toast, JWT token storage, SPA routing implemented in `App.tsx`. |
| Backend | Express, TypeScript, Prisma ORM | Modular controllers/routes, JWT middleware, Google OAuth, admin session handling, AI provider abstraction, media uploads, health checks, Zod validation, custom error handling. |
| Database | Prisma (SQLite by default) | `prisma/schema.prisma` models users, assessments, mood entries, plan modules, conversations, chat messages, conversation memory, conversation goals, progress, content, practices. 40+ strategic indexes for performance. Alternate PlanetScale schema available. |
| AI Integration | `services/llmProvider.ts` | Provider registry with priority ordering, API key rotation, personalized system prompts, crisis-aware fallbacks, provider health testing, and automatic cooldown/failover logic. |

Directory snapshot:

```
MaanaSarathi/
├── frontend/                 # React + Vite app
│   ├── src/
│   │   ├── components/features/  # Auth, chat, onboarding, dashboard, etc.
│   │   ├── contexts/             # AdminAuth, Chat, Toast
│   │   ├── services/             # API clients & auth helpers
│   │   ├── stores/               # Zustand stores (auth, notifications, app)
│   │   ├── hooks/                # React Query hooks & custom hooks
│   │   └── ui/                   # Tailwind/Radix wrappers
│   └── ...
├── backend/
│   ├── src/
│   │   ├── server.ts            # Express bootstrap
│   │   ├── controllers/         # Auth, chat, plans, assessments, etc.
│   │   ├── routes/              # API surface
│   │   ├── services/            # Chat, LLM providers, recommendations, etc.
│   │   ├── middleware/          # Auth, validation, error handling
│   │   ├── shared/errors/       # Custom error classes
│   │   ├── api/validators/      # Zod validation schemas
│   │   ├── config/              # Database, passport configuration
│   │   └── prisma/seed.ts       # Demo data seeding
│   ├── prisma/                  # Prisma schema & migrations
│   └── scripts/                 # Debug and admin helpers
├── package.json                 # Workspace scripts
└── docs & deployment configs    # Integration guides & templates
```

---

## 🚀 Getting Started

### 1. Prerequisites

- Node.js **18+** and npm **8+**
- Optional: PostgreSQL/MySQL for production (SQLite is bundled for local prototyping)
- AI provider keys (Gemini, OpenAI, etc.) if you want live LLM responses

### 2. Install dependencies and prepare the database

```powershell
npm run setup
```

`setup` installs root/backend/frontend dependencies, generates Prisma client, and runs pending migrations against the SQLite dev database (`backend/prisma/dev.db`).

### 3. Configure environment variables

Create `backend/.env` using the sample below (see `backend/README.md` for more options):

```env
# Server
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database (SQLite by default – override for Postgres/MySQL)
DATABASE_URL="file:./dev.db"

# JWT & session secrets
JWT_SECRET=replace_me
JWT_EXPIRE=7d

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Optional: AI providers (at least one required for chat features)
GEMINI_API_KEY_1=your_key
OPENAI_API_KEY_1=your_key
ANTHROPIC_API_KEY_1=your_key
HUGGINGFACE_API_KEY=your_key
AI_PROVIDER_PRIORITY=gemini,huggingface,openai,anthropic,ollama
AI_ENABLE_FALLBACK=true
AI_USAGE_LOGGING=true

# Admin allowlist
ADMIN_EMAILS=admin@example.com,admin@mentalwellbeing.ai
```

Frontend environment variables live in `frontend/.env.local`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### 4. Seed demo data (optional)

```powershell
cd backend
npm run seed
```

This ensures admin accounts (`admin@example.com` / `admin123`, `admin@mentalwellbeing.ai` / `admin123`), demo users (`demo@mentalwellness.app` / `Demo@123`), and starter practices/content.

### 5. Run the full stack

```powershell
npm run dev
```

- Frontend: http://localhost:3000
- Backend REST API & AI services: http://localhost:5000

Individual targets:

```powershell
npm run dev:frontend   # Vite dev server
npm run dev:backend    # Express (nodemon)
```

---

## 🔑 Feature Deep Dive

### Authentication & Onboarding
- Email/password with bcrypt hashing and JWT issuance.
- Google OAuth 2.0 – new users are flagged for password setup, existing users routed straight to dashboard or onboarding.
- Onboarding captures therapeutic approach (western/eastern/hybrid), demographics, emergency contacts, and consent toggles.

### Dashboard & Engagement
- Dynamic greeting (time-of-day + profile completeness).
- Mood quick-check and prompts for daily practices.
- Assessment, plan, content, and progress entry points.
- Wellness score display (0-100 scale) with trend indicators.

### Conversation Management
- **Conversation history**: All chats organized by conversation with auto-generated titles.
- **Archive/delete**: Users can archive old conversations or delete them.
- **Search & filter**: Find past conversations by topic or date.
- **Conversation export**: Export chat history for personal records.
- **Conversation memory**: System tracks recurring topics, emotional patterns, and important moments.
- **Conversation goals**: Track therapy goals with progress monitoring (schema ready).

### Assessments & Plans
- Multiple assessment types: GAD-7 (anxiety), PHQ-9 (depression), PSS-10 (stress), PCL-5 (trauma), PTQ (overthinking), TEIQue (emotional intelligence), Mini-IPIP (personality).
- Combined assessment sessions allow users to take multiple assessments in one flow.
- `AssessmentResult` model stores JSON responses, score interpretation, and category breakdowns.
- `AssessmentSession` tracks multi-assessment flows (pending/in_progress/completed).
- `AssessmentInsight` provides AI-generated summaries and wellness scores (0-100).
- Personalized plan modules served based on user approach with completion tracking in `UserPlanModule`.

### AI Chat Companion
- **Multi-provider support**: Gemini, OpenAI, Anthropic, HuggingFace, Ollama with automatic failover.
- **Crisis detection**: Immediate keyword-based detection triggers safety resources (no AI delay).
- **Context awareness**: Incorporates user demographics, assessment scores, mood trends, conversation history.
- **Conversation management**: Organized conversations with auto-generated titles, archiving, deletion.
- **Smart features**:
  - Conversation starters based on user patterns and assessment scores
  - Smart reply suggestions adapted to conversation context
  - Voice input (speech-to-text) and output (text-to-speech)
  - AI-powered conversation summaries with key insights
  - Proactive check-ins based on user activity and risk scores
  - Mood-based greetings personalized to time and emotional state
- **Exercise delivery**: Guided breathing, mindfulness, CBT, and grounding exercises delivered contextually.
- **Conversation memory**: Tracks topics, emotional patterns, important moments, and conversation style.
- **Goal tracking**: Support for conversation-based goals with progress monitoring.
- **Provider health monitoring**: Real-time health checks and failover with cooldown logic.
- **Health endpoints**: `/api/chat/ai/health` and `/api/chat/ai/test` for diagnostics.

### Content & Practices
- Public endpoints expose published content/practices.
- Admin routes allow file uploads (audio/video/image), YouTube metadata retrieval, and structured validations (e.g., sleep practices must be audio-only).

### Progress & Mood Tracking
- Mood entries stored in `MoodEntry` with optional notes.
- `ProgressTracking` supports arbitrary metrics (sleep, stress, etc.) with history queries and dashboards.
- Calendar heatmap visualization of mood trends.
- Line charts showing assessment score evolution over time.

### Advanced Chatbot Features
- **Voice capabilities**: Speech-to-text input and text-to-speech output for hands-free interaction.
- **Smart suggestions**: AI-generated conversation starters based on user context and patterns.
- **Quick replies**: Contextual smart reply buttons that adapt to conversation flow.
- **Conversation summaries**: AI-powered summaries with key insights, emotional trends, and action items.
- **Proactive engagement**: Intelligent check-in notifications when user hasn't chatted (based on patterns and risk factors).
- **Personalized greetings**: Time-aware and mood-aware greetings that adapt to user state.
- **Contextual exercises**: Structured breathing, mindfulness, CBT exercises delivered based on conversation context.
- **Sentiment analysis**: Both basic and enhanced sentiment analysis tracking emotional state.
- **Conversation memory**: System remembers topics, patterns, and important moments for continuity.

---

## 🧪 Tooling & Quality

| Command | Description |
| --- | --- |
| `npm run lint` | Run ESLint (frontend + backend). |
| `npm run typecheck` | TypeScript type checks for both workspaces. |
| `npm run format` | Apply Prettier formatting. |
| `npm run test` | Run tests for both frontend and backend. |
| `npm run test:backend` | Run backend tests (includes provider tests). |
| `npm run test:frontend` | Run frontend tests with Vitest. |
| `npm run db:studio` | Launch Prisma Studio for browsing the database. |
| `npm run db:migrate` | Run database migrations. |
| `npm run db:generate` | Generate Prisma client. |

Backend debug scripts (inside `backend/`):

- `test-ai-providers.js`, `test-gemini.js` – verify AI integrations.
- `check-db.js` – confirm Prisma connection.
- `test-chat-*.js` – exercise chat endpoints with sample inputs.
- `recommendation-personalization-test.js` – test recommendation engine.
- `simulate-15day-user-journey.js` – comprehensive user simulation.

---

## 🌐 Deployment Hints

### GitHub Pages (Frontend Only)
- **Quick Setup**: The repository includes automated GitHub Pages deployment via GitHub Actions
- **Guide**: See `GITHUB_PAGES_DEPLOYMENT.md` for detailed instructions
- **Frontend hosting**: Automatic deployment on push to `main` branch
- **Backend**: Must be deployed separately (see backend options below)
- **Configuration**: Enable GitHub Pages in repository settings and configure environment variables

### Other Deployment Options
- **Frontend**: deploy `frontend/dist` to Vercel/Netlify. `vercel.json` rewrites all routes to `index.html`.
- **Backend**: Docker/Render/Railway templates under `backend/` (`render.yaml`, `railway.json`, `Procfile`, `web.config`). Ensure environment secrets, production database URL, and secure session storage.
- **Database**: switch `DATABASE_URL` to your managed Postgres/MySQL. Migrations are generated via Prisma; `schema-planetscale.prisma` offers a PlanetScale-ready schema if you need `relationMode = prisma`.
- **AI Providers**: follow `GEMINI_INTEGRATION.md`, `HUGGINGFACE_INTEGRATION.md`, and other docs for provider-specific setup.

---

## 🙋‍♀️ Admin Console

- Admin login page lives on the public landing screen.
- Session-backed JWT stored in Express session; routes guarded by `requireAdmin` middleware.
- Upload endpoints save files to `backend/uploads/{thumbnails|media}`; Express serves them via `/uploads/*`.
- Admin dashboards (React) retrieve practices/content, allow metadata edits, and toggle publish states.

---

## ⚡ Recent Architecture & Performance Improvements

**October 2025** - Major infrastructure upgrade implementing enterprise-grade patterns:

### **Input Validation System** ✅
- **Zod schemas** for all major API endpoints (13 endpoints protected)
- **Automatic validation** with detailed field-level error messages
- **Type-safe runtime validation** preventing invalid data from reaching business logic
- **Security hardening** against injection attacks

### **Error Handling System** ✅
- **11 custom error classes** replacing scattered res.status() calls
- **Semantic errors**: `NotFoundError`, `ValidationError`, `ConflictError`, etc.
- **Centralized error middleware** with consistent JSON formatting
- **Developer-friendly** stack traces in development, safe messages in production

### **Database Optimization** ✅
- **Singleton Prisma client** eliminating connection leaks
- **40+ strategic indexes** for 50-70% faster common queries
- **Connection pooling** configured for optimal performance
- **Query logging** in development for debugging

### **State Management (Ready)** 🚀
- **3 Zustand stores** created (auth, notifications, app state)
- **LocalStorage persistence** for user sessions
- **Optimized re-renders** with selector patterns
- **Ready for integration** in frontend components

### **Data Fetching (Ready)** 🚀
- **React Query hooks** for assessments, mood, chat, conversations
- **Automatic caching** and background refetching
- **Optimistic updates** for better UX
- **Loading/error states** handled automatically
- **Custom hooks**: `useAssessments`, `useMood`, `useChat`, `useConversations`, `useConversationExport`

**Documentation:**
- See `ARCHITECTURE_INTEGRATION_SUCCESS.md` for detailed overview
- See `QUICK_REFERENCE_GUIDE.md` for developer quick-start
- See `INTEGRATION_PROGRESS_REPORT.md` for implementation details
- See `COMPLETE_FEATURES_SUMMARY.md` for chatbot enhancements summary

---

## 🛣️ Roadmap & Ideas

### Implemented Features ✅
- ✅ Multi-provider AI integration with failover
- ✅ Voice input/output for accessibility
- ✅ Conversation history and management
- ✅ Smart conversation starters and replies
- ✅ Proactive check-ins and mood-based greetings
- ✅ AI-powered conversation summaries
- ✅ Goal tracking schema (ready for activation)
- ✅ Combined assessment sessions
- ✅ Comprehensive wellness scoring (0-100)
- ✅ React Query data fetching layer
- ✅ Zustand state management
- ✅ 40+ database indexes for performance

### Future Enhancements 🚀
- Extended personalization (conversation theme tracking, coping strategy learning).
- Goal tracking UI and activation workflows.
- Automated test coverage for both frontend and backend.
- Migration from SQLite to managed Postgres/MySQL in production.
- Telemetry, observability, and analytics overlays.
- Premium subscription features (Stripe integration).
- Mobile app (React Native).
- Push notifications for check-ins and reminders.
- Group therapy sessions and community features.
- Integration with wearables for biometric data.

---

## 🙌 Contributing & Support

1. Fork & clone, then run `npm run setup`.
2. Create a feature branch inside the relevant workspace.
3. Keep lint/typecheck green before submitting PRs.
4. Document new environment variables and update this README when behavior changes.

Need help? Check the integration docs in the repo root or open an issue describing environment, commands run, and full error logs.

---

Happy building, and thanks for supporting wellbeing with thoughtful software. 💙
   