# Architecture

> **Status:** Design phase — proposed architecture, not yet implemented.
> **Stack:** NestJS 12.5.0 (API) + Next.js 16.4.6 (SSR web) in a pnpm/Turborepo monorepo. Verified in [`TECH_STACK.md`](TECH_STACK.md).
> **Scope:** System shape, application boundaries, request and render lifecycles, data flow, and the mapping from folder structure to responsibility.

---

## 1. System Overview

```text
┌───────────────────────────────────────────────────────────────┐
│  Browser                                                      │
│  Marketing · Auth · Dashboard · Calendar · Editor · Voice      │
└──────────────────────────┬────────────────────────────────────┘
                           │ HTTPS · one public origin
                           ▼
┌───────────────────────────────────────────────────────────────┐
│  apps/web — Next.js 16 (SSR / RSC / routing)                   │
│  Renders HTML · owns UI state · proxies /api/* to the API      │
└──────────────────────────┬────────────────────────────────────┘
                           │ server-to-server + forwarded cookie
                           ▼
┌───────────────────────────────────────────────────────────────┐
│  apps/api — NestJS 12 (the application core)                   │
│                                                               │
│  /api/auth/*   → Better Auth handler                          │
│  /api/v1/*     → modules → services → repositories            │
│                                                               │
│  guards · pipes · interceptors · filters                      │
└──────┬───────────────────────────────┬────────────────────────┘
       │                               │
       ▼                               ▼
┌──────────────────┐          ┌──────────────────────┐
│ Neon PostgreSQL  │          │ LLM provider         │
│ packages/database│          │ (configurable)       │
└──────────────────┘          └──────────────────────┘
```

**Two deployable applications, one product.** Neither imports the other's source. They agree only on the JSON contract in [`API_DOCUMENTATION.md`](API_DOCUMENTATION.md) and the types in `packages/shared`.

---

## 2. Monorepo Layout

```text
ai-journal/
├── apps/
│   ├── api/          NestJS 12 — all business logic, auth, data, AI, voice
│   └── web/          Next.js 16 — SSR, routing, all UI
├── packages/
│   ├── shared/       types · constants · validation schemas (no runtime deps)
│   ├── database/     Drizzle schema · migrations · seeds · client factory
│   └── config/       shared eslint · typescript · tailwind presets
├── docs/
├── reports/
├── scripts/
├── tests/            cross-app browser E2E only
└── .env.example
```

**Why a monorepo:** the two apps share a domain model that must not drift. One lockfile, one type source, one CI pipeline, atomic changes across the contract. Turborepo caches builds so the cost stays flat as the app grows.

**Why only three packages:** anything else would be abstraction without users. UI primitives live in `apps/web/src/components` because only the web app renders; there is no second consumer.

---

## 3. Responsibility Matrix

| Concern | Owner | Never |
|---|---|---|
| HTML, routing, SSR, hydration | `apps/web` | Touches DB or AI provider |
| Client state, forms, animation | `apps/web` | Decides authorization |
| REST contract consumption | `apps/web/src/lib` | Calls `fetch` from a component |
| Sessions, Better Auth | `apps/api/modules/auth` | Lets the browser talk to it cross-origin |
| Domain rules, ownership | `apps/api/modules/*` | Renders UI |
| DDL, migrations | `packages/database` | Run from `apps/web` |
| Types, constants, schemas | `packages/shared` | Contain side effects |
| LLM / STT / storage calls | `apps/api/integrations/*` | Expose keys to the client |

---

## 4. Two Runtimes, One Origin

The single most important deployment constraint.

```text
public origin: https://journal.example.com
  /                    → apps/web (Next.js)
  /api/auth/*          → apps/api (Better Auth)   [rewritten]
  /api/v1/*            → apps/api (domain modules)[rewritten]
```

- **Development:** `next.config` rewrites forward `/api/:path*` to `http://localhost:3000` (API), so the browser sees one origin and cookies stay first-party.
- **Production:** an edge proxy or the platform's path routing does the same. Two hostnames would break `SameSite` cookies and Better Auth's `trustedOrigins` CSRF check.

Consequence: `BETTER_AUTH_URL` is the **public** origin. Internal container URLs never appear in cookies or redirects.

---

## 5. Render & Request Lifecycles

### 5.1 First paint (server-rendered page)

```text
1. Browser GET /dashboard
2. Next.js server component runs
3. Reads Cookie / Authorization context from the incoming request
4. Server-side fetch to API_INTERNAL_URL with the forwarded cookie
5. API resolves session → guards → module → database
6. JSON returned to the Next server (never to the browser)
7. HTML streamed with real data; no client-side loading flash
8. Client components hydrate; interactive regions take over
```

### 5.2 Mutation (client interaction)

