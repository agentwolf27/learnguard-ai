# LearnGuard AI — Go-Live Checklist

Target: **school-wide pilot** on **Vercel + Neon**, with **Canvas LTI for students** and **Clerk for teachers/admins**. OpenAI stays **mocked** until privacy review.

## Your deployment

Fill these in for your own deployment.

| Item | Value |
|------|--------|
| Production URL | `https://your-app.vercel.app` |
| Demo page | `https://your-app.vercel.app/demo` |
| Health | `https://your-app.vercel.app/api/health` |
| Vercel project | `<your-vercel-project>` |
| GitHub | https://github.com/agentwolf27/learnguard-ai |

The mock LTI launch returns 500 until `DATABASE_URL` points at a reachable database. Add Clerk keys next for teacher/admin sign-in.

## Secrets you must provide

Paste these into Vercel → Project Settings → Environment Variables (Production + Preview).

| Variable | Required now? | Where to get it | Notes |
|----------|---------------|-----------------|-------|
| `DATABASE_URL` | **Yes** | [Neon Console](https://console.neon.tech) → connection string | Use pooled URL `?sslmode=require` for serverless |
| `NEXT_PUBLIC_APP_URL` | **Yes** | Your Vercel URL, e.g. `https://your-app.vercel.app` | No trailing slash |
| `LTI_SESSION_SECRET` | **Yes** | Generate: `openssl rand -base64 48` | Dedicated secret, 32+ characters; never commit. A production server refuses to start without it |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | **Yes** (staff auth) | [Clerk Dashboard](https://dashboard.clerk.com) | Required for teacher/admin sign-in |
| `CLERK_SECRET_KEY` | **Yes** (staff auth) | Clerk Dashboard | Server-only |
| `LTI_CLIENT_ID` | **Yes** (real Canvas) | Canvas Admin → Developer Keys → LTI Key | After creating the key |
| `LTI_DEPLOYMENT_ID` | **Yes** (real Canvas) | Canvas after tool install | Often `1` or from deployment |
| `LTI_ISSUER` | **Yes** (real Canvas) | Your Canvas URL, e.g. `https://school.instructure.com` | |
| `LTI_PLATFORM_JWKS_URL` | Recommended | Usually `https://sso.canvaslms.com/api/lti/security/jwks` | Use beta/test SSO if on Canvas beta |
| `LTI_AUTH_LOGIN_URL` | Recommended | Usually `https://sso.canvaslms.com/api/lti/authorize_redirect` | |
| `LTI_MOCK_MODE` | **Yes** | Set `"true"` for demos, `"false"` for real Canvas | Never leave `true` on school production |
| `OPENAI_API_KEY` | Later | OpenAI dashboard | Leave empty until privacy review (mocks work) |
| `OPENAI_MODEL` | Optional | e.g. `gpt-5-mini` | Used only when OpenAI key is set |

### Optional Clerk routing

```bash
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL="/dashboard/teacher"
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL="/dashboard/teacher"
```

## Ordered go-live steps

### 1. Neon Postgres
1. Create a Neon project named `learnguard`.
2. Copy the connection string into Vercel as `DATABASE_URL`.
3. From your laptop (with that URL in `.env`):
   ```bash
   npm run db:deploy
   npm run db:seed   # demo analytics for professor walkthroughs
   ```

### 2. Clerk (teachers / admins)
Follow [ClerkSetup.md](./ClerkSetup.md). Every staff user needs public metadata:
```json
{ "role": "teacher", "schoolSlug": "your-school-slug", "schoolName": "Your School Name" }
```
Admins use `"role": "admin"` or `"school_admin"`.

### 3. Deploy to Vercel
```bash
npx vercel link
npx vercel env pull .env.local   # after setting vars in dashboard
npx vercel --prod
```
Or push to `main` if GitHub Actions secrets are configured (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`).

### 4. Canvas Developer Key (production)
Follow [CanvasSetup.md](./CanvasSetup.md) with your real Vercel domain. Then set:
- `LTI_MOCK_MODE=false`
- `LTI_CLIENT_ID`, `LTI_DEPLOYMENT_ID`, `LTI_ISSUER`
Redeploy after env changes.

### 5. Acceptance checks
```bash
SMOKE_BASE_URL=https://your-domain.com npm run smoke
curl -s https://your-domain.com/api/health | jq
```
Manual:
- `/demo` preflight green (mock mode) or Canvas launch works (real mode)
- Teacher Clerk sign-in → `/dashboard/teacher`
- Student Canvas launch → `/lti/student` → submit allowed + blocked prompts
- Policy toggle changes student behavior
- Admin dashboard loads for admin Clerk user

### 6. Privacy gate (before real student data / OpenAI)
- Institutional privacy review signed off
- Consent language for students
- Retention policy decided
- Only then set `OPENAI_API_KEY` and allow production student prompts

## What is already ready in the repo

- Governed assistant + streaming + policies
- Signed LTI sessions, mock-launch lockdown
- Teacher/admin dashboards + assignment analytics
- Demo launcher, privacy page, pilot form UI
- CI with Postgres + Docker build
- Health endpoint + smoke script
- Prisma migrations (including `requireCitation`)

## Blocking without your keys

The app **cannot** run school-wide on Vercel until you provide at least:

1. **Neon `DATABASE_URL`**
2. **Clerk publishable + secret keys** (for teacher/admin)
3. **Canvas LTI client ID + issuer + deployment ID** (for real students)

OpenAI is **not** required for the first pilot (mocks are intentional).
