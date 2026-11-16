# AI Journal — Task Breakdown (Execution Plan)

> Source of truth: [`PLAN.md`](PLAN.md) (requirements) + [`TECH_STACK.md`](TECH_STACK.md) (verified versions).
> **Architecture:** pnpm/Turborepo monorepo — `apps/api` (NestJS 12.5.0) + `apps/web` (Next.js 16.4.6), shared code in `packages/*`.
> Rule: a task is only `[x]` when its **Acceptance** criteria pass against the real Neon database with two separate accounts. No mock data, no dead buttons.

---

## Legend

| Symbol | Meaning |
|---|---|
| `MUST` | Required by plan.md core scope |
| `PLUS` | Life timeline, AI reflection, memories, talk-to-journal |
| `BLOCKER` | Must finish before dependent phases start |
| `STACK` | Introduced by the NestJS/Next.js migration |

---

## Phase 0 — Monorepo Foundation (BLOCKER)

- [ ] **T0.1 — Workspace bootstrap** `STACK`
  - pnpm workspaces (`pnpm-workspace.yaml`), Turborepo pipeline, root `package.json` with `dev`/`build`/`lint`/`typecheck`/`test`/`db:*` scripts.
  - Acceptance: `pnpm install` produces one lockfile at root; `pnpm -r build` resolves workspace links; no per-app lockfile exists.

- [ ] **T0.2 — Shared tooling presets** `STACK`
  - `packages/config`: ESLint flat config, `tsconfig` bases (strict, `noUncheckedIndexedAccess`), Tailwind preset, Prettier.
  - Acceptance: both apps extend the presets; a deliberately invalid file fails lint and typecheck in both.

- [ ] **T0.3 — Environment contract & validation** `MUST`
  - Root `.env.example`; typed env schema validated at API boot and at Next build (fail fast, not at first request). Server-only vs `NEXT_PUBLIC_*` split enforced.
  - Acceptance: missing `DATABASE_URL` stops the API with a readable error; `grep` of the web build finds no server secret.

- [ ] **T0.4 — Neon provisioning & DB package** `STACK`
  - `packages/database`: Drizzle client factory (pooled runtime URL + `pg` transaction path), `drizzle-kit` config pointing at the direct URL.
  - Acceptance: a `SELECT 1` health check passes through the package; the transaction path is exercised once; decision from `TECH_STACK.md` §6 recorded.

- [ ] **T0.5 — NestJS scaffold** `STACK`
  - `apps/api` with `main.ts`, `app.module.ts`, global `ValidationPipe`, exception filter, request-id interceptor, cookie parser, CORS locked to the public origin, global prefix `api` + versioning `v1`.
  - Acceptance: `GET /api/health` returns `{status, db}`; unknown route returns the standard error envelope; CORS rejects an unlisted origin.

- [ ] **T0.6 — Next.js scaffold** `STACK`
  - `apps/web` (App Router, TS, Tailwind 4) with route groups `(marketing)`, `(auth)`, `(app)`; `next.config` rewrite `/api/:path*` → API.
  - Acceptance: `/api/health` reachable through the web origin; no hydration warnings on a static page; `next build` passes.

- [ ] **T0.7 — Shared contract package** `STACK`
  - `packages/shared`: domain types, mood enum, default question list, limits, and validation schemas. Zero framework imports.
  - Acceptance: consumed by both apps; adding a field breaks typecheck in both until handled.

- [ ] **T0.8 — Design tokens & Tailwind config** `MUST`
  - Tokens from `UI_UX_GUIDELINES.md` as CSS variables + Tailwind theme; base components shell.
  - Acceptance: no hardcoded hex in components; token change propagates app-wide.

- [ ] **T0.9 — Multilingual typography** `MUST`
  - Font stack covering Latin, Arabic script (Urdu) and Devanagari; self-hosted via `next/font`; `dir` handling utilities.
  - Acceptance: Urdu sample renders RTL without overflow; mixed English/Urdu paragraph does not break layout; no FOIT.

- [ ] **T0.10 — Animation foundation** `STACK`
  - Adopt `framer-motion` 14.14.0 via `apps/web/src/animations` (variants only); reduced-motion guard.
  - Acceptance: a single shared variant module is used by two pages; `prefers-reduced-motion` disables transforms; no duplicate motion package installed.

