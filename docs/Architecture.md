# Architecture

LearnGuard AI is a multi-tenant Next.js pilot platform for school AI governance.

## System Layers

- **Web app:** Next.js 15 App Router, Tailwind, Clerk UI, dashboards, Canvas launch surfaces.
- **API layer:** Route handlers for assistant prompts, assignment policy changes, LTI launch, JWKS, and deep-link readiness.
- **Governance layer:** Rule classifier, GPT classifier, assignment policy enforcement, response generation, learning analytics, and sustainability estimates.
- **Data layer:** Prisma with PostgreSQL, tenant-scoped models, indexes, foreign keys, and audit logging.
- **Integrations:** Clerk for authentication, Canvas LTI 1.3 for launch context, OpenAI for governed AI responses.

## Tenant Model

`School` is the tenant boundary. Every user, course, prompt log, policy, insight, metric, and audit event is scoped to a school.

Teachers query only courses where `Course.teacherId` matches their user ID. School admins query all records in their `schoolId`. Students interact only through their own authenticated or LTI launch context.

## Role Model

- `STUDENT`: student assistant access.
- `TEACHER`: student assistant plus teacher dashboard and policy editing for owned courses.
- `ADMIN`: school-wide dashboard and policy access for the school tenant.

Clerk public metadata should include:

```json
{
  "role": "teacher",
  "schoolSlug": "northstar-high",
  "schoolName": "Northstar High School"
}
```

## Data Flow

1. User authenticates with Clerk or launches through Canvas LTI.
2. App resolves the user into the local `User` table and school tenant.
3. Prompt is validated, rate-limited, checked for CSRF, and classified.
4. Assignment policy is applied.
5. Response is generated or redirected if blocked.
6. Prompt, classification, learning insight, sustainability estimate, and audit events are persisted.

## Operational Notes

Use `DATABASE_URL` with PostgreSQL. SQLite has been removed from the pilot architecture.

