# Technology Stack & Compatibility Verification

> **Status:** Design phase — verified 2026-11-16 against the public npm registry. No dependency has been installed.
> **Purpose:** record *evidence-based* version and integration facts, so no compatibility claim in this project is invented.

---

## 1. Verification Method

| Item | Detail |
|---|---|
| Date | 2026-11-16 |
| Registry | `registry.npmjs.org` via `npm view` |
| Local runtime | Node **v24.18.0**, npm present |
| Method | `dist-tags`, `engines`, `peerDependencies`, `versions` for every package below |
| Rule | A version is only listed if it exists in the registry. No claim is made from memory. |

---

## 2. Critical Finding — "NestJS 16" Does Not Exist

The requested framework version **NestJS 16 is not published**. Registry evidence (`npm view @nestjs/core dist-tags`):

```json
{ "latest": "12.5.0", "legacy": "11.2.10", "next": "12.0.0-alpha.7",
  "old": "10.4.19", "rc": "6.0.0-rc.1", "beta": "9.3.0-beta.3" }
```

| Fact | Value |
|---|---|
| Newest published major | **12** |
| Newest stable release | **12.5.0** |
| Newest prerelease tag (`next`) | 12.0.0-alpha.7 (older than stable — stale tag) |
| Highest major ever published | 12 |
| Majors 13–16 | **Do not exist** |

**Resolution:** the project targets **NestJS 12.5.0** (current stable). This is recorded as Deviation DV-1 in [`../reports/implementation/stack-migration-report.md`](../reports/implementation/stack-migration-report.md).

**Likely cause of confusion:** **Next.js 16** *does* exist (`latest: 16.4.6`). The "16" almost certainly belongs to the frontend framework, not NestJS. Both are now pinned explicitly below so the two can never be conflated again.

If a NestJS 13+ line is released during the project, the upgrade is a contained change: NestJS code lives only in `apps/api/`.

---

## 3. Pinned Stack

| Layer | Package | Version | Evidence / Constraint |
|---|---|---|---|
| API framework | `@nestjs/core`, `@nestjs/common` | **12.5.0** | `latest` dist-tag; `engines.node >= 20` |
| API platform | `@nestjs/platform-express` | **12.5.0** | Express 5 underneath (required by Better Auth adapter) |
| Language | `typescript` | **6.0.3** | Latest is 7.0.2; `@thallesp/nestjs-better-auth@2.8.0` declares `typescript ^5.9.2 \|\| ^6.0.0` — **pin 6.0.x** |
| Frontend framework | `next` | **16.4.6** | `engines.node >= 20.9.0`; peers `react ^18.2 \|\| ^19` |
| UI runtime | `react`, `react-dom` | **19.3.1** | Satisfies Next 16 peer range |
| Styling | `tailwindcss` | **4.3.5** | v4 line (`v3-lts` = 3.4.19 available if needed) |
| Auth | `better-auth` | **1.7.25** | No `engines` restriction published |
| Auth ↔ Nest | `@thallesp/nestjs-better-auth` | **2.8.0** | Peers: `@nestjs/core ^11.1.6 \|\| ^12.0.0`, `better-auth >=1.5.0 <2.0.0`, `express ^5.1.0`, TS `^5.9.2 \|\| ^6.0.0` |
| ORM | `drizzle-orm` | **0.45.4** | Peer includes `@neondatabase/serverless >=0.10.0` |
| DB driver | `@neondatabase/serverless` | **1.2.1** | HTTP driver for Neon |
| Migrations | `drizzle-kit` | latest at Phase 0 | Must match `drizzle-orm` minor |
| Animation | `framer-motion` | **14.14.0** | React 19 compatible; `motion` package is the renamed distribution |
| Icons | `lucide-react` | **1.73.0** | — |
| Workspace | `pnpm` | **12.21.0** | Workspaces + lockfile |
| Task runner | `turbo` | **2.11.11** | Optional; adopted for caching |

### Deliberately not adopted

| Package | Reason |
|---|---|
| `prisma` | `latest` dist-tag currently resolves to **8.0.0-rc.33**, a prerelease. Stable line is 7.10.1 (`prev`). Installing with `latest` would ship an RC into production. Rejected for v1; documented as an alternative. |
| `typescript@7` | Published (7.0.2) but outside the Auth adapter's declared peer range. |
| `tailwindcss@3` | v4 is current; v3 only as fallback if a plugin blocks v4. |

---

## 4. Frontend Solution Selection

NestJS renders no browser UI and provides no client router. A frontend must be chosen explicitly. Options evaluated:

| Option | SSR | Interactive UI (calendar, editor, waveform, 3D landing) | Auth integration | Verdict |
|---|---|---|---|---|
| **Next.js 16 (App Router)** | Yes — RSC + streaming | Full React 19; Framer Motion, Lucide, Tailwind 4 native | Cookie forwarded through a same-origin `/api` proxy to Nest | **Selected** |
| React Router 7 (framework mode) | Yes | Full React | Same proxy approach | Viable alternative; smaller ecosystem, no RSC |
| Vite + React with manual SSR | Custom | Full React | Same proxy approach | Rejected — SSR plumbing is bespoke work with no benefit |
| NestJS + Handlebars / HTMX | Yes (server templates) | Poor — no practical path for the animated calendar, editor and 3D hero | Native | Rejected — would remove required features |
| NestJS + Angular SSR | Yes | Heavy for this UI; team stack is React | Native-ish | Rejected — no requirement for Angular |