- [ ] **T0.11 — Dev orchestration** `STACK`
  - One command starts both apps with the proxy working; ports and internal URLs documented.
  - Acceptance: from clean checkout, `pnpm dev` serves the web app on one origin with auth cookies working end-to-end.

- [ ] **T0.12 — CI pipeline** `STACK`
  - Typecheck → lint → build → unit tests → migration check, with Turborepo cache.
  - Acceptance: pipeline fails on a type error, a lint error, or a pending migration; passes on the clean tree.

---

## Phase 1 — Database Schema & Data Layer (BLOCKER)

- [ ] **T1.1 — Better Auth tables** `MUST`
  - Generate `user`, `session`, `account`, `verification` with `npx auth@latest generate --adapter drizzle --dialect postgresql` — never hand-written.
  - Acceptance: migration applies on a clean Neon branch; regenerating produces no diff; no password column is written by our code.

- [ ] **T1.2 — Core journal schema** `MUST`
  - `profiles`, `entries`, `questions`, `answers`, `moods`, `transcriptions`, `ai_generations`, `preferences`, `reminders` per [`DATABASE_SCHEMA.md`](DATABASE_SCHEMA.md).
  - Acceptance: schema diff matches the document table-for-table; FKs and cascade behaviour verified.

- [ ] **T1.3 — Constraints, indexes, timestamps** `MUST`
  - Mood/status check constraints, empty-complete guard, length ceiling, `(user_id, entry_date)` index, GIN search index, `created_at`/`updated_at` populated and refreshed.
  - Acceptance: invalid mood → mapped `400`; `EXPLAIN` shows index use for range + search; an update bumps `updated_at` (asserted by query, not by assumption).

- [ ] **T1.4 — PLUS tables** `PLUS`
  - `attachments`, `journal_chats`, `journal_chat_messages`, `reflections` created but unused.
  - Acceptance: tables exist with ownership FKs; no endpoint references them yet.

- [ ] **T1.5 — Repository layer with mandatory user scoping** `MUST`
  - One repository per aggregate; every function takes `userId` first and includes it in the predicate; parameterised queries only (no string-built SQL).
  - Acceptance: static check — no controller touches Drizzle directly; no repository method can be called without `userId`.

- [ ] **T1.6 — Seeds** `MUST`
  - The 12 system questions in fixed order; dev-only synthetic data.
  - Acceptance: seeds are idempotent; production guard throws; system questions carry `is_system = true`.

- [ ] **T1.7 — Migration workflow** `STACK`
  - `db:generate` / `db:migrate` / `db:check` scripts; direct URL for migrations, pooled for runtime.
  - Acceptance: a deliberately broken migration fails CI; a clean branch migrates from zero in one run.

---

## Phase 2 — Authentication & Session Topology (BLOCKER)

- [ ] **T2.1 — Better Auth mounted in NestJS** `STACK`
  - `AuthModule.forRoot({ auth })` at `/api/auth/*` with cookie settings, `trustedOrigins`, secret from env.
  - Acceptance: sign-up/sign-in/sign-out work through the Nest API; cookie is `HttpOnly`, `SameSite=Lax`, `Secure` in prod.

- [ ] **T2.2 — Session access & guard wiring** `STACK`
  - `@Session()` decorator and `AuthGuard`; guard applied globally with explicit public-route opt-out.
  - Acceptance: new endpoints are protected by default; forgetting a guard cannot expose a route.

- [ ] **T2.3 — Same-origin proxy** `STACK`
  - Next rewrite (dev) + documented edge-proxy config (prod) so `/api/*` reaches NestJS on one origin.
  - Acceptance: browser requests are same-origin; no CORS preflight on auth writes; cookie is first-party.

- [ ] **T2.4 — Server-side session forwarding** `STACK`
  - `lib/api/server.ts` forwards the incoming cookie to `API_INTERNAL_URL`; no session object is cached across users.
  - Acceptance: two simulated user cookies in parallel produce correct, non-leaking HTML; unauthenticated SSR fetch returns the login redirect path.

