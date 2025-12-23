# Environment Configuration Guide

This document consolidates every environment variable referenced by the MaanaSarathi application and explains how to provision it for development, testing, and production deployments. The project uses separate `.env` files for the backend (`backend/.env`) and frontend (`frontend/.env.*`). Copy the example files added in this repo and populate them with your own secure values.

## Quick Start Checklist
- Duplicate `backend/.env.example` to `backend/.env` and `backend/.env.production`.
- Duplicate `frontend/.env.example` to `frontend/.env.development` and `frontend/.env.production` as needed.
- Provide strong secrets for JWT/session handling before deploying.
- Record every API key in your secret manager (Azure Key Vault, AWS Secrets Manager, Vercel/Render secrets UI, etc.).
- Never commit real secrets to version control.

## Backend Variables (`backend/.env`)

| Variable | Required | Purpose / When to Change | Notes & Source |
| --- | --- | --- | --- |
| `NODE_ENV` | yes | Controls Express/Prisma behavior (`development`, `production`, `test`). | Use `production` in deployed environments. |
| `PORT` | yes | HTTP port the API listens on. | Match platform requirements (Render/Vercel typically injects `PORT`). |
| `FRONTEND_URL` | yes | CORS allowlist and OAuth redirect target. | Use the deployed frontend origin (e.g., `https://app.example.com`). |
| `DATABASE_URL` | yes | Prisma connection string. | Obtain from PlanetScale/Railway/Postgres provider. |
| `JWT_SECRET` | yes | Signs access tokens. MUST be long and random. | Rotate and store in secret manager. |
| `JWT_EXPIRE` | yes | Token lifetime (`7d`, `12h`, etc.). | Keep short for production security. |
| `RATE_LIMIT_WINDOW_MS` | yes | Express rate limiter window in ms. | Increase if you expect larger request bursts. |
| `RATE_LIMIT_MAX_REQUESTS` | yes | Requests allowed per window. | Tune per environment. |
| `LOG_LEVEL` | yes | Controls structured logging verbosity (`fatal` → `trace`). | Use `info` or `warn` in production to suppress noisy debug entries. |
| `GOOGLE_CLIENT_ID` | optional* | Enables Google OAuth login. | Create OAuth credentials in Google Cloud > OAuth consent screen. Required if Google login is exposed. |
| `GOOGLE_CLIENT_SECRET` | optional* | Google OAuth client secret. | Store securely; required with `GOOGLE_CLIENT_ID`. |
| `YOUTUBE_API_KEY` | optional | Used when fetching wellbeing videos. | Obtain from Google Cloud Console (YouTube Data API v3). |
| `AI_PROVIDER_PRIORITY` | yes | Ordered list of providers the service will try. | Comma separated (e.g., `huggingface,gemini,openai`). |
| `AI_ENABLE_FALLBACK` | yes | Toggles automatic failover to the next provider. | Set `true` to keep resilience. |
| `AI_USAGE_LOGGING` | yes | Enables provider usage telemetry (internal logging only). | Prefer `false` in prod if logs might capture sensitive content. |
| `AI_VERBOSE_LOGGING` | yes | Dumps provider request/response metadata to logs. | Leave `false` in production. |
| `AI_PROVIDER_MAX_FAILURES_BEFORE_COOLDOWN` | yes | Consecutive failures before a provider enters cooldown. | Defaults to `3`; lower for sensitive quota management. |
| `AI_PROVIDER_COOLDOWN_MS` | yes | Duration (ms) to pause a failing provider. | Defaults to 5 minutes (300000ms). |
| `AI_MAX_TOKENS` | yes | Default token budget for generated responses. | Override per provider when needed. |
| `AI_TEMPERATURE` | yes | Creativity vs determinism for responses. | Lower values are more deterministic. |
| `AI_TIMEOUT` | yes | Default timeout (ms) for provider requests. | Align with provider SLAs. |
| `AI_MAX_DETAIL_ASSESSMENTS` | yes | Caps detail level for assessment explanations. | Helps prevent overly verbose output. |
| `AI_MAX_DETAIL_RESPONSES` | yes | Caps detail level for chat replies. | |
| `AI_MAX_DETAIL_LENGTH` | yes | Character limit safeguard for responses. | |
| `OPENAI_API_KEY_1..3` | optional | Rotating pool of OpenAI keys. | Create in OpenAI dashboard; add more for higher throughput. |
| `OPENAI_MODEL` | optional | Default OpenAI model id. | Example: `gpt-4o-mini`. |
| `OPENAI_MAX_TOKENS`, `OPENAI_TEMPERATURE`, `OPENAI_TIMEOUT` | optional | Provider overrides. | Fallback to global defaults if unset. |
| `ANTHROPIC_API_KEY_1..2` | optional | Keys for Anthropic Claude. | Provision at console.anthropic.com. |
| `ANTHROPIC_MODEL`, `ANTHROPIC_MAX_TOKENS`, `ANTHROPIC_TEMPERATURE`, `ANTHROPIC_TIMEOUT` | optional | Provider overrides. | |
| `GEMINI_API_KEY_1..3` | optional | Keys for Google Gemini. | From Google AI Studio. |
| `GEMINI_MODEL`, `GEMINI_MAX_TOKENS`, `GEMINI_TEMPERATURE`, `GEMINI_TIMEOUT` | optional | Provider overrides. | |
| `HUGGINGFACE_API_KEY`, `HUGGINGFACE_API_KEY_1..2` | optional | Hugging Face Inference tokens. | Generate at huggingface.co/settings/tokens. |
| `HUGGINGFACE_MODEL`, `HUGGINGFACE_MAX_TOKENS`, `HUGGINGFACE_TEMPERATURE`, `HUGGINGFACE_TIMEOUT` | optional | Provider overrides. | |
| `OLLAMA_BASE_URL` | optional | Local Ollama endpoint for air-gapped fallback. | Default `http://localhost:11434`. |
| `OLLAMA_MODEL`, `OLLAMA_MAX_TOKENS`, `OLLAMA_TEMPERATURE`, `OLLAMA_TIMEOUT` | optional | Provider overrides. | Only needed if Ollama is enabled. |

