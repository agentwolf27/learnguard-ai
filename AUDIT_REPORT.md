# LearnGuard AI — Audit & Finishing Pass

_Date: 2026-06-25_

## Headline

This codebase is **much further along than a skeleton MVP**. Unlike CarbonWise, there were **no TypeScript errors to fix** — `tsc --noEmit` reports **0 errors before and after** this pass. The work here was verifying that each subsystem actually does what it claims, closing real security gaps in the LTI session, and finishing the teacher dashboard's per-assignment analytics.

| Check | Result |
|---|---|
| `tsc --noEmit` | **0 errors** (clean before and after) |
| `eslint` on changed files | clean |
| Canvas LTI launch verification | real (Canvas JWKS + `jwtVerify`), now hardened |
| Teacher dashboard data | real Prisma, now with per-assignment rollup + drilldown |
| Student assistant | real OpenAI + policy enforcement (not streaming) |
| Risk classification | real rule + GPT classifiers, stored, now surfaced high-risk first |

---

## What's done and working

**Canvas LTI 1.3**
- OIDC login route generates `state` + `nonce` and redirects to Canvas (`app/api/lti/login`).
- Launch handler verifies the Canvas `id_token` against the platform JWKS with `jose` `jwtVerify`, checking issuer and audience (`lib/lti.ts` → `validateLtiIdToken`).
- User / School / Course / Assignment are created and linked on launch, with a default `AssignmentPolicy` (`lib/ltiPersistence.ts`).
- Local mock launch buttons work (`/demo` → `/api/mock-lti`, plus `/api/lti/launch?role=`).
- JWKS endpoint and deep-link route are scaffolded.

**Teacher dashboard**
- Fetches real data from Prisma (prompt logs, assignments, insights) scoped by teacher/admin (`lib/dashboardData.ts`).
- Global metrics, category/risk/usage charts, a filterable recent-prompts table, and an inline policy editor all render from live data.

**Student AI assistant**
- Full UI (`components/StudentAssistant.tsx`).
- Calls OpenAI (`lib/aiResponse.ts`) with a deterministic local fallback when `OPENAI_API_KEY` is unset.
- **Policy is enforced before the LLM is called** — a blocked prompt returns the canned `blockedResponse` and never reaches OpenAI.
- Persists `PromptLog` + `PromptClassification`, writes audit logs, learning insights, and sustainability estimates.

**Risk classification**
- Rule classifier (phrase catalog) + GPT classifier (OpenAI structured `json_schema` output) + per-assignment policy overlay (`lib/ruleClassifier.ts`, `lib/gptClassifier.ts`, `applyPolicy` in the assistant route).
- `riskLevel` (low/medium/high) is computed as the max of rule + GPT signal and stored on every record.

---

## What was broken or stubbed — and fixed in this pass

1. **Unsigned, forgeable session cookie (security).** The LTI launch stored the launch context as plain base64 JSON in an httpOnly cookie. `httpOnly` only blocks JavaScript, not a crafted HTTP request — a student could forge `role=admin`. Replaced with a **signed HS256 JWT** (`signLtiSession` / `verifyLtiSession` in `lib/lti.ts`). Unsigned legacy cookies are now rejected.
2. **No nonce validation (LTI replay).** The login step set a `nonce` cookie that the launch never checked. Launch now compares the `id_token` nonce to the login nonce and rejects mismatches.
3. **State check could be skipped.** The old guard only validated `state` when the cookie happened to be present. Non-mock launches now **reject missing or mismatched state**.
4. **No per-assignment analytics or drilldown.** The dashboard only had global metrics + a flat prompt list. Added `assignmentSummaries` (submissions, # students who used AI, low/medium/high risk breakdown, blocked count) with an **expandable per-student table**, sorted highest-risk first (`lib/dashboardData.ts`, `components/TeacherDashboardClient.tsx`).
5. **High-risk submissions not surfaced.** The recent-prompts table was purely chronological; it now **sorts high-risk first**, then by recency.
6. Removed a redundant duplicate `prisma.user.update` in `lib/ltiPersistence.ts`.

---

## Top 5 code fixes (delivered)

1. **Canvas LTI session hardening** — signed JWT session + nonce + state checks. `lib/lti.ts`, `app/api/lti/launch/route.ts`, `app/api/mock-lti/route.ts`.
2. **Dashboard data fetch** — per-assignment rollup with per-student breakdown. `lib/dashboardData.ts`.
3. **Dashboard UI** — assignment analytics table, expandable students, high-risk-first. `components/TeacherDashboardClient.tsx`.
4. **Risk surfacing** — recent prompts ordered by risk then recency. `lib/dashboardData.ts`.
5. **Types** — new `AssignmentSummary` / `AssignmentStudentStat` interfaces; everything stays `tsc`-clean at 0 errors.

---

## Second pass — now also done

- **Response streaming (implemented).** `/api/assistant` now returns a newline-delimited JSON (NDJSON) stream: it emits the governance `classification` first, then forwards OpenAI text **deltas** as they arrive, and finally persists `PromptLog`/`PromptClassification` + audit logs + insights **after** the stream closes and emits a `done` frame with `promptLogId` and the sustainability estimate. Blocked prompts still never reach the LLM. When no `OPENAI_API_KEY` is set, the deterministic fallback is chunked so the UI still renders progressively. `lib/aiResponse.ts` (`streamAiResponse`), `app/api/assistant/route.ts`, `components/StudentAssistant.tsx` (incremental NDJSON reader + live cursor).
- **LTI identity wired into page-level auth (implemented).** `getAuthenticatedViewer` now **prefers the verified signed LTI session** when present: it resolves the viewer + role from the launch context and enforces `allowedRoles` against it, falling back to Clerk and then the demo viewer. Dashboard access is now tied to the trustworthy launch session rather than only the demo/Clerk identity. `lib/auth.ts`.

## Still open (recommended, not done)

- **`require_citation` guardrail.** The spec mentions it, but `AssignmentPolicy` has no `requireCitation` field and no citation reminder is appended to allowed responses. Needs a schema field + migration.
- **Multi-tenant school resolution.** `resolveOrCreateLtiRecords` matches a school by `domain` **OR** name `"Northstar High School"`, which collapses every tenant onto the seed school. Drop the name fallback for real multi-tenancy.
- **Rate limiting** is in-memory (single-instance only) — move to Redis/Upstash for multi-instance.
- **AGS / NRPS / deep-linking** service scopes are scaffolded, not implemented.

---

## Verification notes

- `tsc --noEmit` → 0 errors; `eslint` on all changed files → clean.
- Runtime verification (launch button → dashboard → valid session) requires Postgres + the dev server in your environment. With `LTI_MOCK_MODE=true`, the `/demo` launch buttons now set a **signed** session cookie. Suggested local check:
  ```bash
  npm run db:deploy && npm run db:seed && npm run dev
  # open /demo, click a role launch, confirm redirect + dashboard data
  ```
- The session JWT is signed with `LTI_SESSION_SECRET`. In production the server refuses to start without it (no fallback); in development a random per-process secret is used and a warning is logged (`lib/lti-session-secret.ts`).
