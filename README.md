<div align="center">

# AI Journal

### An AI-powered personal journaling platform for text and voice

Write your day, speak it, or answer a few guided questions — AI Journal turns it into a
structured diary you actually want to reread. Private by design, self-hostable, and built
on a modern TypeScript stack.

[![License: Source-Available](https://img.shields.io/badge/license-Source--Available-blue.svg)](LICENSE)
[![Status: Architecture](https://img.shields.io/badge/status-architecture%20phase-orange.svg)](#-project-status)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![NestJS](https://img.shields.io/badge/NestJS-12.5-ea2845.svg)](https://nestjs.com)
[![Next.js](https://img.shields.io/badge/Next.js-16.4-000000.svg)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6.svg)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-00e599.svg)](https://neon.tech)

</div>

---

> ### 📌 Project Status
>
> **This repository is in the architecture and planning phase.** There is **no application code
> yet** — no installable build, no running demo, no screenshots. What exists today is a complete,
> reviewed specification: product plan, requirements, architecture, database schema, API contract,
> AI and voice design, a 109-task roadmap, and the repository scaffolding.
>
> Everything marked **Planned** below is specified and scheduled, **not implemented**. We will not
> claim otherwise until it runs.

---

## Table of Contents

- [Overview](#-overview)
- [The Problem](#-the-problem)
- [Key Features](#-key-features)
- [Screenshots & Previews](#-screenshots--previews)
- [Demo](#-demo)
- [Technology Stack](#-technology-stack)
- [System Architecture](#-system-architecture)
- [Project Structure](#-project-structure)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Development Setup](#-development-setup)
- [Database Configuration](#-database-configuration)
- [Authentication Configuration](#-authentication-configuration)
- [AI Provider Configuration](#-ai-provider-configuration)
- [Voice Journaling Setup](#-voice-journaling-setup)
- [Usage](#-usage)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Security](#-security)
- [Reporting Issues](#-reporting-issues)
- [Acknowledgments](#-acknowledgments)
- [Contact](#-contact)

---

## ✨ Overview

**AI Journal** is a personal journaling and diary application that removes the two biggest
reasons people stop journaling: *not knowing what to write* and *not having the time to write it*.

You can journal three ways:

| Mode | What happens |
|---|---|
| **Write** | A comfortable long-form editor for your daily story, in English, Urdu, Hindi or any language |
| **Speak** | Record your day out loud; it is transcribed, then organised into a structured entry |
| **Reflect** | Twelve guided daily questions plus your own custom prompts |

Around that core sits an interactive calendar, mood tracking, searchable history, personal
insights, and an AI assistant that **organises without inventing** — it never overwrites your own
words, and nothing it produces becomes your entry until you approve it.

The project is built as a **production-grade monorepo**: a NestJS API, a Next.js server-rendered
web app, shared TypeScript contracts, and a Drizzle-managed PostgreSQL schema on Neon.

**Keywords:** AI journal · AI diary · personal journal application · voice journaling · AI writing
assistant · mood tracker · digital diary · journaling web app.

---

## 🎯 The Problem

Journaling is one of the most consistently recommended habits for clarity, memory and mental
health — and one of the most consistently abandoned.

| Barrier | What people actually experience |
|---|---|
| **Blank page** | "I don't know what to write about today." |
| **Time** | Writing a meaningful entry takes 15–30 minutes. |
| **Structure** | Stream-of-consciousness notes are hard to reread later. |
| **Retrieval** | Months of entries become an unsearchable pile. |
| **Trust** | Diary apps that sync to someone else's cloud feel unsafe for private thoughts. |

Existing tools solve one of these at a time: notes apps have no reflection structure, AI chat apps
have no memory or calendar, and "diary" apps often stop at a text box.

**AI Journal addresses all five in one product:** guided prompts remove the blank page, voice
removes the time cost, AI structuring makes entries readable, calendar + search + insights make
them retrievable, and per-user isolation with self-hosting keeps them private.

---

## 🚀 Key Features

> Status legend: **Planned** = specified and scheduled in the roadmap · **In progress** · **Done**

### Core journaling

| # | Feature | Description | Status |
|---|---|---|---|
| 1 | **Daily story editor** | Long-form writing with autosave, drafts, RTL and mixed-language support | Planned |
| 2 | **Multiple entries per day** | More than one entry for a date, not a single forced record | Planned |
| 3 | **Guided daily questions** | 12 seeded reflection prompts, skippable, with progress | Planned |
| 4 | **Custom questions** | Add your own prompts, reusable across dates | Planned |
| 5 | **Interactive calendar** | Month view with entry, draft and mood indicators; history navigation | Planned |
| 6 | **Mood tracker** | 10 emotional states with optional notes and history | Planned |
| 7 | **Journal history** | Browse, full-text search, filter by mood/date/status, edit, soft-delete | Planned |
| 8 | **Personal insights** | Streaks, weekly/monthly activity, mood distribution — from real data only | Planned |

### AI-powered

| # | Feature | Description | Status |
|---|---|---|---|
| 9 | **AI journal structuring** | Raw thoughts → Overview, Activities, Achievements, Challenges, Lessons, Reflections, Tomorrow's Goals | Planned |
| 10 | **Mandatory review step** | AI output is a draft; it never replaces your text without explicit approval | Planned |
| 11 | **Multilingual + translation** | Preserves your language; translation is an explicit, additive option | Planned |
| 12 | **Writing-style preservation** | Output keeps your tone instead of rewriting you into corporate prose | Planned |
| 13 | **Provider-agnostic** | Any OpenAI-compatible LLM endpoint, chosen by environment | Planned |

### Voice

| # | Feature | Description | Status |
|---|---|---|---|
| 14 | **Voice journaling** | Speak your day; transcript is editable before generation | Planned |
| 15 | **Live waveform** | Real microphone amplitude, not a decorative animation | Planned |
| 16 | **Language selection** | English, Urdu, Hindi and more, with correct text direction | Planned |
| 17 | **Graceful fallbacks** | Denied permission or unsupported browser → clear guidance, not a dead button | Planned |

### Platform

| # | Feature | Description | Status |
|---|---|---|---|
| 18 | **Custom authentication UI** | Better Auth under the hood, fully self-designed screens | Planned |
| 19 | **Strict per-user isolation** | Every query is ownership-scoped; foreign IDs return 404 | Planned |
| 20 | **Opt-in reminders** | Daily nudge at your local time; never sent without consent | Planned |
| 21 | **Account & data control** | Profile, preferences, password change, data export, account deletion | Planned |

### Post-core extensions

| # | Feature | Description | Status |
|---|---|---|---|
| 22 | **Life timeline** | Chronological view of your entire journal | Planned |
| 23 | **AI personal reflection** | Recurring themes and lessons across a date range | Planned |
| 24 | **Memories & attachments** | Photos and documents attached to a date | Planned |
| 25 | **Talk to your journal** | Ask questions answered from your own entries, with citations | Planned |

---

## 🖼 Screenshots & Previews

**No screenshots exist yet.** The interface has not been built, and generated mockups would
misrepresent the project. This section will be filled with real captures as each surface lands.

| Surface | Preview | Available |
|---|---|---|
| Landing page | *— pending implementation* | Phase 3 |
| Dashboard | *— pending implementation* | Phase 5 |
| Interactive calendar | *— pending implementation* | Phase 6 |
| Journal editor | *— pending implementation* | Phase 7 |
| Voice recording UI | *— pending implementation* | Phase 9 |
| AI review screen | *— pending implementation* | Phase 8 |
| Insights & charts | *— pending implementation* | Phase 11 |

Until then, the design and interaction system is specified in
[`docs/UI_UX_GUIDELINES.md`](docs/UI_UX_GUIDELINES.md).

---

## 🎬 Demo

**There is no live demo.** Nothing has been deployed, and this README will not claim a deployment
status it does not have.

When Phase 15 (deployment) is complete, this section will link a hosted instance and a 60-second
walkthrough. Local usage instructions will appear in [Usage](#-usage) at the same time.

---

## 🧰 Technology Stack

Every version below was verified against the npm registry on **2026-11-16** — see
[`docs/TECH_STACK.md`](docs/TECH_STACK.md) for the evidence and constraints.

| Layer | Technology | Version |
|---|---|---|
| API framework | [NestJS](https://nestjs.com) | 12.5.0 |
| Server-rendered web | [Next.js](https://nextjs.org) (App Router) + React | 16.4.6 / 19.3.1 |
| Language | TypeScript | 6.0.3 |
| Styling | Tailwind CSS | 4.3.5 |
| Animation | Framer Motion | 14.14.0 |
| Icons | Lucide (`lucide-react`) | 1.73.0 |
| Authentication | [Better Auth](https://better-auth.com) | 1.7.25 |
| Database | [Neon](https://neon.tech) PostgreSQL | serverless |
| ORM / migrations | Drizzle ORM + drizzle-kit | 0.45.4 |
| AI | Configurable OpenAI-compatible provider | env-selected |
| Speech-to-text | Browser Speech Recognition (+ optional server fallback) | — |
| Monorepo | pnpm workspaces + Turborepo | 12.21 / 2.11 |
| CI | GitHub Actions | — |

**Runtime requirement:** Node.js **≥ 20.9.0**.

---

## 🏗 System Architecture

Two deployable applications, one public origin, one shared contract.

```text
                ┌───────────────────────────────┐
                │           Browser             │
                └───────────────┬───────────────┘
                                │ HTTPS · one origin
                                ▼
        ┌───────────────────────────────────────────────┐
        │  apps/web — Next.js 16 (SSR / RSC)            │
        │  Landing · Auth UI · Dashboard · Editor ·     │
        │  Calendar · Voice · Insights  →  all HTML     │
        └───────────────────────┬───────────────────────┘
                                │ /api/* proxied + session cookie forwarded
                                ▼
        ┌───────────────────────────────────────────────┐
        │  apps/api — NestJS 12 (application core)      │
        │  guards · validation · modules · services ·   │
        │  repositories · Better Auth handler           │
        └──────────────┬─────────────────┬──────────────┘
                       │                 │
                       ▼                 ▼
          ┌────────────────────┐  ┌──────────────────┐
          │ Neon PostgreSQL    │  │ LLM provider     │
          │ packages/database  │  │ integrations/llm │
          └────────────────────┘  └──────────────────┘
```

**Why two apps?** NestJS is a backend framework — it provides no browser rendering or client
routing. Next.js supplies SSR, streaming, routing and hydration; the API owns every business rule.
The frontend comparison and rationale are in [`docs/TECH_STACK.md`](docs/TECH_STACK.md) §4.

**Trust boundary:** the browser is untrusted. Route protection exists twice — middleware in the
web app for UX, guards plus `user_id`-scoped queries in the API for security.

**One origin:** `/api/*` is proxied to the API so the session cookie stays first-party and
Better Auth's CSRF origin checks hold. Server components forward the incoming cookie; no session
is ever shared between users.

Full design: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## 📁 Project Structure

```text
ai-journal-platform/
├── apps/
│   ├── api/                    NestJS 12 — auth, domain modules, AI, voice
│   │   ├── src/
│   │   │   ├── common/         filters, guards, interceptors, pipes, decorators
│   │   │   ├── config/         typed environment schema
│   │   │   ├── modules/        auth · users · journals · calendar · moods ·
│   │   │   │                   questions · voice · ai · insights · reminders · health
│   │   │   ├── integrations/   llm · stt · storage · notifications
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   └── test/               API integration tests
│   │
│   └── web/                    Next.js 16 — SSR and all UI
│       ├── public/             images · icons · assets
│       └── src/
│           ├── app/            (marketing) · (auth) · (app) route groups
│           ├── components/     design-system primitives
│           ├── features/       journal · calendar · voice · ai · insights · settings
│           ├── layouts/        shells
│           ├── hooks/          cross-feature hooks
│           ├── lib/            API client, session helpers
│           ├── animations/     Framer Motion variants
│           ├── providers/      query cache · toast · theme
│           └── styles/         tokens, globals, fonts
│
├── packages/
│   ├── shared/                 types · constants · validation schemas
│   ├── database/               Drizzle schema · migrations · seeds · client
│   └── config/                 eslint · typescript · tailwind presets
│
├── docs/                       specification (12 documents)
├── reports/                    progress · testing · bugs · reviews · implementation
├── scripts/                    automation
├── tests/e2e/                  Playwright browser tests
│
├── .github/                    issue/PR templates, workflows, release config
├── .env.example                environment contract (no secrets)
├── CHANGELOG.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── SECURITY.md
├── LICENSE
└── README.md
```

Empty source directories hold `.gitkeep` placeholders — the architecture is real even before the
code lands.

---

## 📦 Installation

> ⚠️ **Not available yet.** There is no `package.json`, no lockfile and no build. The commands
> below are the **planned** workflow and will start working at Phase 0. They are listed now so
> contributors can see the intended shape; they are not runnable today.

**Prerequisites (planned)**

| Requirement | Version |
|---|---|
| Node.js | ≥ 20.9.0 |
| pnpm | ≥ 12 |
| PostgreSQL | Neon account, or any Postgres 16+ |
| Git | ≥ 2.40 |

**Planned steps**

```bash
# 1. Clone
git clone https://github.com/muhammadsami987123/ai-journal-platform.git
cd ai-journal-platform

# 2. Install workspace dependencies (one lockfile at root)
pnpm install

# 3. Configure environment
cp .env.example .env
# then edit .env — see Environment Variables below

# 4. Apply database migrations
pnpm db:migrate

# 5. Seed development data (12 guided questions)
pnpm db:seed

# 6. Start both apps
pnpm dev
#   web  → http://localhost:3000
#   api  → http://localhost:3001
```

---

## 🔐 Environment Variables

All configuration is environment-based. **No secret is ever committed.** The authoritative list is
[`.env.example`](.env.example); the table below explains each group.

| Variable | Required | Server-only | Purpose |
|---|---|---|---|
| `NODE_ENV` | yes | — | Runtime mode |
| `APP_URL` | yes | no | Public origin — cookies, CSRF, Better Auth URL |
| `API_INTERNAL_URL` | yes | **yes** | Server-to-server API address; never sent to the browser |
| `NEXT_PUBLIC_API_BASE_URL` | yes | no | Browser API base (`/api`, relative by design) |
| `WEB_PORT` / `API_PORT` | dev only | — | Local ports |
| `DATABASE_URL` | yes | **yes** | Pooled Neon connection (runtime) |
| `DATABASE_URL_DIRECT` | yes | **yes** | Direct connection (migrations only) |
| `BETTER_AUTH_SECRET` | yes | **yes** | Session signing secret |
| `BETTER_AUTH_URL` | yes | no | Must equal `APP_URL` |
| `BETTER_AUTH_TRUSTED_ORIGINS` | yes | **yes** | CSRF origin allowlist |
| `LLM_PROVIDER` | yes | **yes** | Provider adapter name |
| `LLM_BASE_URL` | yes | **yes** | API endpoint |
| `LLM_API_KEY` | yes | **yes** | Provider key — server only |
| `LLM_MODEL` | yes | **yes** | Model identifier |
| `LLM_MAX_INPUT_TOKENS` / `LLM_TIMEOUT_MS` | no | **yes** | Cost and timeout ceilings |
| `PROMPT_VERSION` | no | **yes** | Stamped on every AI generation |
| `STT_PROVIDER` / `STT_API_KEY` | no | **yes** | Optional server speech-to-text fallback |
| `BLOB_STORAGE_*` | no | **yes** | Attachment storage (post-core phase) |
| `CRON_SECRET` | no | **yes** | Reminder dispatch authentication |
| `LOG_LEVEL`, `SENTRY_DSN` | no | **yes** | Observability |

**Rules**
1. `API_INTERNAL_URL` and every `*_KEY`/`*_SECRET` stay server-side, permanently.
2. Only `NEXT_PUBLIC_*` values may reach the browser bundle.
3. `.env` is git-ignored; `.env.example` is committed with placeholders only.

---

## 🛠 Development Setup

> ⚠️ Planned — becomes available at Phase 0 (monorepo foundation).

| Command | Purpose |
|---|---|
| `pnpm dev` | Run web + API together with the `/api` proxy |
| `pnpm build` | Build both applications |
| `pnpm lint` | ESLint across the workspace |
| `pnpm typecheck` | TypeScript across the workspace |
| `pnpm test` | Unit tests |
| `pnpm test:e2e` | Playwright browser tests |
| `pnpm db:generate` | Generate a migration from schema changes |
| `pnpm db:migrate` | Apply pending migrations |
| `pnpm db:seed` | Seed development data |

**Working conventions** — see [`docs/DEVELOPMENT_GUIDELINES.md`](docs/DEVELOPMENT_GUIDELINES.md):
strict TypeScript, no `any`, one API client, colocated unit tests, conventional commits, and
quality gates before merge.

---

## 🗄 Database Configuration

**Engine:** Neon PostgreSQL (serverless). Any PostgreSQL 16+ instance works for local development.

**Planned setup**

1. Create a Neon project and copy both connection strings:
   - **Pooled** → `DATABASE_URL` (runtime queries)
   - **Direct** → `DATABASE_URL_DIRECT` (migrations only)
2. Run `pnpm db:migrate`.
3. Run `pnpm db:seed` in development to insert the 12 default reflection questions.

**Schema** — documented entity-by-entity in [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md):

`user`, `session`, `account`, `verification` (Better Auth, generated) ·
`profiles` · `entries` · `questions` · `answers` · `moods` · `transcriptions` ·
`ai_generations` · `preferences` · `reminders` · post-core: `attachments`,
`journal_chats`, `journal_chat_messages`, `reflections`.

**Design rules**
- Every user-owned table carries `user_id`; deleting a user cascades.
- The user's original text and every transcript are **write-once**.
- AI output is append-only and separate from the approved entry.
- Multiple entries per date are allowed — there is intentionally **no** unique constraint on
  `(user_id, entry_date)`.
- Multi-table writes use a transaction-capable connection (the Neon HTTP driver cannot hold one).

---

## 🔑 Authentication Configuration

**Planned:** Better Auth 1.7.25 mounted inside the NestJS API at `/api/auth/*`, via
`@thallesp/nestjs-better-auth` 2.8.0 (peer-verified for Nest 12).

| Concern | Decision |
|---|---|
| Session | httpOnly, `SameSite=Lax`, `Secure` in production |
| UI | Fully custom forms — no provider popups, no external-looking screens |
| Password storage | Better Auth only; never custom, never plaintext |
| Schema | Generated by the Better Auth CLI, not hand-written |
| Route protection | Next middleware (UX) + Nest `AuthGuard` (security) |
| Isolation | Every repository query scoped by `user_id`; foreign IDs return `404` |

**To configure:** set `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (must equal `APP_URL`), and
`BETTER_AUTH_TRUSTED_ORIGINS`, then generate and apply the auth schema.

---

## 🤖 AI Provider Configuration

AI Journal is **provider-agnostic**. Any OpenAI-compatible endpoint works; no vendor lock-in exists
in the application code.

**To configure:** set `LLM_PROVIDER`, `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`, and optionally
`LLM_MAX_INPUT_TOKENS`, `LLM_TIMEOUT_MS`, `PROMPT_VERSION`.

**Output contract** — the model must return strict JSON, validated before anything is stored:

```json
{
  "overview": "string",
  "activities": ["string"],
  "achievements": ["string"],
  "challenges": ["string"],
  "lessons": ["string"],
  "reflections": ["string"],
  "tomorrow_goals": ["string"],
  "language": "en"
}
```

**Guarantees the design enforces**
1. AI never modifies your original text.
2. Every generation is appended as a new version; nothing is overwritten.
3. Nothing becomes your entry until **you** approve it.
4. The model may not invent events, people or feelings; an empty section is returned instead.
5. Your keys never reach the browser.

Details and prompt rules: [`docs/AI_INTEGRATION.md`](docs/AI_INTEGRATION.md).

---

## 🎙 Voice Journaling Setup

**Planned workflow**

```text
select date → press mic → speak → transcript → edit → AI structure → review → approve → saved
```

| Piece | Approach |
|---|---|
| Capture | Browser microphone, requested only on explicit action |
| Recognition | Browser Speech Recognition (Chrome / Edge primary) |
| Fallback | Optional server STT provider when the browser is unsupported |
| Languages | English, Urdu, Hindi, extensible; RTL handled |
| Waveform | Real Web Audio amplitude, reduced-motion aware |
| Privacy | Audio is not retained in v1; transcripts are personal data and never logged |

**Browser support** is detected at runtime, never assumed. Unsupported and permission-denied
states are designed screens with a typing fallback — never a dead button.

Details: [`docs/VOICE_JOURNAL.md`](docs/VOICE_JOURNAL.md).

---

## 📖 Usage

> Planned. This section will contain a real walkthrough (with real screenshots) once the
> corresponding phases ship. It is **not** a description of working software today.

**Intended flow**

1. **Register** → land on your private dashboard.
2. **Pick a date** on the calendar — today, or any day you want to backfill.
3. **Write your story** in the editor, or answer a few guided questions, or press the mic and talk.
4. **Record your mood** — one of ten states, with an optional note.
5. **Ask AI to structure it** — review the draft side by side with your original.
6. **Approve** → your final entry is saved. Your original words are preserved exactly.
7. **Come back later** — search, filter, revisit the calendar, and watch your streak grow.

---

## 🗺 Roadmap

Phased delivery, defined in [`docs/TASKS.md`](docs/TASKS.md) (109 tasks with acceptance criteria).
A task is only done when it passes against a real database with two separate accounts.

| Phase | Scope | Status |
|---|---|---|
| **0** | Monorepo foundation, tooling, CI, environments | Planned |
| **1** | Database schema, migrations, repositories, seeds | Planned |
| **2** | Authentication, custom UI, guards, session topology | Planned |
| **3** | Landing page (3D hero, motion, previews) | Planned |
| **4** | App shell, layouts, routing, state providers | Planned |
| **5** | Dashboard | Planned |
| **6** | Interactive calendar | Planned |
| **7** | Journal writing system (story, questions, mood) | Planned |
| **8** | AI integration and review flow | Planned |
| **9** | Voice journaling | Planned |
| **10** | Journal history and search | Planned |
| **11** | Insights and statistics | Planned |
| **12** | Settings, profile, reminders | Planned |
| **13** | Post-core: timeline, reflection, memories, talk-to-journal | Planned |
| **14** | Security and privacy hardening | Planned |
| **15** | QA, performance, deployment | Planned |

**Versioning:** [Semantic Versioning](https://semver.org). The first planned release is
**`v0.1.0`**, and it will only be tagged when the core journaling loop is implemented and tested.
See [`docs/RELEASING.md`](docs/RELEASING.md) and [`CHANGELOG.md`](CHANGELOG.md).

---

## 🤝 Contributing

Contributions are welcome — especially during the architecture phase, where design feedback is
more valuable than code.

**Ways to contribute**

| Type | Where |
|---|---|
| Bug report | [Open a bug report](https://github.com/muhammadsami987123/ai-journal-platform/issues/new?template=bug_report.yml) |
| Feature request | [Open a feature request](https://github.com/muhammadsami987123/ai-journal-platform/issues/new?template=feature_request.yml) |
| General improvement | [Open an improvement issue](https://github.com/muhammadsami987123/ai-journal-platform/issues/new?template=improvement.yml) |
| Discussion | [Start a discussion](https://github.com/muhammadsami987123/ai-journal-platform/discussions) |
| Code / docs | Pull request against `main` after opening an issue |

**Before you start**
1. Read [`CONTRIBUTING.md`](CONTRIBUTING.md) — conventions, commit format, quality gates.
2. Read [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).
3. Check [`docs/TASKS.md`](docs/TASKS.md) for the phase that is currently open.
4. For anything larger than a typo, open an issue first so we agree on the approach.

**Contribution terms:** by submitting a contribution you agree it may be used and relicensed as
part of the project under its license (see `LICENSE` §5). You keep credit for your work; the
project keeps the right to ship it.

---

## ⚖️ License

**AI Journal is source-available, not open source.**

It uses the **AI Journal Source-Available License 1.0** (`LicenseRef-AIJournal-SAL-1.0`) — a
custom license written for this project. Full text: [`LICENSE`](LICENSE).

| You may | You may not |
|---|---|
| ✅ Read and study the source | ❌ Use it commercially or to earn money |
| ✅ Run it for personal journaling | ❌ Publish, share or redistribute it |
| ✅ Modify it for your own local use | ❌ Claim you created it |
| ✅ Learn from how it works | ❌ Remove or hide the copyright/attribution |
| ✅ Submit improvements upstream | ❌ Rebrand it and present it as your own product |

**Why not MIT / Apache-2.0 / GPL-3.0?** Those licenses permit commercial use and rebranding, which
this project intentionally does not. Because of that, the project cannot call itself OSI
open source — the Open Source Definition forbids field-of-use restrictions. The reasoning is
recorded in [`reports/implementation/github-repository-setup-report.md`](reports/implementation/github-repository-setup-report.md).

**Commercial licensing:** available under a separate written agreement — see `LICENSE` §11.

Copyright © 2026 **Muhammad Sami Asghar Mughal**. All rights reserved.

---

## 🛡 Security

Journal entries are among the most private data a person produces. This project treats them that
way:

- Server-side authorization on every read and write; the client is untrusted.
- Ownership-scoped queries; foreign IDs return `404`, never `403`.
- Secrets server-only; `.env` never committed; the web bundle is checked for leakage.
- Journal text, transcripts and credentials are never written to logs.
- Rate limits on auth, AI, voice and search endpoints.
- AI keys never leave the API process.

**Please do not open a public issue for a vulnerability.** Report it privately as described in
[`SECURITY.md`](SECURITY.md). Security reports are treated as the highest severity by default.

---

## 🐞 Reporting Issues

Before opening an issue:

1. **Search existing issues** — someone may have reported it.
2. **Check the docs** — many behaviours are specified in [`docs/`](docs/README.md).
3. **Use the right template** — bug report, feature request, or general improvement.
4. **Include environment details** — OS, Node version, browser, and commit SHA.
5. **Redact private content** — never paste real journal entries, transcripts or credentials.

Note that during the architecture phase, "it does not run" is expected: there is no application
code yet. Issues about the *specification* are genuinely useful right now.

---

## 🙏 Acknowledgments

This project stands on excellent open-source work:

- [NestJS](https://nestjs.com) — the API framework
- [Next.js](https://nextjs.org) and [React](https://react.dev) — server-rendered UI
- [Better Auth](https://better-auth.com) — authentication
- [`@thallesp/nestjs-better-auth`](https://github.com/thallesp/nestjs-better-auth) — NestJS integration for Better Auth
- [Drizzle ORM](https://orm.drizzle.team) and [Neon](https://neon.tech) — data layer
- [Tailwind CSS](https://tailwindcss.com), [Framer Motion](https://motion.dev), [Lucide](https://lucide.dev) — design and motion
- [Keep a Changelog](https://keepachangelog.com) and [Semantic Versioning](https://semver.org) — release conventions
- [Shields.io](https://shields.io) — badges

And to everyone who has written about journaling as a practice: the product exists because the
habit is worth keeping.

---

## 📬 Contact

| Channel | Link |
|---|---|
| **Author** | Muhammad Sami (Muhammad Sami Asghar Mughal) |
| **Repository** | https://github.com/muhammadsami987123/ai-journal-platform |
| **Issues** | https://github.com/muhammadsami987123/ai-journal-platform/issues |
| **Discussions** | https://github.com/muhammadsami987123/ai-journal-platform/discussions |
| **GitHub** | [@muhammadsami987123](https://github.com/muhammadsami987123) |
| **LinkedIn** | [muhammad-sami-3aa6102b8](https://www.linkedin.com/in/muhammad-sami-3aa6102b8/) |
| **X / Twitter** | [@MSAMIWASEEM1](https://x.com/MSAMIWASEEM1) |
| **Portfolio** | https://muhammad-sami.vercel.app |

**Project website:** none yet. A documentation site will be added after the first release; until
then this repository is the single source of truth.

---

<div align="center">

**[⬆ Back to top](#ai-journal)**

Built and specified by **Muhammad Sami** — a journaling habit worth keeping, made easier.

</div>
