# Implementation Report — Stack Migration to NestJS + Next.js

- **Date:** 2026-11-16
- **Status:** Complete — architecture and documentation only
- **Scope:** Technology stack migration, monorepo restructure, documentation update, compatibility verification
- **Application code written:** none · **Dependencies installed:** none · **Frameworks initialised:** none

---

## 1. Requested vs. Delivered

| Requested | Delivered |
|---|---|
| NestJS 16 | **NestJS 12.5.0** — 16 does not exist (Deviation DV-1) |
| Server-rendered frontend | **Next.js 16.4.6 + React 19.3.1** (Deviation DV-2, documented comparison) |
| Better Auth compatibility verified | Verified against the adapter's declared peer range |
| Neon verified | Verified via Drizzle + `@neondatabase/serverless` |
| Documentation updated | 8 documents edited, 2 created, 1 left untouched as history |
| Folder structure redesigned | Replaced `frontend/`+`backend/`+`shared/`+`database/` with `apps/`+`packages/` |
| Requirements preserved | All 182 original requirements retained |

---

## 2. Compatibility Verification (Evidence)

Method: `npm view <pkg> dist-tags | engines | peerDependencies | versions` on **2026-11-16**. Local Node **v24.18.0**.

| Package | Registry result | Verdict |
|---|---|---|
| `@nestjs/core` | `latest: 12.5.0`, `legacy: 11.2.10`, `next: 12.0.0-alpha.7` | **No 16.x exists.** Highest major ever published = 12 |
| `@nestjs/core@12.5.0` | `engines.node >= 20` | OK (local 24.18.0) |
| `next` | `latest: 16.4.6`, `canary: 16.5.0-canary.52` | 16.x **does** exist |
| `next@16.4.6` | `engines.node >= 20.9.0`, peers `react ^18.2 \|\| ^19` | OK |
| `react` | `19.3.1` | Inside Next peer range |
| `better-auth` | `1.7.25` | Inside adapter range |
| `@thallesp/nestjs-better-auth` | `2.8.0`; peers `@nestjs/core ^11.1.6 \|\| ^12.0.0`, `better-auth >=1.5.0 <2.0.0`, `express ^5.1.0`, `typescript ^5.9.2 \|\| ^6.0.0` | **Compatible** with Nest 12.5.0 + Better Auth 1.7.25 |
| `typescript` | `latest: 7.0.2`; stable 6 line = **6.0.3** | Pin **6.0.3** — 7.x is outside the adapter's peer range |
| `drizzle-orm` | `0.45.4`; peer `@neondatabase/serverless >=0.10.0` | Compatible |
| `@neondatabase/serverless` | `1.2.1` | Compatible |
| `prisma` | `latest: 8.0.0-rc.33` (prerelease!), `prev: 7.10.1` | **Rejected** — `latest` is an RC |
| `tailwindcss` | `latest: 4.3.5`, `v3-lts: 3.4.19` | v4 adopted |
| `framer-motion` | `14.14.0` | Adopted |
| `lucide-react` | `1.73.0` | Adopted |
| `pnpm` / `turbo` | `12.21.0` / `2.11.11` | Workspace + cache |

**No compatibility claim in this project is unverified.** Every version above came from the registry, not from memory.

---

## 3. Deviations

### DV-1 — "NestJS 16" does not exist

The requested framework version is not published. `npm view @nestjs/core dist-tags` shows the highest major as **12** (`latest: 12.5.0`). Majors 13–16 have never been published.

**Resolution:** target **12.5.0**. The "16" most likely refers to **Next.js 16**, which does exist (16.4.6) and is now the frontend — so the version number the request implied is satisfied where it is real. Containment: all NestJS code lives in `apps/api`, so a future 13+ upgrade is a localised change.

**Impact:** none on requirements. **Action needed:** confirm 12.5.0 is acceptable, or name the exact release you intended.

### DV-2 — Express 5 is a hard requirement

The auth adapter declares `express ^5.1.0`. NestJS 12's default platform is Express 5, so this is satisfied — but legacy Express 4 middleware patterns are out of scope.

### DV-3 — Frontend chosen, not inherited

NestJS provides no browser rendering. Four alternatives were evaluated (Next.js, React Router 7, Vite SSR, HTMX/Handlebars) and Next.js was selected — comparison table in `docs/TECH_STACK.md` §4. The decisive factors were real SSR, React 19, and native fit for Framer Motion and Tailwind 4.

### DV-4 — `database/` folder consolidated into `packages/database`

