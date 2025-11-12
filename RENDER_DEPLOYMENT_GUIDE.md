## Render Deployment Guide

The repository ships with a turnkey `render.yaml` blueprint that provisions the API (Node service), the React static site, and a managed PostgreSQL instance on Render. Follow the steps below to deploy in minutes.

### 1. Prerequisites
- Render account with GitHub integration enabled.
- PostgreSQL-compatible plan (the included blueprint uses the Free tier).
- Production-ready secrets: JWT, AI provider keys, Google OAuth credentials, etc.

### 2. One-Click Blueprint Deployment
1. Push this repository to GitHub (Render only deploys from remote sources).
2. In Render, click **New ➜ Blueprint** and select the repo.
3. Confirm the detected `render.yaml`; Render will create:
	- `mental-wellbeing-api` (Node web service under `backend/`).
	- `mental-wellbeing-frontend` (static site under `frontend/`).
	- `mental-wellbeing-db` (PostgreSQL database).
4. Review the generated resources, then click **Apply**.

Render automatically runs the `buildCommand` for each service:
- API: installs dependencies (including dev deps), generates the Prisma client, compiles TypeScript, and applies migrations.
- Frontend: installs dependencies and builds the Vite bundle.

### 3. Configure Environment Variables
After the blueprint is applied, open each service and set required secrets:

**API (`mental-wellbeing-api`)**

| Key | Required | Notes |
| --- | --- | --- |
| `FRONTEND_URL` | ✅ | Set to the static site URL once it is known (e.g., `https://mental-wellbeing-frontend.onrender.com`). |
| `JWT_SECRET` | ✅ | Long random string. |
| `DATABASE_URL` | ✅ | Auto-linked to the managed DB when using the blueprint. |
| `ADMIN_EMAILS` | ⚙️ | Comma-separated list of admin accounts. Defaults to seeded emails. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | ⚙️ | Needed for Google OAuth. |
| `YOUTUBE_API_KEY` | ⚙️ | Required for YouTube metadata fetches (admin console). |
| `GEMINI_API_KEY_1`, `OPENAI_API_KEY_1`, `ANTHROPIC_API_KEY_1`, `HUGGINGFACE_API_KEY` | ⚙️ | Provide at least one AI provider key for live chat. |

Other AI tuning knobs (`AI_PROVIDER_PRIORITY`, `AI_ENABLE_FALLBACK`, etc.) all have safe defaults. Keep `NODE_ENV=production`.

**Frontend (`mental-wellbeing-frontend`)**

| Key | Required | Notes |
| --- | --- | --- |
| `VITE_API_URL` | ✅ | Already configured to hit the API via Render subdomain; update if you use a custom domain. |
| `VITE_GOOGLE_CLIENT_ID` | ⚙️ | Matches the backend OAuth client. |

### 4. Data Seeding (Optional)
The API ships without users. To seed demo accounts and content:

```bash
# Render shell ➜ mental-wellbeing-api service
npm run seed
```

Seeds include admin accounts `admin@example.com` / `admin123` and `admin@mentalwellbeing.ai` / `admin123`.

### 5. Validate the Deployment
1. Visit the static site URL; ensure it loads the SPA.
2. Hit the API health endpoints:
	- `https://<api-host>/health`
	- `https://<api-host>/health/ready`
3. Sign in with a seeded admin account, confirm the dashboard works, and test AI chat (if providers are configured).
4. Review Render logs for database or provider errors.

### 6. Post-Launch Checklist
- Update `FRONTEND_URL` / `VITE_API_URL` if you attach custom domains.
- Add persistent object storage for media uploads (Render’s ephemeral filesystem resets on deploy). Consider AWS S3 or a Render persistent disk.
- Enable cron jobs or background workers if you need scheduled tasks (e.g., reminders, analytics crunching).
- Configure alerts/monitoring (Render Metrics, external tools, or `/health/ready` probes).

The combination of the blueprint, environment-driven admin allowlist, and Prisma migration automation makes the project ready for Render production. Adjust plan tiers as your usage grows.