```text
1. Client component calls lib/api (single wrapper)
2. Request hits same-origin /api/v1/...
3. Rewrite forwards to NestJS with the session cookie
4. Nest: request id → session → rate limit → validation → guard → module
5. Repository query scoped by user_id
6. Transaction if the write spans tables
7. Envelope response; client cache updated optimistically
```

### 5.3 What is server-rendered vs client-rendered

| Surface | Rendering | Reason |
|---|---|---|
| Landing page | Server + island animations | SEO and LCP |
| Auth pages | Server shell, client form | Instant paint, no layout shift |
| Dashboard, history, insights | Server-rendered with data | No loading skeleton on first view |
| Editor, calendar, voice | Client components | Continuous interaction |
| AI review | Client, after explicit action | Depends on user-triggered generation |

---

## 6. API Application Architecture (NestJS)

```text
apps/api/src/
├── main.ts                 bootstrap, global pipes/filters, CORS, cookies
├── app.module.ts           root module, AuthModule.forRoot, config
├── common/                 filters · guards · interceptors · pipes · decorators
├── config/                 env schema, typed namespaces
├── modules/<domain>/       controller · service · repository · dto · entities
├── integrations/           llm · stt · storage · notifications
└── test/                   e2e (supertest)
```

| Layer | Responsibility | May depend on |
|---|---|---|
| Controller | Route, DTO binding, guard application | Service |
| Service | Domain rules, orchestration, transactions | Repository, integrations, `packages/shared` |
| Repository | SQL via Drizzle, always scoped by `user_id` | `packages/database` |
| Guard | Session + ownership preconditions | Auth module |
| Pipe | Validation via shared schemas | `packages/shared/schemas` |
| Integration | Outbound HTTP (LLM, STT, storage) | Config |

**Rules**
- A controller never queries the database.
- A service never reads `req`/`res`.
- A repository never decides business policy.
- Cross-module reuse happens through a module's exported service — never by importing another module's repository.

### Module map

| Module | Owns | Key invariant |
|---|---|---|
| `auth` | Better Auth mount, session access, guards | Passwords/sessions are Better Auth's, never reimplemented |
| `users` | Profile, preferences, export, deletion | One profile per user |
| `journals` | Entries, answers, lifecycle | `original_text` immutable; `final_text` explicit only |
| `calendar` | Month/day aggregation | One query per month |
| `moods` | Mood records, distribution | One mood per entry |
| `questions` | System + custom questions | System questions global and read-only |
| `voice` | Transcripts, STT fallback | Transcripts immutable |
| `ai` | Generation, approval, reflection, chat | Append-only; approval explicit |
| `insights` | Streaks, activity aggregates | SQL aggregation, timezone-aware |
| `reminders` | Settings, dispatch | Idempotent per day |
| `health` | Liveness, DB reachability | Never leaks configuration |

---

## 7. Web Application Architecture (Next.js)

```text
apps/web/src/
├── app/
│   ├── (marketing)/        landing, public pages
│   ├── (auth)/             login, register
│   └── (app)/              dashboard, calendar, journal, voice, insights, settings, profile
├── layouts/                shells: marketing, auth, app
├── components/             design-system primitives
├── features/               vertical slices: journal · calendar · voice · ai · insights · settings
├── hooks/                  cross-feature hooks (autosave, media query, session)
├── lib/                    API client, session helpers, formatters, guards
├── animations/             motion variants, waveform, page transitions
├── providers/              theme, query cache, toast
└── styles/                 tokens, globals, fonts
```

**Rules**
- Pages compose; they do not fetch directly — `lib/api` or a feature hook does.
- `features/*` may import `components/*`; the reverse is forbidden.
- Server components fetch; client components mutate.
- One query cache provider; no second state library.
- Animation variants live only in `animations/`, imported — never inlined ad hoc.
- `dir="auto"` on every user-generated string; direction is data, not a guess.

### Route protection

Two layers, both required:

1. **Web:** middleware redirects unauthenticated navigation to `/login?next=…` using the session cookie.
2. **API:** `AuthGuard` rejects any request without a valid session, regardless of what the browser did.

The first is UX. The second is security. Losing the first degrades experience; losing the second is a breach.

---

## 8. Shared Packages

### `packages/shared`

| Folder | Contents |
|---|---|
| `types/` | `JournalEntry`, `Mood`, `AiGeneration`, enums, API DTO shapes |
| `constants/` | Mood list, default questions, route paths, limits (max entry length, page size) |
| `schemas/` | Validation schemas for every payload |

Dependency direction: `apps/*` → `packages/shared` → nothing. It must stay framework-free (no Nest decorators, no React imports) so both runtimes can consume it.

### `packages/database`

| Folder | Contents |
|---|---|
| `schema/` | Drizzle table definitions (including Better Auth–generated tables) |
| `migrations/` | Generated SQL, versioned, forward-only |
| `seeds/` | Idempotent dev seeds, guarded by `NODE_ENV` |
| `src/` | Client factory (pooled + transaction client), typed helpers |

