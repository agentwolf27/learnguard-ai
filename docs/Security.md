# Security

## Authentication

Clerk is the primary authentication provider. Protected pages use Clerk middleware plus server-side role checks. Clerk public metadata supplies `role` and school tenant metadata.

## Authorization

Authorization is enforced server-side:

- Teachers only query courses they own.
- Admins only query their school tenant.
- Assignment policy updates check both school and course ownership.
- API handlers never trust client-provided tenant IDs.

## Input Validation

Zod validates prompt submission and assignment policy updates. Prompts are length-limited and sanitized before classification.

## CSRF

State-changing first-party API routes validate the `Origin` header against the request host. Canvas LTI launch POSTs are protected by LTI state and JWT validation instead of same-origin CSRF.

## XSS and Framing

Middleware adds:

- `Content-Security-Policy`
- `X-Content-Type-Options`
- `Referrer-Policy`
- `Permissions-Policy`

Canvas frame ancestors are allowed through CSP for LTI launch support. `X-Frame-Options` is intentionally omitted because it cannot express Canvas domain allowlists.

## Rate Limiting

Prompt submission and policy updates use in-memory rate limiting for pilot deployments. Move the bucket store to Redis or Upstash before multi-instance production.

## Audit Logging

`AuditLog` records:

- login-ready events
- prompt submissions
- blocked prompts
- policy changes
- dashboard access
- LTI launches
- deep-linking requests
- authorization and rate-limit events

## Monitoring

`instrumentation.ts` registers request-error monitoring hooks. `lib/logger.ts` emits structured JSON logs ready for Vercel, Datadog, Axiom, or OpenTelemetry ingestion.