- [ ] **T2.5 — Register** `MUST`
  - Custom form: name, email, password, confirm; inline validation; loading/error; creates `profiles` in the same transaction.
  - Acceptance: duplicate email → friendly error; weak password blocked; success logs in and lands on `/dashboard`.

- [ ] **T2.6 — Login** `MUST`
  - Custom form; generic credential error; `?next=` honoured; authenticated users redirected away.
  - Acceptance: wrong password → generic error; correct → dashboard; visiting `/login` while authenticated redirects.

- [ ] **T2.7 — Logout** `MUST`
  - Server-side invalidation through the API + cookie clear; private routes send `no-store`.
  - Acceptance: back button after logout does not reveal cached private content.

- [ ] **T2.8 — Route protection (two layers)** `MUST`
  - Next middleware redirects unauthenticated navigation; API guard returns `401` JSON.
  - Acceptance: every protected path redirects with `?next=`; a direct `fetch` without a cookie returns `401`.

- [ ] **T2.9 — Session persistence & refresh** `MUST`
  - Acceptance: reload keeps session; expiry produces a graceful redirect + toast; concurrent tabs do not thrash the session.

---

## Phase 3 — Landing Page (`apps/web`)

- [ ] **T3.1 — Marketing shell** `MUST` — sticky nav, logo, links, Login/Get Started CTAs, mobile drawer, footer.
- [ ] **T3.2 — Hero** `MUST` — animated typography (staggered), 3D element, primary/secondary CTA, subhead explaining the product in one sentence.
- [ ] **T3.3 — Features overview** `MUST` — 6–8 cards, Lucide icons, scroll-reveal via shared variants.
- [ ] **T3.4 — How It Works** `MUST` — 3–4 step stepper with a connecting animation.
- [ ] **T3.5 — Voice journaling section** `MUST` — animated waveform demo + copy describing speech → structured journal.
- [ ] **T3.6 — AI journal demonstration** `MUST` — before/after: raw text → Overview / Activities / Achievements / Challenges / Lessons / Reflections / Tomorrow's Goals.
- [ ] **T3.7 — Calendar & dashboard previews** `MUST` — composed previews of the real components, not placeholder imagery.
- [ ] **T3.8 — Motion & performance budget** `MUST` — 3D lazy-loaded, reduced-motion honoured, no layout shift.
  - Acceptance: Lighthouse mobile ≥ 85; CLS < 0.1; main-thread long tasks < 200 ms.
- [ ] **T3.9 — SEO & metadata** `STACK` — server-rendered metadata, OpenGraph image, robots/sitemap.
  - Acceptance: metadata present in the SSR HTML (curl-visible, not JS-injected).

---

## Phase 4 — App Shell & Navigation

- [ ] **T4.1 — Layouts** `STACK` — `(marketing)`, `(auth)`, `(app)` shells; sidebar (desktop) + bottom bar (mobile); active-route state.
- [ ] **T4.2 — State providers** `STACK` — query cache, toast, theme; no second state library.
- [ ] **T4.3 — Loading / empty / error primitives** `MUST` — route-level skeletons, empty states with CTA, error boundary with retry; `app/error.tsx` + `not-found.tsx`.
- [ ] **T4.4 — Route map** `MUST` — `/`, `/login`, `/register`, `/dashboard`, `/journal`, `/journal/new`, `/journal/[id]`, `/calendar`, `/voice-journal`, `/insights`, `/settings`, `/profile` (+ PLUS `/timeline`, `/reflections`, `/memories`, `/ask`).
  - Acceptance: every route resolves, is guarded where required, and contains no dead control.

---

## Phase 5 — Dashboard

- [ ] **T5.1 — Header block** `MUST` — welcome, current date, today's mood chip, today's summary. Summary source is explicit: approved AI summary if present, otherwise a text excerpt.
- [ ] **T5.2 — Mini calendar** `MUST` — compact Phase 6 calendar; selecting a date routes to it.
- [ ] **T5.3 — Recent entries** `MUST` — last 5 with date, mood, excerpt, open action; empty state.
- [ ] **T5.4 — Stats strip** `MUST` — total entries, current streak, this-month count from real rows.
- [ ] **T5.5 — Quick actions** `MUST` — Quick Journal (today pre-filled), Voice Journal, Search palette.
- [ ] **T5.6 — Streak logic** `MUST` — consecutive days with ≥1 complete entry, timezone-aware; one shared implementation used by dashboard and insights.
  - Acceptance: unit tests cover same-day repeats, gaps, month and DST boundaries.

