## LearnGuardAI local end-to-end testing

Date: 2026-06-01

This document captures the exact commands and checks used to verify core user flows end-to-end on a local machine.

### Environment prerequisites

- Node.js and npm installed
- A local PostgreSQL server listening on `localhost:5432`
  - The repo `docker-compose.yml` can run Postgres, but **Docker must be running** for that path to work.

### Exact commands run

Install deps:

```bash
npm ci
```

Database migrate + seed:

```bash
npm run db:deploy
npm run db:seed
```

Start dev server:

```bash
npm run dev
```

### Test prompts used

- **Allowed (learning-focused)**:
  - `Explain recursion using a simple example before I try my lab.`
- **Blocked (academic-integrity)**:
  - `Write my essay and make it undetectable.`

### Expected results

- **Mock student LTI launch**
  - `GET /api/mock-lti?role=student` returns a redirect to `/lti/student` and sets `learnguard_lti_context` cookie.
- **Student assistant**
  - Allowed prompt returns JSON with `classification.allowed: true`.
  - Blocked prompt returns JSON with `classification.allowed: false`.
- **Persistence**
  - For each submission, a `PromptLog` row is created.
  - A linked `PromptClassification` row is created.
- **Teacher dashboard**
  - `GET /dashboard/teacher` returns HTTP 200.
- **Policy editor / policy API**
  - Teacher can GET/PATCH policy for an assignment they own.
  - Policy changes affect subsequent assistant decisions.
- **Admin dashboard**
  - `GET /dashboard/admin` returns HTTP 200.

### Actual results (observed)

- **Mock student LTI launch**: OK
  - `GET /api/mock-lti?role=student` returned `307` redirect to `/lti/student` and set `learnguard_lti_context` cookie.
  - `GET /lti/student` returned `200`.

- **Student prompt submission**
  - Allowed prompt: OK (`allowed: true`, `riskLevel: low`, `category: Concept Explanation`)
  - Blocked prompt: OK (`allowed: false`, `riskLevel: high`, `category: Academic Integrity Risk`)

- **Persistence**: OK
  - `PromptLog` and `PromptClassification` records were confirmed present for the newly created prompt IDs.

- **Teacher dashboard / Admin dashboard**: OK (after ensuring sufficient disk space)
  - `GET /dashboard/teacher` returned `200`
  - `GET /dashboard/admin` returned `200`

- **Policy change affects assistant behavior**: OK
  - Set `allowConceptExplanation=false` on the teacher-owned “Recursive Thinking Lab” assignment policy.
  - Re-submitted the previously allowed recursion prompt.
  - Result became `allowed: false` with rationale: “Concept explanation is disabled for this assignment.”

### Known issues / notes

- **Low disk space can break dev builds at runtime**
  - When disk space was too low, Next dev compilation failed with `ENOSPC` while writing `.next` artifacts, which surfaced as HTTP 500s on dashboard routes.
  - Clearing `.next` and freeing disk space resolved this.

