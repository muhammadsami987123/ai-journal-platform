# Development Guidelines

> **Status:** Design phase — no tooling installed yet. These are the standards the first commit must follow.
> **Stack:** pnpm + Turborepo · `apps/api` NestJS 12.5.0 · `apps/web` Next.js 16.4.6 · Drizzle 0.45.4 · TypeScript 6.0.x · Tailwind 4.3.5.
> Versions and constraints: [`TECH_STACK.md`](TECH_STACK.md).

---

## 1. Golden Rules

1. **No secrets in the repository.** Everything arrives through environment variables described in `../.env.example`.
2. **The client is untrusted.** Authorization is decided in `apps/api`, never in `apps/web` alone.
3. **No dead UI.** A control works or is not rendered.
4. **No fabricated data.** Statistics derive from real rows; sample data is dev-only.
5. **One home per fact.** Schema in `DATABASE_SCHEMA.md`, contract in `API_DOCUMENTATION.md`, tokens in `UI_UX_GUIDELINES.md`.
6. **Schema changes ship as migrations** in `packages/database/migrations`.
7. **Document before implementing.** If it is not written down, it is not agreed.
8. **Respect the dependency direction:** `apps/*` → `packages/*`. Never `apps/api` → `apps/web`, never `packages/shared` → a framework.

---

## 2. Repository Conventions

| Path | Contains | Must not contain |
|---|---|---|
| `apps/api` | NestJS modules, guards, integrations, API tests | HTML/JSX, browser code |
| `apps/web` | Next.js routes, components, hooks, animations | DB access, AI keys, business rules |
| `packages/shared` | Types, constants, validation schemas | Nest decorators, React imports, side effects |
| `packages/database` | Drizzle schema, migrations, seeds, client factory | Controllers, HTTP concerns |
| `packages/config` | ESLint / tsconfig / Tailwind presets | Application logic |
| `docs/` | Specifications | Progress notes, logs |
| `reports/` | Dated records of work performed | Specifications |
| `tests/` | Cross-app browser E2E | Unit tests that belong beside their source |
| `scripts/` | Automation | Runtime application code |

**Test placement (no duplication):** unit tests are colocated (`*.spec.ts` next to source); API integration tests live in `apps/api/test`; browser E2E lives in `tests/e2e`. Do not create a second home for the same suite.

---

## 3. Naming

| Thing | Convention | Example |
|---|---|---|
| Folders | `kebab-case` | `voice-journal/` |
| Nest files | `<name>.<type>.ts` | `entries.controller.ts`, `entries.service.ts` |
| Nest classes | PascalCase + suffix | `EntriesService`, `CreateEntryDto` |
| React components | `PascalCase.tsx` | `MoodPicker.tsx` |
| Hooks | `use-` prefix | `use-autosave.ts` |
| Types | PascalCase, no `I` prefix | `JournalEntry` |
| Constants | `SCREAMING_SNAKE_CASE` | `MAX_ENTRY_LENGTH` |
| Migration files | `NNNN_verb_noun.sql` / drizzle equivalent | `0002_add_entries` |
| API paths | plural nouns, kebab-case | `/api/v1/entries` |
| Env vars | `SCREAMING_SNAKE_CASE` | `LLM_API_KEY` |
| DB tables/columns | `snake_case`, plural tables | `entries`, `entry_date` |

All identifiers in English. User-facing copy may be any language.

---

## 4. TypeScript

- `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitAny` (inherited from `packages/config/typescript`).
- **Pin TypeScript 6.0.x.** TS 7 is published but outside the auth adapter's declared peer range.
- No `any` in application code; `unknown` + narrowing at boundaries.
- Runtime validation comes from `packages/shared/schemas` — types alone are not validation.
- Discriminated unions for state; no boolean soup.
- Dates: `YYYY-MM-DD` strings for business dates, ISO strings for instants. No `Date` objects across the API boundary.
- Path aliases (`@/`, `@shared/*`, `@db/*`) come from the shared tsconfig base — no relative `../../..` chains deeper than two levels.

---

## 5. NestJS (`apps/api`)

**Module anatomy**

```text
modules/journals/
├── journals.module.ts
├── journals.controller.ts     HTTP only: route, DTO binding, guard
├── journals.service.ts        domain rules, orchestration, transactions
├── journals.repository.ts     Drizzle queries, always user-scoped
├── dto/                       request/response shapes
└── __tests__/                 colocated unit tests
```

**Rules**
- Controllers never query the database and never build SQL.
- Services never import `Request`/`Response`.
- Repositories take `userId` as the first parameter and include it in the predicate.
- Cross-module reuse goes through an exported service, never another module's repository.
- Guards are global; public routes opt out explicitly.
- Validation uses a shared-schema pipe — no duplicated DTO validation.
- Every outbound call (LLM, STT, storage) lives in `src/integrations/`, never in a domain service.
- Errors are thrown as domain exceptions and mapped to the envelope by the global filter.
- Logging: request id, route, duration, outcome. Never journal text, transcripts, tokens or secrets.

**Transactions:** use the transaction-capable connection (pooled `pg` path). The HTTP driver cannot hold a transaction — see [`TECH_STACK.md`](TECH_STACK.md) §6.

---

## 6. Next.js (`apps/web`)

**Rendering rules**

| Rule | Why |
|---|---|
| Server components fetch; client components mutate | Avoids waterfalls and keeps secrets server-side |
| No `fetch` in a component | One wrapper in `lib/api` — cache keys, headers, error mapping in one place |
| Server fetches forward the incoming cookie | There is no ambient session on the Next server |
| `'use client'` only where interaction requires it | Keeps the client bundle small |
| Never read `process.env` in a client component | Only `NEXT_PUBLIC_*` is legal there |
| Never call `API_INTERNAL_URL` from the browser | Internal address must not leak |

