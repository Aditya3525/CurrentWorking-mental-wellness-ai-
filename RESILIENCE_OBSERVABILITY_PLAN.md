# Resilience & Observability Plan

This document summarizes the current reliability posture of the Mental Wellbeing AI service and outlines targeted improvements to harden production readiness. Use it to stage the next tasks after environment configuration and data seeding.

## 1. Snapshot of Existing Safety Nets
- **Health probe**: `GET /health` reports status, timestamp, and environment for liveness checks.
- **Rate limiting**: `express-rate-limit` uses `RATE_LIMIT_*` env vars to protect the API from abusive bursts.
- **Security middleware**: Helmet, compression, CORS, session hardening already integrated.
- **LLM fallback orchestration** (`LLMService`):
  - Loads providers dynamically from sanitized API keys.
  - Prioritizes providers via `AI_PROVIDER_PRIORITY` and remembers the last successful backend.
  - Supports multi-key rotation, timeout overrides, and authentication/rate-limit detection.
  - Optional request usage logging (`AI_USAGE_LOGGING`) prints structured metrics.
  - Diagnostic helpers (`debugConfig`, `debugProvidersToTry`, `testAllProviders`) and a dedicated test `src/tests/llmFallback.test.ts` cover provider ordering.
- **Admin-level tooling**: `src/scripts` and Prisma seeds let us quickly restore state.

## 2. Completed Enhancements (Oct 2025)
- Adopted structured logging with `pino`/`pino-http`, request IDs, and refreshable `LOG_LEVEL` configuration.
- Added `/health/ready` readiness probe that checks Prisma connectivity and active AI providers, returning 503 when dependencies fail.
- Introduced provider failure tracking with cooldowns/backoff plus unit coverage for fallback ordering; degraded providers now skip until their cooldown elapses.
- Hardened the global error handler to emit normalized JSON payloads containing error codes and request IDs.
- Chat and content endpoints now surface user-facing fallback messaging (chat returns empathetic prompts and metadata, content endpoints share quick practice suggestions) whenever personalised data is unavailable.

## 3. Remaining Gaps / Risks
1. **LLM circuit breaking**
   - No exponential backoff or cool-down tracking: transient provider failures can trigger tight retry loops across users.
   - No graceful degradation path for zero providers (e.g., canned response or queueing).

2. **Observation & Alerting**
   - Logging relies on console output; no centralized sink, structured JSON log policy, or log level controls beyond `LOG_LEVEL` placeholder.
   - Health endpoint lacks dependency diagnostics (database, AI provider reachability) which slows incident triage.
   - No runtime metrics (Prometheus/OpenTelemetry) or error budget targets.

3. **Background Jobs & External Integrations**
   - Download/transcoding helpers (ffmpeg/ytdl) do not expose retry strategies or timeouts; failures could hang the request thread.
   - No dead-letter or retry queue for async work such as media fetches or AI generation.

4. **Testing Coverage**
   - Fallback logic has a unit test, but integration/e2e scenarios (e.g., real provider outage simulation, rate limit behavior) are missing.
   - Error handler tests do not assert HTTP status codes and payload uniformity for upstream failures.

5. **Configuration Drift**
   - `AI_USAGE_LOGGING` is Boolean-only; cannot route logs to different sinks or mask sensitive payloads.
   - `JWT_SECRET` fallback value still used in dev if unset, risking accidental weak secrets.

## 4. Recommended Improvements
### Near-Term (Sprint-Friendly)
1. **Centralized Log Shipping**
   - Forward structured logs to a managed sink (e.g., Datadog, ELK, Azure Monitor) and define retention/PII policies.
   - Add request/user context enrichers where safe to boost traceability.

2. **Readiness Drill Coverage**
   - Automate smoke tests hitting `/health/ready` during deploy pipelines; alert when the endpoint reports `degraded` for more than a threshold window.

3. **LLM Degradation UX**
   - When all providers are exhausted, return a graceful fallback payload to clients and enqueue prompts for manual follow-up instead of surfacing raw errors.

4. **Error Budget Telemetry**
   - Track provider cooldown activations and error handler events via metrics counters to anticipate quota or outage trends.

### Mid-Term (Release Hardening)
1. **Telemetry Integration**
   - Capture metrics via OpenTelemetry/Prometheus: request latency, error rate, AI provider success ratio, queue depth.
   - Hook dashboards/alerts (Grafana, Datadog, New Relic) to notify on outage thresholds.

2. **Async Job Queue**
   - Offload long-running tasks (media processing, heavy AI flows) to BullMQ or Cloud-native queues; include retry/backoff policies.

3. **Chaos Testing Playbooks**
   - Scripted failure drills: disable individual AI providers, simulate DB outage, drop network responses. Validate fallback and alerting.

4. **Secret Hygiene Automation**
   - Enforce non-empty values for critical secrets at startup and fail fast with descriptive logs. Tie into secret manager rotation.

## 5. Implementation Order of Operations
1. **Ship logs externally** using the structured output now available; confirm redaction policies and alerting hooks.
2. **Automate readiness verification** in CI/CD and platform monitors, failing fast when `/health/ready` degrades.
3. **Design graceful AI fallbacks** (cached responses, queued retries) for full-provider outages.
4. **Instrument metrics** around cooldown activations, response latency, and error handler invocations to track error budgets.
5. **Plan async processing upgrades** (queues/background workers) once telemetry confirms bottlenecks.

## 6. Validation Checklist
- [ ] Logs persist to centralized storage with searchable context.
- [ ] `/health` and `/health/ready` reflect actual dependency health and integrate with uptime monitors.
- [ ] AI requests degrade gracefully when providers fail; alert triggered when fallback exhaustion occurs.
- [ ] Integration test suite covers rate limit behavior, provider failure scenarios, and error handler shape.
- [ ] Secrets validated at boot; missing/placeholder values abort startup with actionable errors.

Adopting these steps will elevate resilience, reduce outage MTTR, and give the team actionable observability before finals deployment. Use this plan as the foundation for the next engineering tasks.
