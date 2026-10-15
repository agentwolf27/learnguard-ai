# Clerk Setup (Teachers & Admins)

Students authenticate via **Canvas LTI launch**. Teachers and school admins use **Clerk**.

## Create a Clerk application

1. Go to [https://dashboard.clerk.com](https://dashboard.clerk.com)
2. Create an application (Email + Google is fine for pilot)
3. Copy:
   - Publishable key → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - Secret key → `CLERK_SECRET_KEY`
4. In Clerk → Paths, set sign-in/sign-up to `/sign-in` and `/sign-up` (or match your env vars)

## User public metadata (required)

LearnGuard reads `publicMetadata.role` and school fields.

### Teacher

```json
{
  "role": "teacher",
  "schoolSlug": "northstar-high",
  "schoolName": "Northstar High School"
}
```

### School admin

```json
{
  "role": "admin",
  "schoolSlug": "northstar-high",
  "schoolName": "Northstar High School"
}
```

`schoolSlug` must be stable per institution. For a real school, use a domain-based slug (e.g. `lincoln-unified`).

## How to set metadata

1. Clerk Dashboard → Users → select user → Metadata → Public
2. Paste the JSON above
3. Save, then have the user sign in at `/sign-in`

## Role access matrix

| Role | Student assistant | Teacher dashboard | Admin dashboard | Edit policies |
|------|-------------------|-------------------|-----------------|---------------|
| Student (LTI) | Yes | No | No | No |
| Teacher (Clerk or LTI) | Yes | Own courses | No | Own courses |
| Admin (Clerk or LTI) | Yes | School-wide | Yes | School-wide |

## Pilot tips

- Invite only staff during the first week; keep `LTI_MOCK_MODE=true` until Canvas is validated.
- Use the same `schoolSlug` for every staff member at that school.
- After Canvas is live, teachers can also launch from Canvas course navigation (LTI session takes precedence when present).
