## LearnGuardAI — Project Status (local verification)

Date: 2026-06-01

This repo already contains a working MVP codebase (Next.js App Router + Prisma/Postgres) for classroom AI governance with Canvas LTI 1.3 launch context, a governed student assistant, teacher/admin dashboards, and audit logging.

### What works

- **Repo structure and core app surfaces**
  - Next.js 15 App Router layout/pages exist under `app/`
  - Student/teacher/admin launch surfaces exist:
    - `app/lti/student/page.tsx`
    - `app/lti/teacher/page.tsx`
    - `app/dashboard/teacher/page.tsx`
    - `app/dashboard/admin/page.tsx`

- **Governed assistant pipeline**
  - `/api/assistant` is implemented (`app/api/assistant/route.ts`) with:
    - request validation (Zod), prompt sanitization
    - same-origin CSRF guard for first-party routes
    - in-memory rate limiting
    - rule-based classification (`lib/ruleClassifier.ts`)
    - GPT classification (`lib/gptClassifier.ts`) with deterministic local fallback when `OPENAI_API_KEY` is absent
    - assignment policy enforcement (teacher controls)
    - response generation (`lib/aiResponse.ts`) with OpenAI + fallback
    - persistence of prompt logs, classification, audit logs, insights, sustainability estimates (Prisma)

- **Teacher policy editing**
  - Assignment policy API exists: `app/api/assignment-policies/[assignmentId]/route.ts`
  - Teacher scope checks are enforced server-side (teacher ownership / admin)
  - Policy changes are audit-logged

- **Dashboards**
  - Teacher dashboard data builder exists: `lib/dashboardData.ts`
  - Admin dashboard data builder exists: `lib/dashboardData.ts`
  - UI components exist under `components/` (charts, policy editor, risk badges)

- **Auth + security baseline**
  - Clerk is optional for local dev; when not configured, the app uses “demo” viewer creation in `lib/auth.ts`
  - Security headers + CSP for Canvas framing are set in `lib/security.ts`
  - Middleware role gating exists when Clerk is configured (`middleware.ts`)

- **Build / tooling (verified locally)**
  - `npm run typecheck` ✅
  - `npm run lint` ✅
  - `npm run db:generate` (Prisma client generate) ✅
  - `npm run build` ✅

### Pilot readiness checklist

| Item | Status |
|------|--------|
| Works locally (`npm run dev` + Postgres) | Ready |
| Mock Canvas launch works (`/demo` → role launches) | Ready |
| Prompt logging works (`PromptLog` + `PromptClassification`) | Ready |
| Teacher policies work (PATCH + student behavior changes) | Ready |
| Professor demo flow documented (`DEMO_SCRIPT.md`, `/demo`) | Ready |
| Privacy overview for pilots (`/privacy`) | Ready |
| Pilot interest form UI (`/pilot`, no email yet) | Ready |
| Response streaming (NDJSON) | Ready |
| Citation reminder policy (`requireCitation`) | Ready |
| Demo preflight health check (`/api/health`) | Ready |
| Smoke test script (`npm run smoke`) | Ready |
| Needs real Canvas Developer Key | Not yet |
| Needs privacy review before school deployment | Not yet |
| Needs professor feedback from live demo | In progress |

### End-to-end verified (local)

The following flows were exercised successfully against a local Postgres database and a running dev server:

- Mock student LTI launch (`/api/mock-lti?role=student`) redirects to `/lti/student` and sets LTI context cookie
- Student prompt submission:
  - allowed learning prompt returns `allowed: true` and persists `PromptLog` + `PromptClassification`
  - blocked integrity prompt returns `allowed: false` and persists `PromptLog` + `PromptClassification`
- Teacher dashboard loads (`/dashboard/teacher`)
- Admin dashboard loads (`/dashboard/admin`)
- Assignment policy API works for teacher-owned assignments:
  - GET `/api/assignment-policies/[assignmentId]`
  - PATCH `/api/assignment-policies/[assignmentId]`
  - Updated policy changes subsequent assistant behavior (verified by re-submitting the same prompt)

### What is partial

- **Canvas LTI 1.3 “real” integration**
  - OIDC login/launch/JWKS routes exist, and token verification is implemented, but end-to-end real Canvas validation requires correct platform config + environment variables.
  - Deep-linking and future service scopes are scaffolded, but not fully implemented for production usage.

- **Rate limiting storage**
  - Current rate limiting is in-memory (`lib/security.ts`), which is fine for a single-instance pilot but not multi-instance production.

### What is missing (for a pilot / production hardening)

- **Operational runtime verification**
  - This verification focused on build-time health. You still need to run the app (`npm run dev`) and validate flows in-browser.

- **Production-grade secret management and observability wiring**
  - Logging is structured, but no external sink (Datadog/Axiom/OTel) is configured here.

- **Real auth provisioning**
  - Clerk keys and role metadata need to be configured to match your intended multi-tenant model (school scoping).

### Correct install and run commands

From `README.md`, the intended local commands are:

```bash
npm install
npm run db:deploy
npm run db:seed
npm run dev
```

Recommended “clean install” (matches lockfile):

```bash
npm ci
```

If you want Postgres via Docker:

```bash
docker compose up postgres
npm run db:deploy
npm run db:seed
npm run dev
```

### Environment variables (required vs optional)

Create a local `.env` by copying `.env.example`:

```bash
cp .env.example .env
```

- **Required for a real DB-backed local run**
  - `DATABASE_URL`

- **Optional (local fallback behavior exists)**
  - `OPENAI_API_KEY` (if missing, classifier + assistant use deterministic mocks)
  - `OPENAI_MODEL`
  - Clerk variables:
    - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
    - `CLERK_SECRET_KEY`
    - (the `NEXT_PUBLIC_CLERK_*_URL` vars are optional routing helpers)

- **Needed for real Canvas LTI (not required for mock launch)**
  - `NEXT_PUBLIC_APP_URL`
  - `LTI_CLIENT_ID`
  - `LTI_DEPLOYMENT_ID`
  - `LTI_ISSUER`
  - `LTI_PLATFORM_JWKS_URL`
  - `LTI_AUTH_LOGIN_URL`
  - `LTI_PUBLIC_JWKS_JSON` (optional; local JWKS is generated if unset)
  - `LTI_MOCK_MODE` (set to `"true"` for local demo flows)

### Next 5 recommended tasks

1. **Run a live professor demo from `/demo`**
   - follow `DEMO_SCRIPT.md` with seeded data

2. **Make DB lifecycle foolproof**
   - confirm `db:deploy` + `db:seed` succeed on a fresh Postgres container
   - add a short troubleshooting section for common Prisma/Postgres issues

3. **Harden LTI production config**
   - validate OIDC login + launch against a real Canvas Developer Key
   - confirm `LTI_ISSUER`/JWKS/auth URLs match your Canvas environment

4. **Replace in-memory rate limiting**
   - move rate-limit bucket storage to Redis/Upstash for multi-instance readiness

5. **Add an end-to-end smoke test script**
   - run `npm run smoke` against a running dev server (see `scripts/smoke.mjs`)

See **`ROADMAP.md`** for the full pilot plan and open decisions.

