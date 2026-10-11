# Plannlyai — Implementation Plan

> Companion to `Docxs/Plannly-Product Requirements Document (PRD).md`.
> Status (2026-10-11): Phases 0–7 BUILT and verified on local device. Stack: Next.js 15 + local Postgres 18 + Better Auth + local disk + free-only AI (offline/Ollama).

Core promise: **Tell us what you want. We'll help you figure out what's next — and help you follow through.**
Loop: `Goal → Breakdown → Action → Reminder → Completion → Progress → Adaptation`

---

## 0. Guiding Constraints (from PRD + Appendix 2026-09-27)

1. **Do organizational thinking for the user**, don't create org work.
2. **Forward-only actions**: Complete / Break down / Start. No quiet "defer / Not today" one-tap drop. Replan goes via Assistant.
3. **Visibility mandatory**: daily progress status bar everywhere + goals-at-a-glance dashboard (anti "out of sight, out of mind").
4. **Automation explicit**: calendar, reminders, email must show their source (template / voice / user input). User stays in control of send.
5. **Tone**: calm, encouraging, non-judgmental. No guilt, no bossy, no hype.
6. **Editor-agnostic**, local-first. No Cursor/VSCode lock-in.

Non-goals: complex PM tool, generic chatbot, basic todo, calendar replacement, dense dashboard, rigid methodology.

### 0.1 Free-only policy (owner requirement)
**Rule: $0 to build and run v1. No paid API is required. Anything with no free path is out; anything paid-only gets a free-tier alternative.**

| Need | Free default (ship this) | Free-tier cloud alt (optional) | Banned (paid-only) |
|---|---|---|---|
| AI breakdown/draft | Ollama local (Llama 3.1 8B / Mistral / Phi-3) + rule-based offline fallback — $0, private | Gemini via Google AI Studio (free quota), Groq free tier, HF Inference free tier, OpenRouter free models | OpenAI / Claude paid keys as requirement |
| Email send (magic-link + drafts) | Dev: console log + Ethereal (free). Prod-local: Gmail SMTP free (~500/day) via Nodemailer | Resend free tier (100/day), Brevo free tier (300/day) | Paid-only SMTP / SES as requirement |
| File storage | Local disk `./storage/uploads` — $0 (default v1) | Cloudflare R2 free tier (~10 GB, free egress quota) when you outgrow disk | Supabase Storage / paid buckets as requirement |
| Auth | Better Auth self-hosted + Postgres — $0 | — | Auth0 paid / Clerk paid tiers as requirement |
| DB / hosting / jobs | Local Postgres (Docker) + `next start` + `node-cron` — $0 | — | Vercel / Supabase / hosted Postgres fees |
| Analytics | Local `events` table in Postgres — $0 | PostHog free tier / Plausible self-host (stretch) | Paid analytics as requirement |

- `lib/ai.ts` stays provider-agnostic with `AI_PROVIDER=ollama|gemini|groq|hf|openrouter|offline`. Ship `offline` + `ollama` first; cloud keys are optional envs, never required to boot.
- No key → app still runs (offline templates + local everything). Every paid integration must degrade gracefully with a banner, never a crash.

---

## 1. Design System — Phase D (build first, before features)

### 1.1 Principles (ADHD-friendly)
- Clarity over density: max 3 priorities in Today, progressive disclosure for rest.
- Every action shows context: `Why this? → Contributes to? → What's next?`
- One obvious next step per screen. Large tap targets (≥44px), generous whitespace.
- Reduce motion default, respect `prefers-reduced-motion`. Never punish missed tasks.

### 1.2 Tokens
- **Color**: calm neutrals + 1 accent (teal/green for progress) + 1 warm accent (for focus). Semantic: `bg / surface / text / muted / border / primary / success / warning / danger`. Dark-mode ready via CSS vars. Contrast ≥4.5:1 for text.
- **Typography**: system stack or Inter. Scale: 12 / 14 / 16 / 20 / 24 / 32. Line-height 1.5 for body. Task titles 16 medium, goal titles 20 semibold.
- **Spacing / radius**: 4pt grid (4,8,12,16,24,32). Radius 8 cards, 12 sheets, 999 pills. Shadows minimal (1 level).
- **Motion**: 150–200ms ease-out only for progress + sheet open. No streak animations that induce guilt.

