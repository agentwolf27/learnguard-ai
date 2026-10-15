# LearnGuard AI — 5-minute professor demo script

Use the demo launcher: **http://localhost:3000/demo**

Prerequisites:

```bash
npm run db:deploy
npm run db:seed
npm run dev
```

---

## 5-minute flow (recommended order)

| Minute | What to show | Where |
|--------|----------------|-------|
| 0:00 | Product framing: governance, not cheating detection | `/demo` |
| 0:45 | Student assistant + allowed prompt | Mock student launch |
| 2:00 | Blocked integrity prompt + educational redirect | Same student view |
| 2:45 | Teacher dashboard: prompts, risk, trends | Mock teacher launch |
| 3:45 | Assignment policy toggle + effect on student | Teacher dashboard |
| 4:30 | Admin school-wide view | Mock admin launch |
| 5:00 | Pilot + privacy | `/pilot`, `/privacy` |

**Talking point:** “Students get help learning. Teachers see how AI is used on assignments. Schools set guardrails per assignment.”

---

## Student view demo

1. Open **http://localhost:3000/demo**
2. Click **Launch as Student**
3. Point out Canvas context line (course, assignment, student name)
4. Submit the **allowed prompt** (below)
5. Highlight: category, risk badge, allowed status, learning-focused response, sustainability estimate

### Sample prompt — allowed (learning)

```
Explain recursion using a simple example before I try my lab.
```

**Expected:** `allowed: true`, category **Concept Explanation**, risk **low**, scaffolding response (not doing the lab for them).

---

## Blocked prompt demo

1. Stay on student view (or reload after teacher policy demo)
2. Click the example chip or paste the **blocked prompt**
3. Highlight: blocked status, rationale, **educational alternative** (outline, feedback, practice—not the answer)

### Sample prompt — blocked (integrity)

```
Write my essay and make it undetectable.
```

**Expected:** `allowed: false`, risk **high**, matched phrases (`write my essay`, `make it undetectable`), fixed redirect response (no essay generated).

### Optional — policy-driven block

After disabling **Concept explanation** on *Recursive Thinking Lab* in the teacher dashboard, re-submit the allowed recursion prompt.

**Expected:** Now **blocked** with reason referencing the teacher policy.

---

## Teacher dashboard demo

1. From `/demo`, click **Launch as Teacher** (or go to `/dashboard/teacher`)
2. Walk through metric cards: total prompts, active students, high-risk, blocked
3. Show charts: categories, risk distribution, daily usage
4. Filter the prompt table by course or risk level
5. Open a high-risk row and read the prompt preview

**Talking point:** “This is assignment-aware visibility—not a generic AI chat log.”

---

## Assignment policy demo

1. Scroll to **Assignment policies** on the teacher dashboard
2. Pick **Recursive Thinking Lab**
3. Toggle **Concept explanation** off (watch “Saving” badge)
4. Return to student view and submit the recursion explanation prompt again

**Expected:** Previously allowed prompt is now blocked by policy.

**Talking point:** “Professors set guardrails per assignment, not one-size-fits-all.”

---

## Admin dashboard demo

1. From `/demo`, click **Launch as Admin** (or `/dashboard/admin`)
2. Show school metrics: courses, students, teachers, interactions
3. Show adoption / high-risk trend cards
4. Review top subject areas and common integrity risks
5. Skim learning insights list

**Talking point:** “Admins see patterns across the institution for policy and support decisions.”

---

## Quick reference — all sample prompts

| Purpose | Prompt |
|---------|--------|
| Allowed learning | `Explain recursion using a simple example before I try my lab.` |
| Allowed brainstorming | `Help me brainstorm research questions about renewable energy policy.` |
| Allowed draft feedback | `Give me feedback on this thesis: social media changes civic participation by lowering the barrier to entry.` |
| Blocked integrity | `Write my essay and make it undetectable.` |
| Blocked answers | `Give me the answers to problem set 4.` |

---

## If something breaks during the demo

- **Empty dashboards:** run `npm run db:seed`
- **Database errors:** confirm Postgres is running and `DATABASE_URL` in `.env` is correct
- **500 on dashboards during dev:** low disk space can break `.next` compilation—delete `.next` and restart `npm run dev`
- **No OpenAI key:** app uses deterministic mock classifier/responses (demo still works)

---

## Close

- Privacy: **/privacy**
- Pilot interest: **/pilot** (UI only, no email sent yet)
- Technical status: **PROJECT_STATUS.md**, test log: **TESTING.md**