---

## Phase 6 — Interactive Calendar

- [ ] **T6.1 — Month grid** `MUST` — 7-column grid, dimmed leading/trailing days, month label, keyboard arrow navigation.
- [ ] **T6.2 — Navigation** `MUST` — prev/next, jump-to-today, month/year picker.
- [ ] **T6.3 — Day states** `MUST` — today, selected, has-entry, draft-only, mood dots (multi-entry → `+N` overflow), future-date policy consistent with the API.
- [ ] **T6.4 — Day detail panel** `MUST` — entries for the date plus "new entry for this date".
- [ ] **T6.5 — Data loading** `MUST` — one month-scoped request, adjacent-month prefetch, optimistic update after save.
  - Acceptance: month switch issues exactly one API call; no N+1.
- [ ] **T6.6 — Deep links** `MUST` — `/calendar?date=YYYY-MM-DD`, `/journal?date=YYYY-MM-DD` select on mount.

---

## Phase 7 — Journal Writing System

- [ ] **T7.1 — Entry creation for any date** `MUST` — date chosen, draft created on first keystroke, multiple entries per day.
- [ ] **T7.2 — Autosave lifecycle** `MUST` — debounced save (~1.5 s idle), visible Saving/Saved state, retry on failure, explicit "Save draft" and "Mark complete".
  - Acceptance: closing the tab loses at most the debounce window; completing an empty entry is rejected by the API.
- [ ] **T7.3 — My Daily Story editor** `MUST` — large editor, auto-grow, word count, focus mode, RTL and mixed-direction text, server-enforced length ceiling.
  - Acceptance: 100k-char entry remains responsive while typing (measured); `original_text` stored byte-exact.
- [ ] **T7.4 — Guided questions** `MUST` — 12 seeded questions, interactive cards, progress, skip persisted distinctly from empty, batch upsert bound to the entry.
- [ ] **T7.5 — Custom questions** `MUST` — per-user questions reusable across dates; validation and ownership enforced server-side.
- [ ] **T7.6 — Mood tracker** `MUST` — 10 fixed moods with distinct Lucide icons, single select, optional note, editable, feeds calendar and insights.
- [ ] **T7.7 — Version integrity** `MUST` — transcription, AI output and final entry remain separate records; `original_text` and transcripts write-once.
  - Acceptance: two generations create two rows and zero mutation of `original_text`; DB-level test asserts immutability.

---

## Phase 8 — AI Integration (`apps/api/modules/ai` + `integrations/llm`)

- [ ] **T8.1 — Provider abstraction** `MUST` — one interface (`generateJournal`, `regenerate`, `reflect`, `answerFromJournal`); provider/model/base URL from env; swapping requires no code change in web or domain modules.
- [ ] **T8.2 — Structured output contract** `MUST` — strict JSON with eight keys, validated before persistence; one repair attempt; malformed output never stored.
- [ ] **T8.3 — Prompt guardrails** `MUST` — no invented events/emotions; language preserved; names and numbers preserved; **user's tone and writing style preserved**; no moralising; empty array instead of filler.
  - Acceptance: an adversarial three-fact input yields exactly three facts; casual, formal and Urdu samples do not shift register.
- [ ] **T8.4 — Generation & approval flow** `MUST` — draft review (original vs generated vs applied), regenerate, edit, explicit approve; nothing auto-saves.
- [ ] **T8.5 — Multilingual & translation** `MUST` — output language choice (`match` or explicit), translation additive and labelled; romanised input preserved unless translation requested.
- [ ] **T8.6 — Cost & abuse controls** `MUST` — per-user rate limit, input token ceiling, timeout, one in-flight generation per entry, `503 AI_UNAVAILABLE` with no partial write.
- [ ] **T8.7 — Prompt versioning** `MUST` — prompts versioned; `prompt_version` stored per generation; no journal text in logs.

---

## Phase 9 — Voice Journaling