Only the API imports this package. Migrations run from CI or `scripts/`, against the direct Neon URL.

### `packages/config`

Shared `eslint`, `typescript` (`tsconfig` bases) and `tailwind` presets so both apps inherit one standard instead of drifting.

---

## 9. Authentication Architecture

| Concern | Decision |
|---|---|
| Provider | Better Auth 1.7.25 |
| Mount point | `apps/api` at `/api/auth/*` via `@thallesp/nestjs-better-auth` 2.8.0 |
| UI | Custom forms in `apps/web` — no provider popups, no external-looking flows |
| Session transport | httpOnly, secure, sameSite cookie on the public origin |
| Server-side reads | Next server components forward the cookie to the API |
| Authorization | `AuthGuard` on every guarded controller + `user_id` predicate in every repository query |
| Schema | Generated by the Better Auth CLI, not hand-written |

Guest/auth split is enforced twice: middleware at the edge of `apps/web`, guard at the edge of `apps/api`.

---

## 10. AI & Voice Architecture

```text
apps/api/modules/ai/         policy: what may be generated, when, by whom
apps/api/integrations/llm/   transport: provider call, timeout, retry
          │
          ├── generate → validate → persist ai_generation (append-only)
          └── approve  → write final_text (explicit, never automatic)

apps/web/api/voice/transcribe (optional)  ─┐
browser SpeechRecognition ────────────────┴─→ transcript (immutable) → ai.generate
```

Rules: the model is configurable by environment; the UI never learns the provider; no generation touches `original_text`; approval is a separate mutation. Details: [`AI_INTEGRATION.md`](AI_INTEGRATION.md), [`VOICE_JOURNAL.md`](VOICE_JOURNAL.md).

---

## 11. Data Access

1. All DDL ships as migrations in `packages/database/migrations`.
2. Runtime queries go through repositories whose first parameter is `userId`.
3. Multi-table writes run inside a transaction (pooled `pg` path — see §6 of [`TECH_STACK.md`](TECH_STACK.md) for the HTTP-driver constraint).
4. System reference data (the 12 questions) is the only user-independent dataset.
5. Soft-deleted rows are excluded by default in every repository, not by every caller.

---

## 12. Security Architecture

| Layer | Control |
|---|---|
| Session | httpOnly + secure + sameSite; server-side invalidation |
| Origin | Single public origin; rewrites keep cookies first-party; `trustedOrigins` enforced |
| Authorization | Guard + per-query `user_id` predicate + ownership re-check on mutation |
| Input | Shared schema validation on body/params/query; upload size and MIME limits |
| Output | Envelope errors with request ids; no stack traces or SQL to clients |
| Secrets | Environment only; LLM keys never reach `apps/web` or the client bundle |
| Data | Soft delete + retention; hard delete only on explicit user action |

Threat model: **the client is hostile, and so is anything it forwards.** SSR fetches are authorized by the forwarded cookie, never by trust in the Next server.

---

## 13. Deployment Topology

| Component | Host | Notes |
|---|---|---|
| `apps/web` | Node host (SSR required) | Must not be exported as a static site |
| `apps/api` | Node host / container | NestJS 12, Node ≥ 20.9 |
| Routing | Reverse proxy / platform paths | `/api/*` → API, everything else → web |
| Database | Neon (pooled runtime, direct for migrations) | Branch per preview environment |
| Migrations | CI step before deploy | Fail closed |
| AI / STT | External HTTP APIs | Server-side only |
| Static assets | Next `public/` + build output | Cache-busted |

---

## 14. Architectural Invariants

1. `apps/web` holds no database credentials and calls no AI provider.
2. `apps/api` renders no HTML.
3. `packages/shared` has no side effects and imports no framework.
4. Only `apps/api` imports `packages/database`.
5. Every user-owned query is scoped by `user_id`.
6. `original_text` and transcripts are immutable.
7. AI output never reaches `final_text` without explicit approval.
8. Schema changes arrive only as migrations.
9. One public origin — no cross-origin cookie flow.
10. No P0 security decision depends on a client-side check.

---

## 15. Open Decisions

| ID | Decision | Status |
|---|---|---|
| D1 | Application framework | **Resolved** — NestJS 12.5.0 + Next.js 16.4.6 (see [`TECH_STACK.md`](TECH_STACK.md)) |
| D2 | ORM / query layer | **Resolved** — Drizzle 0.45.4 + `@neondatabase/serverless` 1.2.1 |
| D3 | LLM provider and model | Open — Phase 8 |
| D4 | STT fallback in v1 or deferred | Open — Phase 9 |
| D5 | Reminder delivery mechanism | Open — Phase 12 |
| D6 | Attachment storage backend | Open — Phase 13 |
| D7 | Search strategy (FTS vs embeddings) | Open — Phase 10/13 |
| C1–C5 | Install-time re-verifications | Open — Phase 0 (see [`TECH_STACK.md`](TECH_STACK.md) §8) |
