# Plannlyai

> **Big goals. Small steps. Real progress.**

Plannlyai is a personal productivity and execution assistant that turns goals and intentions into small, actionable daily steps — while reducing the mental burden of planning, remembering, organizing, and following through.

Tell us what you want to accomplish. We'll help you figure out what needs to happen next — and help you follow through.

## Why Plannlyai

Most people don't struggle with knowing *what* they want. They struggle with the execution gap:

**Intention → Planning → Action → Follow-through → Completion**

Traditional tools make the user do most of the organizational thinking. Plannlyai does more of that thinking for you.

Designed for anyone who struggles with organization and follow-through, with particular consideration for ADHD and executive-function challenges. No diagnosis required.

Core loop:

```
Goal → Breakdown → Action → Reminder → Completion → Progress → Adaptation
```

## Features

### Priority 1 — Goal-to-Action System
- Natural-language goal creation ("I want to launch my coaching business this year")
- Automatic breakdown: Goal → Milestones → Monthly outcomes → Weekly objectives → Daily actions → Tiny next step
- Plan review & collaboration ("This is too much", "Break this down further")
- Today / Daily Focus view — "What do I actually need to focus on today?"
- Task simplification to make the next action obvious
- Progress visualization (Today → Week → Month → Goal)
- Goal recovery — restart without rebuilding from scratch

### Priority 2 — Personal Assistant
- Natural-language interaction: "What should I focus on today?", "I'm overwhelmed, help me decide first", "I fell behind, help me restart"
- Re-planning, recovery, and progress Q&A

### Priority 3 — Reminders & Scheduling
- Contextual, action-oriented reminders (not just "Task due today")
- Scheduling assistant + follow-up reminders
- Upcoming commitments surface

### Priority 4 — Personalized Communication
- Email assistant that learns your tone, formality, greetings, sign-offs, and templates
- Drafts that sound like you — you stay in control of send

### Priority 5 — Workflow Automation
- Plain-language repeatable workflows (e.g. "Monday Weekly Reset")
- Personal templates for emails, routines, and goals
- Calendar scheduling, reminder, and email automations — explicit and visible with their source (template / voice / input)

### Product Experience
- **Today:** priorities, quick wins, scheduled commitments, goal connection, daily progress status bar
- **Dashboard:** What am I working toward? What matters today? What is coming up? Am I making progress?
- Forward-only actions (complete, break down, start) — no quiet defer
- Calm, helpful, non-judgmental tone. Accountability without pressure.

See [`Docxs/Plannly-Product Requirements Document (PRD).md`](Docxs/Plannly-Product%20Requirements%20Document%20(PRD).md) for the full spec.

## Planned Stack

Editor-agnostic (no lock-in to Cursor / VS Code / OpenCode).

- **App:** Next.js (local-first)
- **DB / ORM:** SQLite + Prisma
- **Auth:** Auth.js
- **Storage:** local `./storage/`

> Status: PRD complete, implementation not yet started. Stack may evolve — this README will be updated when scaffolding lands.

## Getting Started

```bash
# 1. Clone
git clone https://github.com/Thagirlnextdoor/Plannlyai.git
cd Plannlyai

# 2. Install (once scaffolding lands)
npm install

# 3. Run
npm run dev
```

No setup steps yet — repo currently contains product spec only.

## Project Structure

```
Plannlyai/
├── README.md
└── Docxs/
    └── Plannly-Product Requirements Document (PRD).md
```

## Roadmap

- [ ] Phase 0–1: Scaffolding, Goal-to-Action MVP
- [ ] Phase 2: Today view + daily progress bar + goals-at-a-glance dashboard
- [ ] Phase 3: Assistant + recovery / re-plan
- [ ] Phase 4–6: Reminders, scheduling, email automations (explicit + visible)
- [ ] Phase 7: Polish, templates, workflows

## What Plannlyai Is Not

- Not a complicated project-management platform
- Not a generic AI chatbot
- Not a basic to-do list or calendar replacement
- Not a rigid productivity methodology
- Not a system that makes you maintain your own system

## Contributing

Issues and PRs welcome. Please keep the core principle in mind:

> Every small action should have context — why am I doing this, what does it contribute to, what comes next?

## License

TBD