- [ ] **T9.1 — Recording interface** `MUST` — mic control, start/stop, pause where supported, elapsed timer, live waveform driven by real Web Audio amplitude.
- [ ] **T9.2 — Transcription pipeline** `MUST` — browser SpeechRecognition primary; optional server fallback endpoint; interim → final transcript; manual edit before save.
- [ ] **T9.3 — Capability & permission handling** `MUST` — runtime feature detection (never user-agent sniffing); denied, unsupported and no-device states each have designed guidance plus a typing path.
- [ ] **T9.4 — Speech → AI → review → save** `MUST` — the 9-step workflow; transcript persisted before generation; failure at any step preserves prior steps.
- [ ] **T9.5 — Multilingual dictation** `MUST` — language picker (en-US, en-GB, ur-PK, hi-IN, extensible); declared language stored and used for direction.
- [ ] **T9.6 — Voice accessibility** `MUST` — state changes announced to screen readers, keyboard-operable controls, waveform decorative with a text status alternative.

---

## Phase 10 — Journal History

- [ ] **T10.1 — History list** `MUST` — cursor pagination with date, mood, excerpt, status badge, word count; newest/oldest sort.
- [ ] **T10.2 — Search** `MUST` — full-text over title + original + final; debounced; highlighted; user-scoped.
- [ ] **T10.3 — Filters** `MUST` — mood multi-select, date range, status, has-AI-summary; composable and URL-synced.
- [ ] **T10.4 — Detail view** `MUST` — full entry, mood, Q&A, AI versions with approval marker, transcript (collapsible), timestamps.
- [ ] **T10.5 — Edit** `MUST` — inline edit of final text, answers and mood; preserves original text and history.
- [ ] **T10.6 — Delete & restore** `MUST` — explicit confirmation, soft delete, restore window, deletion removes the entry from lists, calendar and stats.
- [ ] **T10.7 — Calendar navigation in history** `MUST` — day selection filters the list.

---

## Phase 11 — Insights

- [ ] **T11.1 — Metrics service** `MUST` — SQL aggregation for totals, current/longest streak, weekly and monthly activity, mood distribution, top emotions, completion rate.
- [ ] **T11.2 — Charts** `MUST` — weekly bars, monthly trend, mood distribution, calendar heatmap; responsive with an accessible data alternative.
- [ ] **T11.3 — Empty & sparse states** `MUST` — guidance instead of fabricated values.
- [ ] **T11.4 — Timezone correctness** `MUST` — bucketing uses `profiles.timezone`; DST transitions tested.

---

## Phase 12 — Settings, Profile, Reminders

- [ ] **T12.1 — Preferences** `MUST` — default language, AI output language, week start, accent, autosave toggle.
- [ ] **T12.2 — Profile** `MUST` — display name, avatar, bio, timezone; email change path documented.
- [ ] **T12.3 — Account & privacy** `MUST` — change password (Better Auth), delete account (cascades), export data.
- [ ] **T12.4 — Reminders UI** `MUST` — enable/disable, time, timezone, channel; permission requested only on explicit action; denied state shown.
- [ ] **T12.5 — Reminder delivery** `MUST` — one documented mechanism (client-side while open, or web push + cron via `apps/api`); idempotent per local day.

---

## Phase 13 — Recommended Extensions

- [ ] **T13.1 — Life Timeline** `PLUS` — chronological, grouped by month/year, infinite scroll, entry drawer.
- [ ] **T13.2 — AI Personal Reflection** `PLUS` — on-demand over a range; stored in `reflections`; labelled as interpretation; rate-limited; opt-in.
- [ ] **T13.3 — Memories & Attachments** `PLUS` — validated uploads, per-user prefix, signed URLs only, "on this day" resurfacing.
- [ ] **T13.4 — Talk to Your Journal** `PLUS` — retrieval over own entries, answers cite real entry ids, honest refusal when unsupported.

---

## Phase 14 — Security & Privacy Hardening (BLOCKER for release)