\*Mark `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` as required if you intend to offer Google sign-in in production.

### Managing Multiple API Keys
Some providers allow multiple API keys (e.g., `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, ...). Populate only the slots you need. The backend cycles through them to spread traffic. Leave unused slots blank.

### Local Development Pattern
- Use lightweight providers (Hugging Face or Ollama) to avoid burning expensive credits.
- Keep rate limits low in `.env.development` to surface throttle handling early.
- Configure logging verbosity to `true` only when debugging specific issues.

## Frontend Variables (`frontend/.env.*`)

| Variable | Required | Purpose / When to Change | Notes |
| --- | --- | --- | --- |
| `VITE_API_URL` | yes | Base URL for API requests from the SPA. | Include `/api` prefix when the backend mounts routes under `/api`. |
| `VITE_GOOGLE_CLIENT_ID` | optional | Exposes Google OAuth client id to the browser. | Must match `GOOGLE_CLIENT_ID`; required if Google login is rendered. |

### Vite Usage Notes
- Vite only exposes variables prefixed with `VITE_`. Anything else is ignored at build time.
- Add new declarations to `frontend/src/vite-env.d.ts` to preserve TypeScript safety.
- Regenerate production builds after changing `.env.production` to bake the new values into the bundle.

## Secret Management Recommendations
- **Centralized storage:** use your hosting provider’s managed secret service; avoid `.env` files in production.
- **Rotation:** rotate JWT, OAuth, and AI keys regularly; schedule reviews for leaked or expired credentials.
- **Deployment automation:** ensure CI/CD pipelines inject secrets at runtime (for example via Render environment groups, Railway variables, or Vercel project secrets).
- **Monitoring:** when `AI_USAGE_LOGGING` is enabled, confirm log sinks are secured and respect privacy policies.

## Next Steps
1. Populate local `.env` files using the guidance above and verify the backend boots without `undefined` environment references.
2. Document where each secret is stored (password manager, secret manager, etc.) so the team can access updates.
3. Proceed to the next roadmap task (data seeding & fixture generation) once configuration is stable.
