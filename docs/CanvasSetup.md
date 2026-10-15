# Canvas Setup (Production LTI 1.3)

Canvas external tools are configured through **Admin → Developer Keys → + Developer Key → LTI Key**.

## URLs (replace with your Vercel domain)

| Setting | Value |
|---------|--------|
| OIDC Login URL | `https://YOUR_DOMAIN/api/lti/login` |
| Redirect URI | `https://YOUR_DOMAIN/api/lti/launch` |
| JWKS URL | `https://YOUR_DOMAIN/api/lti/jwks` |
| Target Link URI | `https://YOUR_DOMAIN/lti/student` |
| Deep Linking URL | `https://YOUR_DOMAIN/api/lti/deep-link` |

Example if deployed at `https://your-app.vercel.app`:

- Login: `https://your-app.vercel.app/api/lti/login`
- Launch: `https://your-app.vercel.app/api/lti/launch`
- JWKS: `https://your-app.vercel.app/api/lti/jwks`

Also set in Vercel:

```bash
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
LTI_MOCK_MODE="false"
LTI_CLIENT_ID="<from Canvas Developer Key>"
LTI_DEPLOYMENT_ID="<from tool deployment>"
LTI_ISSUER="https://YOUR_SCHOOL.instructure.com"
LTI_PLATFORM_JWKS_URL="https://sso.canvaslms.com/api/lti/security/jwks"
LTI_AUTH_LOGIN_URL="https://sso.canvaslms.com/api/lti/authorize_redirect"
LTI_SESSION_SECRET="<openssl rand -base64 48>"
```

## Recommended placements (MVP)

- Course navigation
- Module item
- Assignment external tool

## Supported Launch Data

LearnGuard reads:

- Canvas user ID, name, and email when available
- Canvas role mapped into student, teacher, or admin
- Course ID and course name
- Assignment/resource link ID and title
- Deployment ID
- Canvas issuer

## Role Mapping

Canvas LTI roles are normalized in `lib/lti.ts`:

- Learner roles → student
- Instructor, TeachingAssistant, and ContentDeveloper roles → teacher
- Administrator roles → school admin

## Validation checklist

1. Create LTI Key → copy Client ID into `LTI_CLIENT_ID`
2. Install tool into a course → copy Deployment ID into `LTI_DEPLOYMENT_ID`
3. Set `LTI_MOCK_MODE=false` and redeploy
4. Launch as student from Canvas → land on `/lti/student`
5. Launch as teacher → land on teacher workspace
6. Confirm `/api/health` shows `ltiMockMode: false` and `databaseReachable: true`

## Future Scopes

The platform is structured for:

- NRPS roster sync
- Assignment and Grade Services line items, scores, and readonly results
- Deep Linking

Scope constants live in `lib/ltiServices.ts`.