**Selected:** `apps/web` = **Next.js 16.4.6 + React 19.3.1**, consuming the Nest API.

Why this fits the product rather than the framework's marketing:
- The landing page needs 3D + scroll animation; the app needs a rich editor and live waveform. These are React-first requirements, and Framer Motion is React-native.
- RSC gives real SSR (first paint with data) without inventing a templating layer.
- Next.js is the most battle-tested SSR host for React 19 — lowest integration risk with Tailwind 4, Lucide and Framer Motion.

---

## 5. Authentication Feasibility — Better Auth in NestJS

**Verified compatible.** Two facts, both from the registry and the adapter's own documentation:

1. `@thallesp/nestjs-better-auth@2.8.0` declares `@nestjs/core ^11.1.6 || ^12.0.0` — our pin (12.5.0) is inside the range.
2. It declares `better-auth >=1.5.0 <2.0.0` — our pin (1.7.25) is inside the range.

Documented usage (from the package's own README): `AuthModule.forRoot({ auth })` in the root module mounts Better Auth's handler, provides `AuthGuard`, session access and hook decorators.

**Topology decision:**

```text
Browser ──same-origin──► apps/web (Next.js 16)
                              │ /api/* reverse-proxied (next.config rewrites in dev,
                              │           edge proxy in production)
                              ▼
                        apps/api (NestJS 12)
                              ├─ /api/auth/*  → Better Auth handler (session cookie issued here)
                              └─ /api/v1/*    → domain modules (guarded)
```

**Constraints this creates** (all documented, none blocking):
- Better Auth tables are generated by the Better Auth CLI, not hand-written — see [`DATABASE_SCHEMA.md`](DATABASE_SCHEMA.md) §3.1.
- The auth cookie is issued by the API origin. In dev, Next rewrites make it first-party. In production, both apps must sit behind one hostname (single origin), otherwise `SameSite` and CSRF origin checks fail.
- Server components must forward the incoming `Cookie` header to the internal API URL; there is no ambient session on the Next server.
- `BETTER_AUTH_URL` must equal the public origin, not the internal container URL.

---

## 6. Database Feasibility — Neon PostgreSQL

| Item | Verified fact |
|---|---|
| Driver | `@neondatabase/serverless@1.2.1` |
| ORM peer support | `drizzle-orm@0.45.4` lists `@neondatabase/serverless >=0.10.0` as a peer |
| Connection model | Pooled URL for runtime, direct URL for migrations |
| Better Auth schema | `npx auth@latest generate --adapter drizzle --dialect postgresql` produces the Drizzle schema for `user`, `session`, `account`, `verification` |
| Transaction support | Drizzle supports interactive transactions on the Node driver; the HTTP driver does not support long-lived transactions — **writes that need atomicity use the pooled node driver (`pg`) path, not the HTTP path** |

**Constraint:** the HTTP driver is faster for reads but cannot hold a transaction. Our rule (§Development Guidelines) requires atomic multi-row writes, so the API uses a `pg`-backed Drizzle instance for transactions and may keep the HTTP driver for read-only paths. This must be decided in Phase 0 and never mixed silently.

---

## 7. Runtime & Toolchain Constraints

| Constraint | Value | Consequence |
|---|---|---|
| Node.js | `>= 20.9.0` (Next 16), `>= 20` (Nest 12) | Node 20.9+ is the effective floor; local 24.18.0 satisfies it |
| TypeScript | **6.0.x** | TS 7 published but outside the auth adapter's peer range |
| Express | 5.x | Required by the auth adapter; Express 4 middleware patterns may not apply |
| Origins | One public origin in production | Cookies, CSRF and rewrites depend on it |
| Package manager | pnpm workspaces | Single lockfile at root; no per-app `node_modules` drift |
| Deployment | Two Node processes (`apps/web`, `apps/api`) | Cannot deploy as a single static bundle; SSR requires a Node host |

---

## 8. Open Constraints to Re-verify at Phase 0

| ID | Item | Why it must be re-checked |
|---|---|---|
| C1 | Exact `drizzle-kit` version matching `drizzle-orm@0.45.4` | Registry line moves; pin must match |
| C2 | `@nestjs/platform-express` Express 5 middleware compatibility for the auth adapter | Peer declares Express 5, but Nest 12's default adapter must be confirmed at install |
| C3 | Neon transaction path (`pg` vs HTTP) | Determines the DB module shape |
| C4 | Tailwind 4 + Next 16 config surface | v4 config is CSS-first; verify no plugin gap |
| C5 | `framer-motion` vs renamed `motion` package | Confirm a single distribution is used, not both |

---

## 9. Summary

| Question | Answer |
|---|---|
| Is NestJS 16 available? | **No.** Latest is 12.5.0. Project uses 12.5.0. |
| Is Next.js 16 available? | **Yes.** 16.4.6. |
| Is Better Auth + NestJS feasible? | **Yes**, via `@thallesp/nestjs-better-auth@2.8.0`, peer-verified for Nest 12. |
| Is Neon compatible? | **Yes**, Drizzle 0.45.4 + `@neondatabase/serverless` 1.2.1; transaction constraint noted. |
| TypeScript compatibility? | **6.0.3** — 7.x is outside a declared peer range. |
| Any invented claims? | None. Every version above came from the registry on 2026-11-16. |
