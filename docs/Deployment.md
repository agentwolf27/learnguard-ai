# Deployment

## Target stack (pilot)

- **App:** Vercel (Next.js 15)
- **Database:** Neon Postgres 16
- **Staff auth:** Clerk
- **Student auth:** Canvas LTI 1.3
- **AI:** OpenAI Responses API (optional until privacy review)

Full secrets checklist: [GO_LIVE.md](./GO_LIVE.md)

## Required Services

- PostgreSQL 16 (Neon recommended)
- Clerk application (teachers/admins)
- Canvas Developer Key for LTI 1.3 (students)
- OpenAI API key (optional; mocks work without it)
- Vercel project

## Environment Variables

See `.env.example` and [GO_LIVE.md](./GO_LIVE.md). Minimum for a **demo deploy**:

```bash
DATABASE_URL="postgresql://user:password@host/neondb?sslmode=require"
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
LTI_MOCK_MODE="true"
LTI_SESSION_SECRET="generate-with-openssl-rand-base64-48"
```

Minimum for **real Canvas production** additionally requires Clerk + LTI client/issuer/deployment IDs and `LTI_MOCK_MODE="false"`.

## Vercel deploy (CLI)

```bash
npm ci
npx vercel link
# Set env vars in Vercel dashboard first
npx vercel --prod
```

`vercel.json` runs `prisma generate && prisma migrate deploy && next build` so migrations apply at build time when `DATABASE_URL` is present.

After first deploy:

```bash
# Point DATABASE_URL at Neon, then:
npm run db:seed
SMOKE_BASE_URL=https://your-app.vercel.app npm run smoke
```

## GitHub Actions deploy

Workflow: `.github/workflows/deploy.yml`

Required GitHub secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## Docker (alternative)

```bash
docker compose up --build
```

The app container runs `prisma migrate deploy` before starting.

## Validate env before go-live

```bash
# With env vars loaded:
npm run validate:env -- demo
npm run validate:env -- production
```

## Health checks

- `GET /api/health` — DB reachability + mock/OpenAI/Clerk flags
- `npm run smoke` — route-level smoke test against a running base URL