### 1.3 Core components (build in Storybook-style `/design` page first)
1. `Button` — variants: `primary (Complete/Start)`, `secondary (Break down)`, `ghost`. No `defer` variant. Loading + disabled states.
2. `ProgressBar` — daily status bar (e.g. "2 of 4 done") + goal progress (week/month/overall). Determinate only, with text label.
3. `GoalCard` — goal title, target date, overall %, next action, "why it matters" line.
4. `TodayList` — sections: Priorities (≤3) / Quick wins / Scheduled / Done. Each row: checkbox, title, goal-link chip, time estimate, break-down affordance.
5. `TaskRow` — supports subtask expansion, "Make smaller" button, estimate, reminder dot.
6. `DashboardWidgets` — Goals-at-a-glance, Today's focus summary, Upcoming (deadlines/events), Progress spark.
7. `AssistantPanel` — thread, suggestion chips ("Break this down", "I fell behind", "Rework today"), plan-diff preview (before/after).
8. `AutomationBadge` — shows source: `📋 Template · ✉️ Voice · ⌨️ Your input` + "View / Edit / Undo".
9. `EmptyState` / `RecoveryCard` — "Let's figure out what's next" copy, never "You missed 3".
10. `Form` primitives — Goal input (natural language + clarifying Qs), date picker, duration picker.

### 1.4 App IA / routes
```
/today          Today's focus + daily progress bar (default /)
/dashboard      Goals-at-a-glance + upcoming + progress
/goals          List + detail /goals/[id] (milestones → monthly → weekly → daily tree)
/tasks          All actionable steps (filterable, but Today stays curated)
/calendar       Events + deadlines + proposed slots
/automations    Workflows + runs + email templates
/assistant      Full thread + quick actions
/settings/voice Voice profile + tone prefs
/design         Design-system showcase (dev only)
```

### 1.5 Copy guide
- Do: "Let's make it smaller. Next 5 min: …", "You did X — contributes to Y. Next: Z?"
- Don't: "You missed…", "You failed…", "Overdue!!!"
- Every reminder ends with an action: `[Do now] [Make smaller] [Ask assistant]`.

### 1.6 A11y + acceptance for Phase D
- Keyboard: tab through Today list, space completes, `b` breaks down.
- Screen reader labels on progress ("60 percent complete, 3 of 5 tasks").
- Lighthouse a11y ≥95, no layout shift on progress update.

---

## 2. Architecture Decisions

### ADR-1: Next.js App Router, self-hosted monolith (no Vercel)
- **Why**: single deploy, server actions + RSC for fast Today/Dashboard. Hosted on local device for now via `next build && next start` or Docker Compose (no Vercel).
- Structure:
```
app/(app)/today/page.tsx … dashboard, goals, tasks, calendar, automations, assistant
app/api/... (only where needed: ai/breakdown, reminders/run, email/draft, uploads/sign-url)
components/ui/*  components/goal/* components/today/* components/assistant/*
lib/db.ts lib/auth.ts lib/auth-client.ts lib/breakdown.ts lib/plan.ts lib/reminders.ts lib/email.ts lib/storage.ts
prisma/schema.prisma  docker-compose.yml (app + postgres)
```

### ADR-2: Local Postgres + Prisma (no Supabase, no SQLite)
- Local Postgres on this device (native install or `docker compose up postgres`). Prisma `datasource db { provider = "postgresql" }`, `DATABASE_URL=postgresql://plannly@localhost:5432/plannlyai`.
- No Supabase: no `supabase-js`, no Supabase Auth/Storage/DB. Postgres is accessed directly via Prisma.
- Migrations checked in (`prisma/migrations/`). Seed script with demo goal ("Launch coaching business"). Backup via `pg_dump` on a schedule.

### ADR-3: Better Auth (not Auth.js)
- Library: `better-auth` with Prisma adapter. Providers: email magic-link first (lowest friction for ADHD users) + Google OAuth second. `lib/auth.ts` (server) + `lib/auth-client.ts` (client). Session → `User.id` scoping on every query. Middleware protects `/(app)/*`.
- Env: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL=http://localhost:3000`, `GOOGLE_CLIENT_ID/SECRET`, `DATABASE_URL` shared with Prisma.

### ADR-4: AI behind an interface, free-only (Ollama default)
```ts
// lib/ai.ts
interface BreakdownInput { goalTitle: string; targetDate?: string; hoursPerWeek?: number; context?: string }
interface PlanNode { title: string; type: 'milestone'|'monthly'|'weekly'|'daily'|'tiny'; children?: PlanNode[]; estimateMin?: number }
generatePlan(input): Promise<PlanNode[]>  // deterministic fallback if AI down
simplifyTask(task): Promise<Task[]>        // "make smaller"
replan(tasks, constraint): Promise<Task[]> // "only 20 min today", "fell behind"
draftEmail(context, voice): Promise<{subject, body, templateUsed}>
```
- Default `AI_PROVIDER=offline` (rule templates, $0) → then `ollama` (e.g. `llama3.1:8b`, `mistral`, `phi3` — all free, local, private). Optional free-tier cloud: `gemini` (Google AI Studio free quota), `groq` free tier, `hf` (Hugging Face Inference free), `openrouter` free models. All prompts versioned in `lib/prompts/`. Never auto-send email; always draft + human approve.
- No paid OpenAI/Anthropic key required. Missing key or Ollama down → offline fallback so MVP works with $0 and no network.