- [ ] **T14.1 — Authorization audit** `MUST` — every read/write re-checks ownership; ID-tampering suite returns `404`, never `403`.
- [ ] **T14.2 — Proxy & SSR hardening** `STACK` — no server secret in the web bundle; internal API URL never exposed to the browser; SSR fetches authorised only by the forwarded cookie; proxy strips client-supplied internal headers.
- [ ] **T14.3 — Input validation** `MUST` — shared schemas on body/params/query, payload size limits, rich-text sanitisation where rendered.
- [ ] **T14.4 — Transport & headers** `MUST` — HTTPS, HSTS, CSP, frame-ancestors, `no-store` on private routes, cookie flags verified.
- [ ] **T14.5 — Rate limiting** `MUST` — auth, AI, voice and search, per IP and per user, `Retry-After` returned.
- [ ] **T14.6 — Secret hygiene** `MUST` — `.env*` ignored, bundle grep for secret values, AI keys server-only.
- [ ] **T14.7 — Error handling & logging** `MUST` — generic client errors, request ids, no journal text/transcripts/credentials in logs.
- [ ] **T14.8 — Transactions** `MUST` — multi-table writes atomic on the transaction-capable driver.

---

## Phase 15 — QA & Definition of Done

- [ ] **T15.1 — Functional pass** `MUST` — full plan §17 checklist on the real Neon DB with two accounts.
- [ ] **T15.2 — Isolation proof** `MUST` — two-account matrix across lists, calendar, search, insights, attachments, chat.
- [ ] **T15.3 — Responsive pass** `MUST` — 360 / 768 / 1024 / 1440 widths, no horizontal scroll, calendar usable on mobile.
- [ ] **T15.4 — Accessibility pass** `MUST` — keyboard-only journey, visible focus, labelled inputs, contrast, reduced motion.
- [ ] **T15.5 — Failure-mode pass** `MUST` — DB down, AI down, mic denied, offline autosave, expired session: clear states, no data loss.
- [ ] **T15.6 — Performance pass** `MUST` — dashboard LCP < 2.5 s, JS budget defined, N+1 eliminated, SSR payload reviewed.
- [ ] **T15.7 — Production deploy (two processes)** `STACK` — `apps/web` and `apps/api` deployed behind one origin, migrations applied before release, cookie flow verified in production.
  - Acceptance: sign-up → write → save → revisit works on the deployed URL; no cross-origin cookie warning in the browser console.
- [ ] **T15.8 — Docs** `MUST` — README, architecture, ERD, API contract, known limitations, environment reference.

---

## Cross-Cutting Rules (apply to every task)

1. **No dead UI.** Every control works or is not rendered.
2. **No fabricated data.** Charts, streaks and badges derive from real rows; synthetic data is dev-only.
3. **Server is the authority.** Client checks are UX; authorization is re-verified in the API.
4. **Three-record rule.** Transcription, AI output and approved final entry stay separate; the first two are write-once.
5. **Autosave everywhere.** Journal, answers and mood survive tab close.
6. **Original language preserved.** Translation is explicit and additive.
7. **AI never overwrites.** Approval is a separate mutation.
8. **Web never touches data.** All reads and writes cross the API contract.

---

## Suggested Build Order

```
Phase 0 → 1 → 2        monorepo, schema, auth + proxy (blocking)
        ↓
Phase 4 → 5 → 6 → 7    core journaling loop
        ↓
Phase 8 → 9            AI + voice on a working save pipeline
        ↓
Phase 10 → 11 → 12     history, insights, settings
        ↓
Phase 14 → 15          harden, test, deploy
        ↓
Phase 13 (PLUS)
```

Phase 3 (landing) runs in parallel with Phases 1–2.

---

## Open Decisions

| # | Decision | Status |
|---|---|---|
| D1 | Application framework | **Resolved** — NestJS 12.5.0 + Next.js 16.4.6 |
| D2 | ORM | **Resolved** — Drizzle 0.45.4 + `drizzle-kit` |
| D3 | LLM provider/model | Open — Phase 8 |
| D4 | STT fallback in v1 | Open — Phase 9 |
| D5 | Reminder delivery | Open — Phase 12 |
| D6 | Attachment storage | Open — Phase 13 |
| D7 | Search: Postgres FTS vs embeddings | Open — Phase 10/13 |
| C1–C5 | Install-time re-verifications | Open — Phase 0, see [`TECH_STACK.md`](TECH_STACK.md) §8 |