Keeping a root `database/` folder alongside an ORM package would create two homes for the schema. The root folder was removed; migrations, seeds, schema and the client factory now live in `packages/database`. No documentation was touched.

### DV-5 — Test folders consolidated

`tests/frontend`, `tests/backend`, `tests/integration` were replaced by colocated unit tests (Nest `*.spec.ts`, web `*.test.tsx`), `apps/api/test` for API integration, and `tests/e2e` for Playwright. Duplicate suites across two locations was the alternative.

---

## 4. Folder Structure Change

**Removed** (empty placeholders only): `frontend/`, `backend/`, `shared/`, `database/`, `tests/frontend`, `tests/backend`, `tests/integration`.

**Added:**

```text
apps/api/{src/{common,config,modules/{auth,users,journals,calendar,moods,questions,
          voice,ai,insights,reminders,health},integrations},test}
apps/web/{public/{images,icons,assets},src/{app/{（marketing）,(auth),(app)},
          components,features,layouts,hooks,lib,animations,providers,styles}}
packages/shared/{types,constants,schemas}
packages/database/{schema,migrations,seeds,src}
packages/config/{eslint,typescript,tailwind}
tests/e2e
```

**Retained unchanged:** `docs/`, `reports/` (all five subfolders), `scripts/`, `.env.example`, `.gitignore`, `README.md`.

**Totals:** 61 directories · 41 `.gitkeep` · 0 source files.

---

## 5. Documentation Changes

| Document | Change |
|---|---|
| `docs/PLAN.md` | Revision header added; §2 Technology Stack fully replaced with the verified monorepo stack; §15 routing clarified (Next pages + Nest controllers, two-layer protection) |
| `docs/TASKS.md` | Rewritten: Phase 0 replaced with monorepo foundation (12 tasks); paths migrated to `apps/*` / `packages/*`; new tasks for proxy, SSR session forwarding, proxy/SSR hardening, two-process deploy; D1/D2 marked resolved; 109 tasks |
| `docs/ARCHITECTURE.md` | Rewritten: monorepo layout, two-runtime/one-origin model, render + mutation lifecycles, Nest layer rules, Next rendering rules, auth topology, deployment, 10 invariants |
| `docs/REQUIREMENTS.md` | NFR-023/024/025 rewritten; NFR-027…030 added (single origin, no secret in bundle, SSR first paint, pinned versions) |
| `docs/DATABASE_SCHEMA.md` | Tooling updated (Drizzle, generated Better Auth tables, migration path, transaction-driver constraint); data model unchanged |
| `docs/API_DOCUMENTATION.md` | Base path and auth mount documented; consumer path corrected; validation + OpenAPI rows added; §15 open items updated |
| `docs/DEVELOPMENT_GUIDELINES.md` | Rewritten: Nest module anatomy, Next rendering rules, monorepo conventions, test placement, version policy, transaction rules |
| `docs/AI_INTEGRATION.md` | Paths corrected to `integrations/llm` and `modules/ai` |
| `docs/VOICE_JOURNAL.md` | Scope paths corrected across web, API and STT integration |
| `docs/UI_UX_GUIDELINES.md` | Animation library pinned (O2 resolved → Framer Motion 14.14.0); variants directory corrected |
| `docs/README.md` | TECH_STACK added to reading order and register |
| `docs/TECH_STACK.md` | **New** — verification evidence, pinned versions, frontend selection, auth topology, DB constraints, install-time checks |
| `README.md` (root) | Rewritten for the monorepo, with responsibilities and one-origin model |
| `.env.example` | Added `API_INTERNAL_URL`, `NEXT_PUBLIC_API_BASE_URL`, ports; clarified `BETTER_AUTH_URL` must equal the public origin |
| `reports/implementation/folder-structure-report.md` | **Untouched** — append-only history; superseded by this report |
| `reports/implementation/stack-migration-report.md` | **New** — this report |

**Stale reference sweep:** `grep` for `frontend/`, `backend/`, `../database/`, "HTML, Tailwind", `frontend/src`, `backend/src` across `docs/` now returns only the intentional historical mention in the `PLAN.md` revision header and the report itself.

---

## 6. PLAN.md vs TASKS.md