### ADR-5: Jobs on-device, no Vercel Cron (Phase 4+)
- Self-host: `node-cron` inside the Next.js server (or a small worker `npm run worker`) scanning due reminders + scheduled workflows. Alternative: OS Task Scheduler hitting `http://localhost:3000/api/reminders/run` with a shared `CRON_SECRET`.
- Idempotent `ReminderRun` table prevents double-nudge. Ignored reminders → suggest reschedule/breakdown, don't nag.

### ADR-6: Files free-first (local disk default, R2 free-tier optional)
- v1 default: local disk `./storage/uploads` ($0, no account). DB stores `fileKey` + mime. Serve via `/api/files/*` with auth check.
- Optional later: Cloudflare R2 free tier (~10 GB + free egress quota) via S3-compatible `lib/storage.ts` (`@aws-sdk/client-s3`). Same `fileKey` abstraction, backend switchable via `STORAGE_BACKEND=local|r2`. No Supabase Storage.
- Env (only needed if `r2`): `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`. App boots fine without them.

### Data model (Prisma sketch)
```
User { id, email, name, voiceProfile? }
VoiceProfile { id, userId, tone, formality, greeting, signoff, samples[], templates[] }
Goal { id, userId, title, outcome, targetDate, importance, status, progressCache }
Milestone { id, goalId, title, order, status }
MonthlyOutcome { id, milestoneId, title, month, status }
WeeklyObjective { id, monthlyId, title, weekStart, status }
DailyAction / Task { id, goalId, parentId?, title, type, status, estimateMin, dueAt, order, source }
Event { id, userId, title, startsAt, endsAt, source, goalId? }
Reminder { id, userId, taskId?, rule, nextRunAt, context, status }
EmailTemplate { id, userId, name, subject, body, voiceNotes }
Workflow { id, userId, name, steps(Json), schedule }
WorkflowRun { id, workflowId, ranAt, result }
AssistantThread { id, userId, goalId? } / Message { id, threadId, role, body, planDiff? }
```

### API surface (server actions preferred)
- `createGoal(input) → Goal + draft Plan` / `acceptPlan(goalId, edits)` / `listToday(userId, date)` / `completeTask(id)` / `breakDownTask(id)` / `replanDay(date, constraint)` / `recoverGoal(goalId)` / `proposeSlots(input)` / `draftEmail(input)` / `runWorkflow(id)`.
- Validation with `zod` on every input. All queries scoped `where: { userId: session.user.id }`.

---

## 3. Phased Build

### Phase 0 — Scaffolding (0.5–1 wk)
Goal: runnable skeleton on local device.
- Next.js TS + Tailwind + shadcn-style ui, ESLint/Prettier, Prisma + local Postgres (`docker compose up postgres` or native PG), Better Auth (Prisma adapter, magic-link + Google) with free Nodemailer transport (console/Ethereal dev, Gmail SMTP free prod-local), local-disk storage default (`./storage/uploads`), `/design` page, seed demo user+goal.
- `docker-compose.yml` (postgres volume + optional app + optional ollama service), `.env.example` (`DATABASE_URL`, `BETTER_AUTH_*`, `GOOGLE_*`, `SMTP_*`, `STORAGE_BACKEND=local`, `R2_*` optional, `AI_PROVIDER=offline|ollama`, `CRON_SECRET`).
- **Done when**: `npm run dev` → login via Better Auth → see empty Today/Dashboard shell against local Postgres. CI (lint+typecheck) green. No Supabase/Vercel dependencies in `package.json`.

### Phase 1 — Goal-to-Action MVP (1–2 wks) [PRD P1]
- Goal create (NL + clarifying Qs: when / hrs/wk / starting point) → `generatePlan` → plan-review UI (accept/edit/remove/reorder/change dates) → persist tree.
- Task `Break down` recursion to tiny step. Estimates default (15/25/50m).
- **Done when**: "Launch coaching biz by Dec" → milestones/monthly/weekly/daily/tiny visible; user can edit and accept. Offline fallback works.

