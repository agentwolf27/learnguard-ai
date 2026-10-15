# LearnGuard AI — Roadmap & Pilot Plan

_Last updated: 2026-06-01_

This document captures what was improved in the latest pass, what remains before a real professor pilot, edge cases we considered, and decisions that need your input.

---

## What we just improved (this pass)

### Security & trust boundaries
| Change | Edge case addressed |
|--------|---------------------|
| `/api/assistant` prefers **signed LTI session cookie** over client `body.context` | Student could forge `role=admin` or wrong assignment in JSON body |
| Mock GET launch on `/api/lti/launch` **blocked unless `LTI_MOCK_MODE=true`** | Anyone could hit `?role=admin` in production |
| Student UI no longer sends launch context in POST body | Redundant attack surface; server uses cookie |
| Multi-tenant school lookup **by domain only** when not in mock mode | All real Canvas tenants collapsed into "Northstar High School" |

### Professor demo polish
| Change | Why it matters |
|--------|----------------|
| `/demo` **preflight health panel** | Catches missing DB / wrong env before a live demo |
| `/api/health` endpoint | Programmatic readiness check |
| `npm run smoke` script | Quick route verification against a running server |
| **`requireCitation` policy** + migration | Teachers can append citation reminders to allowed responses |
| Streaming UI fix | Text deltas no longer dropped if they arrive before classification frame |

---

## Current maturity (honest assessment)

| Area | Demo-ready? | Production-ready? |
|------|-------------|-------------------|
| Mock Canvas launch (`/demo`) | Yes | N/A |
| Student assistant + governance | Yes | Needs OpenAI key + privacy review |
| Teacher dashboard + policies | Yes | Needs real auth + tenant isolation testing |
| Admin dashboard | Yes | Same |
| Real Canvas LTI | Partial (code exists) | Needs Developer Key + staging Canvas |
| Pilot form | UI only | Needs email/CRM integration |
| Rate limiting | Single-instance | Needs Redis/Upstash |
| Data retention / FERPA | Documented on `/privacy` | Needs legal review |

---

## Recommended phases

### Phase 1 — Professor demo (now → 1 week)
**Goal:** Confident 5-minute live demo with seeded data.

- [x] Demo launcher at `/demo`
- [x] `DEMO_SCRIPT.md` with exact prompts
- [x] Preflight health check on demo page
- [x] Smoke test script
- [ ] Run one **rehearsal** with a professor or colleague
- [ ] Capture feedback on messaging ("governance vs cheating detector")

**Demo checklist before every presentation:**
```bash
npm run db:deploy && npm run db:seed && npm run dev
# Open http://localhost:3000/demo — confirm green preflight
# Follow DEMO_SCRIPT.md
```

### Phase 2 — Single-course pilot (2–6 weeks)
**Goal:** One professor, one course, real students (with consent).

- [ ] Canvas Developer Key on **staging/test** Canvas first
- [ ] Set `LTI_MOCK_MODE=false`, configure all LTI env vars
- [ ] Set `LTI_SESSION_SECRET` (dedicated secret, not dev default)
- [ ] Privacy review with institution (use `/privacy` as starting doc)
- [ ] Clerk auth OR Canvas-only auth decision (see questions below)
- [ ] Pilot agreement / consent language for students
- [ ] Wire `/pilot` form to email (Resend, SendGrid) or CRM

### Phase 3 — School-wide pilot (1–3 months)
**Goal:** Multiple courses, admin dashboard in use, policy conversations with department.

- [ ] Multi-tenant isolation audit (domain-based schools)
- [ ] Redis rate limiting for multi-instance deploy
- [ ] Data retention policy + export/delete workflow
- [ ] Observability (structured logs → Axiom/Datadog)
- [ ] NRPS roster sync (optional, for accurate enrollment)
- [ ] Professor training doc + 15-min onboarding video

### Phase 4 — Production hardening (ongoing)
- [ ] AGS grade passback (optional)
- [ ] Deep linking for assignment placement
- [ ] SOC2/FERPA-aligned subprocessors list
- [ ] Automated E2E tests in CI (Playwright)
- [ ] Load testing on `/api/assistant`