**Structure**
- `app/*` composes; `features/*` implements; `components/*` stays presentational.
- `components` may be imported by features; features are never imported by components.
- Animation variants live only in `animations/` and are imported.
- `dir="auto"` on all user-generated content.
- Every async surface ships loading, empty, error and permission states with the feature.

---

## 7. Database (`packages/database`)

- Drizzle is the single source of truth for tables; Better Auth tables are **generated**, not hand-written.
- Migrations are forward-only in production, generated into `packages/database/migrations`, applied with the direct Neon URL.
- Every user-owned table has `user_id` with `ON DELETE CASCADE` from `user`.
- Timestamps are `TIMESTAMPTZ`, populated on insert and refreshed on update.
- Indexes ship with the query that needs them, with the reason in a comment.
- Seeds are idempotent and refuse to run when `NODE_ENV === 'production'`.
- No ad-hoc DDL against any shared environment.

---

## 8. Configuration & Environment

- `apps/api` validates its environment at boot (`config` module) and refuses to start if a required key is missing.
- `apps/web` validates only the `NEXT_PUBLIC_*` keys it needs; server-only keys must never reach the bundle.
- Three URL variables, never interchangeable:
  - `APP_URL` — public origin (cookies, `BETTER_AUTH_URL`).
  - `API_INTERNAL_URL` — server-to-server only.
  - `NEXT_PUBLIC_API_BASE_URL` — browser-visible base (`/api`, relative).
- Any new variable is added to `.env.example` in the same PR.

---

## 9. Testing

| Level | Location | Tooling | Scope |
|---|---|---|---|
| Unit (API) | `apps/api/src/**/*.spec.ts` | Jest (Nest default) | Streak logic, date bucketing, validation, guards |
| Integration (API) | `apps/api/test` | Supertest against a Neon branch | Auth, ownership, transactions, AI failure paths |
| Unit (web) | `apps/web/src/**/*.test.tsx` | Vitest + Testing Library | Hooks, formatters, component states |
| E2E | `tests/e2e` | Playwright | Register → write → mood → save → revisit |

Mandatory before a P0 task is done:

1. **Isolation** — user A cannot read, update or delete user B's rows by ID.
2. **Immutability** — `original_text` and transcripts cannot be modified.
3. **Approval** — AI output never reaches `final_text` without the approval call.
4. **Timezone** — streaks and day bucketing across midnight and DST.
5. **Failure** — DB down, AI down, mic denied: no crash, no data loss.
6. **Proxy** — the SSR cookie-forwarding path is exercised, not assumed.

Fixtures are synthetic. No real journal content in tests or screenshots.

---

## 10. Git Workflow

- Branches: `feat/<area>-<desc>`, `fix/<area>-<desc>`, `docs/<subject>`, `chore/<subject>`.
- Conventional Commits: `feat(journal): add autosave`, `chore(api): pin nestjs 12.5.0`.
- One logical change per commit; no mixed refactor + feature commits.
- PRs state: what changed, why, how verified, which `T#.#` it closes.
- No force-push to shared branches. Never commit `.env`, build output or `node_modules`.

---

## 11. Quality Gates

A change is mergeable only when all pass:

- [ ] `pnpm typecheck` clean across the workspace.
- [ ] `pnpm lint` clean, no new warnings.
- [ ] `pnpm build` succeeds for both apps.
- [ ] Relevant tests pass; new P0 behaviour has a test.
- [ ] No secret in the diff and none in the web bundle.
- [ ] Docs updated if a contract, schema, token or env var changed.
- [ ] Reports updated at milestone boundaries.
- [ ] UI changes verified for keyboard, focus and labels.
- [ ] Responsive checked at 360 / 768 / 1024 / 1440 px.

---

## 12. Documentation Discipline

- `docs/` describes the system **as designed**; it changes in the same PR as the behaviour.
- `reports/` records what happened, dated and append-only. Never edit a past report.
- Requirement ids are stable; deprecate, never renumber.
- Every new endpoint, table, token or env var appears in the relevant document before it ships.

---

## 13. Reporting Rhythm

| Report | Cadence | Location |
|---|---|---|
| Progress | End of each phase | `reports/progress/` |
| Testing | After each verification pass | `reports/testing/` |
| Bug | On discovery and on resolution | `reports/bugs/` |
| Review | After an architecture or feature review | `reports/reviews/` |
| Implementation | When a feature or structural change lands | `reports/implementation/` |

Filename: `YYYY-MM-DD-<slug>.md`.

---

## 14. Definition of Done (per task)

1. Implemented against the written contract.
2. Acceptance criteria in [`TASKS.md`](TASKS.md) demonstrated.
3. Loading, empty, error and permission states handled.
4. Authorization verified with a two-account test.
5. No secret, no `any`, no dead control.
6. Docs and reports updated.
7. Reviewed and recorded in `reports/reviews/`.

---

## 15. Version Policy

| Dependency | Policy |
|---|---|
| NestJS | Pin exact `12.5.0`; major upgrades are their own PR with a regression pass |
| Next.js | Pin exact `16.4.6`; major upgrades require a rendering regression check |
| TypeScript | `~6.0.3` — do not jump to 7 until peer ranges allow |
| Drizzle | Exact `0.45.4`; `drizzle-kit` matched to it |
| Better Auth | `1.7.25`, inside the adapter's `>=1.5 <2` range |
| Anything else | Lockfile-pinned; no floating `^` on runtime frameworks |

Upgrade notes are recorded in `reports/reviews/`.
