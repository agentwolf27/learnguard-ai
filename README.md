# LearnGuard AI

LearnGuard AI is a pilot-stage MVP for classroom AI governance (see docs/GO_LIVE.md for what a production deployment still needs). It integrates with Canvas through LTI 1.3, gives students a governed AI assistant, and gives teachers visibility into assignment-specific AI use, risk, and learning trends.

This is not a cheating detector. It is AI governance infrastructure for classrooms: transparency, guardrails, analytics, and responsible student support.

## Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL
- OpenAI Responses API
- Canvas LTI 1.3-compatible launch architecture
- Vercel-ready deployment

## Go live (pilot)

School-wide pilot checklist and required API keys: **[docs/GO_LIVE.md](docs/GO_LIVE.md)**

- Clerk (teachers/admins): [docs/ClerkSetup.md](docs/ClerkSetup.md)
- Canvas LTI: [docs/CanvasSetup.md](docs/CanvasSetup.md)
- Deploy: [docs/Deployment.md](docs/Deployment.md)
- Roadmap: [ROADMAP.md](ROADMAP.md)

Professor demo launcher (local): `http://localhost:3000/demo`

## Local Setup

```bash
npm install
npm run db:deploy
npm run db:seed
npm run dev
```

Open `http://localhost:3000/demo`, then use the mock Canvas launch buttons.

The app works without an OpenAI key. If `OPENAI_API_KEY` is missing, the GPT classifier and assistant use deterministic mock responses for local development.

For local infrastructure:

```bash
docker compose up postgres
npm run db:deploy
npm run db:seed
npm run dev
```

## Environment

Copy `.env.example` to `.env` and set:

```bash
DATABASE_URL="postgresql://learnguard:learnguard@localhost:5432/learnguard?schema=public"
OPENAI_API_KEY=""
OPENAI_MODEL="gpt-5-mini"
NEXT_PUBLIC_APP_URL="https://your-domain.com"

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=""
CLERK_SECRET_KEY=""

LTI_MOCK_MODE="false"
LTI_CLIENT_ID=""
LTI_DEPLOYMENT_ID=""
LTI_PLATFORM_JWKS_URL="https://sso.canvaslms.com/api/lti/security/jwks"
LTI_AUTH_LOGIN_URL="https://sso.canvaslms.com/api/lti/authorize_redirect"
LTI_PUBLIC_JWKS_JSON=""
LTI_SESSION_SECRET="" # openssl rand -base64 48
```

`LTI_SESSION_SECRET` signs the LTI session cookie. A production server refuses to start without it (32+ characters). In development, if it is unset, a random per-process secret is used and a warning is logged, so sessions end when the dev server restarts.

For Vercel, set the same variables in Project Settings and use a managed PostgreSQL database.

## Canvas LTI 1.3 Setup

Canvas external tools are configured through **Admin -> Developer Keys -> LTI Key**.

Use these placeholders during setup:

- OIDC Login URL: `https://your-domain.com/api/lti/login`
- Redirect URI: `https://your-domain.com/api/lti/launch`
- JWKS URL: `https://your-domain.com/api/lti/jwks`
- Target Link URI: `https://your-domain.com/lti/student`

Recommended placements for the MVP:

- Course navigation
- Module item
- Assignment external tool

Future scopes are structured in `lib/ltiServices.ts`:

- NRPS roster sync: `https://purl.imsglobal.org/spec/lti-nrps/scope/contextmembership.readonly`
- Assignment and Grade Services: line items, scores, and readonly results
- Deep Linking for assignment/resource selection

Canvas references:

- [Manually Configuring LTI Advantage Tools](https://canvas.instructure.com/doc/api/file.lti_dev_key_config.html)
- [Overview of an LTI Launch](https://www.canvas.instructure.com/doc/api/file.lti_launch_overview.html)
- [Canvas NRPS/User Provisioning](https://canvas.instructure.com/doc/api/file.provisioning.html)
- [Canvas Assignment Tools and AGS](https://canvas.instructure.com/doc/api/file.assignment_tools.html)

OpenAI references:

- [Responses API](https://platform.openai.com/docs/api-reference/responses)
- [Models](https://platform.openai.com/docs/models)

## Routes

- `/api/lti/login` - OIDC login initiation
- `/api/lti/launch` - LTI launch redirect and mock launch handler
- `/api/lti/jwks` - Tool JWKS endpoint
- `/api/lti/deep-link` - Deep Linking readiness endpoint
- `/api/assistant` - Governed student prompt pipeline
- `/api/assignment-policies/[assignmentId]` - Teacher policy updates
- `/lti/student` - Canvas student assistant
- `/lti/teacher` - Canvas teacher launch view
- `/dashboard/teacher` - Teacher dashboard
- `/dashboard/admin` - Admin dashboard

## Governance Pipeline

Every student prompt passes through:

1. Rule classifier in `lib/ruleClassifier.ts`
2. GPT classifier in `lib/gptClassifier.ts`
3. Assignment policy enforcement
4. AI response engine in `lib/aiResponse.ts`
5. Prompt logging, classification persistence, learning insight extraction, and sustainability estimate

Blocked requests never receive the requested answer. The app returns an educational redirect such as concept explanation, outlining, draft feedback, practice questions, or a similar worked example.

## Seed Data

`prisma/seed.ts` creates:

- One school
- Two courses
- Two teachers
- Five students
- Three assignments
- Assignment policies
- Sample low-risk and high-risk prompt logs
- Learning insights and usage metrics

## Pilot Hardening Docs

- [Architecture](docs/Architecture.md)
- [Deployment](docs/Deployment.md)
- [Canvas setup](docs/CanvasSetup.md)
- [Security](docs/Security.md)

## License

MIT, see [LICENSE](LICENSE).
