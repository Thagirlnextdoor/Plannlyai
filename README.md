# Plannlyai

> **Big goals. Small steps. Real progress.**

Plannlyai is a personal productivity and execution assistant that turns goals and intentions into small, actionable daily steps — while reducing the mental burden of planning, remembering, organizing, and following through.

Tell us what you want to accomplish. We'll help you figure out what needs to happen next — and help you follow through.

## Status

v1 built locally through Phase 7: Goal-to-Action, Today + Dashboard, Assistant, Reminders + Scheduling, Email voice/templates, Workflows. See [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md) and [`Docxs/Plannly-Product Requirements Document (PRD).md`](Docxs/Plannly-Product%20Requirements%20Document%20(PRD).md).

## Stack (all free, $0)

- **App:** Next.js 15 (App Router), self-hosted on this device — no Vercel
- **DB:** Local PostgreSQL 18 + Prisma — no Supabase
- **Auth:** Better Auth (email/password + optional Google)
- **Storage:** Local disk (`./storage/uploads`), R2 free-tier optional later
- **AI:** Free-only — offline templates + local Ollama first; Gemini/Groq/HF/OpenRouter free tiers optional. No paid keys required.

## Getting started (Windows)

```cmd
:: 1. Postgres 18 running on 5432 with database "plannlyai"
:: 2. Copy env and edit passwords
copy .env.example .env

:: 3. Install + set up DB
npm install
npx prisma db push
npm run db:seed

:: 4. Run
npm run dev
:: open http://localhost:3000/today
```

Optional: `set AI_PROVIDER=ollama` + install Ollama + `ollama pull llama3.1:8b` for local LLM plans.

## Scripts

| Command | What |
|---|---|
| `npm run dev` | Dev server (:3000) |
| `npm run build` / `npm run start` | Production build / serve on-device |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit tests (offline-safe) |
| `npm run worker` | Run due reminders once |
| `npx prisma db push` | Sync schema to local PG |
| `npm run db:seed` | Demo user + goal |

Reminders on a schedule (Task Scheduler, free):
`POST http://localhost:3000/api/reminders/run` with body `{ "secret": "<CRON_SECRET>" }`.

## Android APK (TWA) — free, no Play Store needed

Plannlyai ships as a **Trusted Web Activity**: the PWA wrapped in a thin, signed
Android app (`ai.plannlyai.twa`). The APK is ~1 MB because the app itself still
serves from the running Plannlyai instance.

```powershell
powershell -ExecutionPolicy Bypass -File scripts\build-apk.ps1
```

Output: `android\twa\app-release-signed.apk` (also copied to the Desktop as
`Plannlyai.apk`). Install it on a phone by copying the file over and opening it
(Android will ask permission to install from that source).

Requirements already set up on this machine — see the header of
`scripts\build-apk.ps1` for the full list and the pitfalls it works around:

- JDK 17 linked at `C:\Users\USER\jdk17` (Bubblewrap invokes `java.exe`
  unquoted, so the space in `Program Files` breaks signing).
- Android SDK at `%LOCALAPPDATA%\Android\Sdk` with a `bin\` shim.
- The keystore is **PKCS12**, so the store password and key password are the
  same value (`android\storepass.txt`, git-never-committed).

The APK is pinned to whatever HTTPS host is in `twa-manifest.json` — today that's
the Cloudflare quick tunnel. Restart the tunnel → new address → rerun the build
script (edit the host in `twa-manifest.json` first, then `node scripts\gen-twa.js`).
A named Cloudflare tunnel with your own domain removes that step.

`public/manifest.webmanifest` + `public/sw.js` + `public/icons/` are the PWA
layer underneath it: installable from a browser, offline-cached static assets,
and `/.well-known/assetlinks.json` proves to Android that the app and the site
are the same entity.

## Backup (free)

```cmd
"C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" -U postgres -h localhost plannlyai > backup-%date%.sql
xcopy storage backup-storage /E /I
```

## Project structure

```
app/            routes (today, dashboard, goals, tasks, calendar, automations, assistant, design, settings/voice)
components/     DailyBar, AppNav, shells, email composer
lib/            db, auth, session, ai, plan, today, assistant, reminders, schedule, email, workflows
prisma/         schema.prisma + seed.ts
worker/         reminders.ts (cron entry)
tests/          vitest suites
storage/uploads local file backend ($0)
```

## Contributing

Keep the core principle: *every small action should have context — why am I doing this, what does it contribute to, what comes next?* Forward-only actions (complete / break down / start) — no quiet defer. Calm, non-judgmental copy, no guilt.

## License

TBD