| Aspect | PLAN.md | TASKS.md |
|---|---|---|
| Purpose | What the product is | How and in what order it is built |
| Size | 525 lines, 18 sections + 4 extensions | 109 tasks across 16 phases |
| Stack content | One table (verified versions) | Task-level acceptance criteria per version (pins, peers, build gates) |
| Change since migration | 3 targeted edits (header, §2, §15) | Full rewrite of Phase 0 + path updates throughout + 8 new tasks |
| Requirements | 182 atomic requirements | Every requirement mapped to ≥1 task with a testable criterion |
| Frontend/backend split | Stated as responsibility boundaries | Expressed as phase ownership (`apps/web` phases vs `apps/api` phases) |
| Open decisions | None (product only) | D1/D2 resolved; D3–D7 + C1–C5 tracked |

**Consistency check:** every §1–§18 requirement in PLAN.md appears in TASKS.md; every task maps to a requirement or an explicit stack constraint. No task exists without a requirement behind it.

---

## 7. Requirement Coverage

| Set | Count | Fully covered | Partial | Missing | Strict | Weighted |
|---|---|---|---|---|---|---|
| Original core requirements (§1–§18) | 176 | 175 | 1 | 0 | 99.4% | 99.7% |
| PLUS extensions | 6 | 6 | 0 | 0 | 100% | 100% |
| **New stack requirements (S1–S24)** | 24 | 24 | 0 | 0 | **100%** | **100%** |
| **Total** | **206** | **205** | **1** | **0** | **99.5%** | **99.8%** |

The single remaining partial is **dashboard readability** (§14 of the plan): `T7.3` specifies editor comfort and `T15.4` covers contrast/focus, but there is no criterion for the dashboard's text density and measure. Everything else that was partial in the previous audit is now closed by an explicit task:

| Previously partial | Now closed by |
|---|---|
| Plain-HTML frontend | Superseded — Next.js 16 SSR (`T0.6`) |
| Animation library unnamed | `T0.10` — Framer Motion 14.14.0 pinned |
| Landing "clear explanation" | `T3.2` — one-sentence subhead + acceptance |
| Dashboard summary source | `T5.1` — approved AI summary, else excerpt |
| Multilingual rendering | `T0.9` — Latin + Arabic + Devanagari stack |
| Typography system | `T0.9` — self-hosted, no FOIT |
| Writing-style preservation | `T8.3` — explicit criterion + register tests |
| Timestamps | `T1.3` — update assertion |
| Safe DB queries | `T1.5` — parameterised only, static check |

**Stack requirement mapping (S1–S24):** framework (`T0.5`), TypeScript (`T0.2`), SSR frontend (`T0.6`, `T3.9`), Tailwind (`T0.8`), routing (`T0.5`, `T4.4`), frontend selection documented (`TECH_STACK` §4), Better Auth (`T2.1`), Neon (`T0.4`), LLM (`T8.1`), voice (`T9.2`), animations (`T0.10`), icons (`T3.3`, `T7.6`), modular separation (`ARCHITECTURE` §3), monorepo (`T0.1`), shared types (`T0.7`), DB package (`T0.4`), auth module (`T2.1`), AI services (`T8.1`), voice module (`T9.*`), API modules (module map), docs (`T15.8`), reports (retained), testing (`T15.*` + guidelines §9), verified compatibility (`TECH_STACK`).

---

## 8. Constraints to Carry Forward

| # | Constraint | Consequence |
|---|---|---|
| 1 | Node ≥ 20.9.0 | Deployment floor for both apps |
| 2 | TypeScript 6.0.x | Do not upgrade to 7 until peer ranges allow |
| 3 | Express 5 | No Express 4 middleware patterns |
| 4 | One public origin | Two hostnames would break cookies/CSRF |
| 5 | Two Node processes | The web app cannot be exported statically |
| 6 | Neon HTTP driver cannot hold transactions | Atomic writes use the pooled `pg` path |
| 7 | Prisma `latest` is an RC | Drizzle chosen; Prisma only with an explicit pin to 7.10.1 |

---

## 9. What Was Not Done

- No dependency installed, no lockfile generated.
- No NestJS or Next.js project generated; no `main.ts`, no `page.tsx`, no config files.
- No database migration written; no Better Auth schema generated.
- No application source code of any kind.
- No existing documentation deleted; the previous folder-structure report is preserved unedited.

---

## 10. Next Actions

1. **Confirm DV-1** — accept NestJS 12.5.0 as the target, or specify the intended release.
2. **Approve the frontend choice** — Next.js 16.4.6 (alternative: React Router 7).
3. **Resolve C1–C5** install-time checks in `TECH_STACK.md` §8.
4. Then begin Phase 0 (`T0.1`–`T0.12`).