---

## Edge cases to watch in a live pilot

### Student assistant
- **Empty prompt** — blocked by Zod validation ✓
- **6000+ char prompt** — blocked ✓
- **Prompt during OpenAI outage** — falls back to local text ✓
- **Blocked prompt** — never calls OpenAI ✓
- **Policy changed mid-session** — next prompt uses updated policy ✓
- **No assignment context** — still logs, uses course-level policy if any
- **Citation reminder** — appended only when `requireCitation=true` and allowed

### LTI / auth
- **Expired session cookie (8h JWT)** — user must re-launch from Canvas
- **Student bookmarks teacher dashboard URL** — blocked by role check if LTI session says student
- **Demo mode left on in production** — mock launch returns 403 if `LTI_MOCK_MODE≠true`
- **Clerk + LTI both configured** — LTI session takes precedence when present

### Teacher dashboard
- **Teacher views another teacher's assignment policy** — 403 from API ✓
- **No prompts yet** — empty state with seed hint ✓
- **Filters hide all rows** — distinct empty state ✓

### Infrastructure
- **Disk full during dev** — Next.js `.next` compilation fails with 500s; clear `.next` and free space
- **Postgres not running** — `/api/health` shows degraded; demo preflight warns

---

## Decisions recorded (2026-06-01)

| Question | Your choice | Implication |
|----------|-------------|-------------|
| Pilot scope | **School-wide rollout** | Need strong multi-tenant isolation, admin onboarding, and privacy review before launch |
| Canvas environment | **Production Canvas immediately** | Developer Key on prod; no test-instance safety net — extra care on LTI config |
| Authentication | **LTI for students, Clerk for teachers/admins** | Configure Clerk metadata (`role`, `schoolSlug`); students never need Clerk |
| OpenAI in pilot | **Mocks until privacy review** | No API spend; deterministic classifier/responses; set expectations with professors |
| Hosting | **Vercel + Neon Postgres** | Deploy preview for remote demos; run `db:deploy` on Neon before pilot |
| Pilot form | **Defer email integration** | `/pilot` stays UI-only for now |

### Recommended next build tasks (based on your choices)

1. **Deploy to Vercel + Neon** — see [docs/GO_LIVE.md](docs/GO_LIVE.md) (in progress / blocked on your secrets)
2. ~~**Clerk provisioning doc**~~ — done: [docs/ClerkSetup.md](docs/ClerkSetup.md)
3. ~~**Canvas + deploy docs**~~ — done: [docs/CanvasSetup.md](docs/CanvasSetup.md), [docs/Deployment.md](docs/Deployment.md)
4. **You provide secrets** — Neon `DATABASE_URL`, Clerk keys, then Canvas LTI IDs
5. **Production Canvas Developer Key** — point OIDC/JWKS/launch at the Vercel URL
6. **Privacy review gate** — before enabling real OpenAI or real student data

---

## Open questions (need your decisions)

These block Phase 2 planning:

1. **Data retention** — How long should prompt logs be kept? (30 days / semester / 1 year?)
2. **Branding** — Is "LearnGuard AI" final, or institution white-label for the pilot?
3. **Privacy review timeline** — When can real student data and OpenAI be enabled?

~~Pilot scope, Canvas env, auth, OpenAI, hosting, and pilot form were decided — see table above.~~

---

## Files reference

| File | Purpose |
|------|---------|
| `DEMO_SCRIPT.md` | Step-by-step 5-min demo |
| `TESTING.md` | E2E verification log |
| `PROJECT_STATUS.md` | Pilot readiness checklist |
| `AUDIT_REPORT.md` | Security audit notes |
| `/demo` | Professor demo launcher |
| `/api/health` | Readiness probe |
| `npm run smoke` | Route smoke test |

---

## Next actions (recommended order)

1. **You:** Answer the 8 questions above
2. **Us:** Run a rehearsed demo using `DEMO_SCRIPT.md`
3. **Us:** Deploy preview to Vercel for remote professor demos
4. **Us:** Configure Canvas Developer Key on test instance
5. **Us:** Wire pilot form email when you choose a destination