### Phase 2 — Today + Dashboard + Progress (1 wk) [Appendix #2]
- `listToday`: top 3 priorities (due + goal weight + quick-win balance) + quick wins + scheduled + done. Daily `ProgressBar` sticky top on every app page.
- Dashboard: Goals-at-a-glance (≤6 active), What matters today, Coming up (7d), Progress visuals. Goal detail shows Today→Week→Month→Goal chain.
- Forward-only buttons only. No defer control ships.
- **Done when**: completing a task animates daily bar + goal %; active goals visible without navigation; a11y labels correct.

### Phase 3 — Assistant + Recovery (1 wk) [PRD P2]
- Thread UI + chips + slash intents (`/today /smaller /replan /recover /why`). `replan` returns diff preview → Apply/Undo. `recoverGoal`: review missed → keep/drop/reschedule → new next action. Tone guard (no guilt copy).
- **Done when**: "I fell behind" / "Only 20 min today" / "Why is this on my list?" all resolve to an applied plan change with audit trail.

### Phase 4 — Reminders + Scheduling (1 wk) [PRD P3 + Appendix #3]
- Contextual reminders ("You contacted 1 of 3 clients. Do next now?") with Do/Make-smaller/Ask actions. Follow-up reminders (`remind me in 3d`). Scheduling: NL → propose 3 slots → create event + invite. Upcoming surfaced in Today/Dashboard.
- **Done when**: reminder run creates nudge once, ignored ×3 suggests breakdown; event creation works end-to-end (local calendar first, Google Calendar OAuth stretch).

### Phase 5 — Personalized Email (1 wk) [PRD P4 + Appendix #3]
- Voice profile (tone/formality/greeting/signoff/samples) + templates (confirm/follow-up/check-in/thanks). `draftEmail` via free AI path (offline/Ollama, or Gemini/Groq free tier) shows `AutomationBadge` (which template+voice used). Human Send only via free transport (Gmail SMTP/Nodemailer, or Resend/Brevo free tier).
- **Done when**: draft "sounds like user" per seeded sample; template edit updates future drafts; no auto-send path exists in code.

### Phase 6 — Workflows + Automation visibility (1 wk) [PRD P5]
- NL → structured reusable workflow (e.g. Monday Reset: 7 steps from PRD) → run with checklist + log in Automations page. Goal templates (fitness/biz/finance/cert). Every auto artifact links to source.
- **Done when**: user saves, re-runs, edits a workflow; runs list shows source + undo.

### Phase 7 — Hardening + Launch (1 wk)
- Tests: Vitest (plan/replan/progress math) + Playwright (goal→today→complete→recover, reminder→do, email draft→send-gate). Empty/loading/error states, rate limits on AI, privacy (voice samples private by default), backups for `storage/`.
- Metrics events: goals created/active, daily completion %, recovery rate, reminder→complete, email assisted, overwhelm self-report. Local `events` table in Postgres (free, default). No paid analytics required.
- Docs: update README Getting Started, `.env.example`, seed + `pg_dump` backup + R2 notes. Deploy: self-hosted on local device — `npm run build && npm run start` (or `docker compose up --build`), LAN access via `http://<device-ip>:3000`, reminders via in-app `node-cron`/worker. No Vercel.
- **Done when**: clean `npm run build`, tests green, demo video script matches PRD §26 end-to-end.

---

## 4. Roadmap traceability

| PRD feature | Phase |
|---|---|
| Goal creation, breakdown, review, daily focus, simplify, progress, recovery | 1–3 |
| Daily progress bar, goals-at-a-glance dashboard | 2 |
| No-defer forward actions | 2 (enforced in UI + review) |
| Assistant NL + replan + accountability | 3 |
| Reminders, scheduling, follow-ups | 4 |
| Email voice/templates/drafts | 5 |
| Workflows, goal templates, automation badges | 6 |
| Metrics (§30), personality (§31) | 7 + continuous |

## 5. Risks
- AI over-planning → cap depth (≤3 milestones, ≤4 monthlies each), default estimates, "make smaller" instead of more tasks.
- Notification fatigue → max 3 nudges/task, then force replan prompt.
- Email tone miss → always show template source + Edit voice shortcut.
- Scope creep → Phase 1–2 frozen to P1; calendar OAuth + mobile push are stretch.

## 6. Next actions
- [ ] Approve stack + data model
- [ ] Build Phase D `/design` tokens + 10 components
- [ ] Scaffold Phase 0
- [ ] Seed demo goal for usability test with 3 users (1 ADHD)

---
*Generated from PRD v2026-09-27. Update this file when ADRs change.*
