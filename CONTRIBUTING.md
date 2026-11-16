# Contributing to AI Journal

Thanks for your interest. This document explains how to contribute without wasting your time or
ours.

> **Current phase: architecture.** There is no application code yet. The most valuable
> contributions right now are corrections and improvements to the **specification** in
> [`docs/`](docs/README.md) — ambiguities, contradictions, missing edge cases, security gaps.
> Code contributions become the main path from Phase 0 onward.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Where to Start](#where-to-start)
- [Reporting a Bug](#reporting-a-bug)
- [Requesting a Feature](#requesting-a-feature)
- [Proposing a Cross-Cutting Change](#proposing-a-cross-cutting-change)
- [Contributing Code or Documentation](#contributing-code-or-documentation)
- [Commit Convention](#commit-convention)
- [Branch Naming](#branch-naming)
- [Quality Gates](#quality-gates)
- [Review Process](#review-process)
- [Contribution License](#contribution-license)
- [Recognition](#recognition)
- [Questions](#questions)

---

## Code of Conduct

Participation is covered by [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md). Read it once; it is short.

---

## Where to Start

| You want to | Do this |
|---|---|
| Report something broken or wrong | Open an issue using the **Bug report** template |
| Suggest new behaviour | Open an issue using the **Feature request** template |
| Suggest a refactor, doc fix, or ergonomics improvement | Open an issue using the **General improvement** template |
| Discuss an idea that is not yet a task | Start a thread in **Discussions** |
| Send a fix you have already written | Open a PR that links an issue |

**Do not start with a large pull request.** For anything bigger than a typo, or bigger than a
single file, open an issue first. We would rather spend five minutes agreeing on the approach than
reviewing a week of work that cannot be merged.

If you want a task to work on, look at [`docs/TASKS.md`](docs/TASKS.md) — every task has explicit
acceptance criteria. An issue labelled `good first issue` is also a safe starting point.

---

## Reporting a Bug

Use the [Bug report template](.github/ISSUE_TEMPLATE/bug_report.yml) and include:

1. **What you expected** and **what actually happened**.
2. **Exact reproduction steps**, minimal.
3. **Environment** — OS, Node version, pnpm version, browser and version, commit SHA.
4. **Relevant logs** — truncated, with secrets removed.

**Never paste** real journal entries, transcripts, session cookies, `BETTER_AUTH_SECRET`, API
keys or database URLs. If a bug cannot be described without private content, redact it and say so;
we will ask for more detail privately if needed.

Security vulnerabilities do **not** belong in the public tracker — see [`SECURITY.md`](SECURITY.md).

---

## Requesting a Feature

Use the [Feature request template](.github/ISSUE_TEMPLATE/feature_request.yml). A useful request
contains:

1. **The problem**, in user terms — not the solution you have in mind.
2. **Who it is for** and how often it applies.
3. **What you currently do instead.**
4. **Your proposed behaviour**, and what you deliberately left open.

Before opening it, check [`docs/PLAN.md`](docs/PLAN.md) and [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md).
If the feature is already specified, the useful contribution is a correction to that spec, not a
duplicate issue.

---

## Proposing a Cross-Cutting Change

Changes that touch architecture, the data model, the API contract or the design system need an
issue before a PR. Name the document you are changing:

| Change | Document to update |
|---|---|
| A new module, layer or trust boundary | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) |
| A table, column, index or constraint | [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md) |
| An endpoint, payload or status code | [`docs/API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md) |
| A token, component or interaction pattern | [`docs/UI_UX_GUIDELINES.md`](docs/UI_UX_GUIDELINES.md) |
| A prompt, model call or output contract | [`docs/AI_INTEGRATION.md`](docs/AI_INTEGRATION.md) |
| The voice pipeline | [`docs/VOICE_JOURNAL.md`](docs/VOICE_JOURNAL.md) |
| A dependency or version pin | [`docs/TECH_STACK.md`](docs/TECH_STACK.md) |
| Build order or acceptance criteria | [`docs/TASKS.md`](docs/TASKS.md) |

One fact, one home. Do not restate the schema inside the API document, and do not restate the
architecture inside a report.

---

## Contributing Code or Documentation

### 1. Fork and branch

```bash
git clone https://github.com/<your-username>/ai-journal-platform.git
cd ai-journal-platform
git remote add upstream https://github.com/muhammadsami987123/ai-journal-platform.git
git switch -c feat/short-description main
```

### 2. Make a focused change

- **One concern per pull request.** A refactor bundled with a feature is two PRs.
- **Match the surrounding code.** Follow [`docs/DEVELOPMENT_GUIDELINES.md`](docs/DEVELOPMENT_GUIDELINES.md):
  strict TypeScript, no `any`, colocated tests, no new dependency without justification.
- **Update the specification in the same PR** if you change a documented behaviour.
- **Never commit secrets.** `.env` is ignored; use `.env.example` for new variables and document
  them in `README.md`.

### 3. Keep history clean

```bash
git fetch upstream
git rebase upstream/main
```

Squash fixup commits before requesting review. We merge squash-style, so a tidy branch history is
nice but not mandatory.

### 4. Open the pull request

Fill in the [pull request template](.github/pull_request_template.md) — including the linked
issue, what changed, how you verified it, and whether it changes any documented behaviour.

---

## Commit Convention

[Conventional Commits](https://www.conventionalcommits.org/). Format:

```text
<type>(<scope>): <subject>

<body — why, not what>

<footer — BREAKING CHANGE, Refs #123>
```

| Type | Use for |
|---|---|
| `feat` | New user-visible capability |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `refactor` | Behaviour-preserving code change |
| `perf` | Performance improvement |
| `test` | Tests only |
| `build` | Build system, dependencies, lockfile |
| `ci` | CI/CD configuration |
| `chore` | Maintenance, no product effect |
| `style` | Formatting only |

**Scopes:** `api`, `web`, `db`, `shared`, `config`, `ai`, `voice`, `auth`, `ci`, `docs`, `repo`.

```text
feat(api): scope journal repository queries by user id
fix(web): keep session cookie first-party through the /api proxy
docs(adr): record Drizzle over Prisma
```

Subject line: imperative, lowercase, no trailing period, ≤ 72 characters.

---

## Branch Naming

```text
<type>/<short-kebab-description>
```

Examples: `feat/calendar-month-view`, `fix/voice-permission-fallback`, `docs/api-error-codes`.

Never commit directly to `main`. It is protected and requires a pull request.

---

## Quality Gates

A pull request is mergeable when all of the following are true. Gates that depend on application
code apply from the phase in which that code exists — until then, only repository-level checks run.

| Gate | Requirement |
|---|---|
| Structure check | Repository layout matches the documented architecture |
| Docs links | No broken relative link inside `README.md`, `docs/`, `reports/` |
| Secrets scan | No credential, key or `.env` file added |
| Type check | `pnpm typecheck` passes — from Phase 0 |
| Lint | `pnpm lint` passes with zero warnings — from Phase 0 |
| Tests | `pnpm test` passes; new behaviour is covered — from Phase 0 |
| Build | `pnpm build` succeeds for both apps — from Phase 0 |
| Review | At least one approving review from a maintainer |

Do not disable, skip or weaken a gate to get a PR merged. Fix the underlying problem.

---

## Review Process

1. A maintainer triages the issue or PR, usually within a few days. This is a single-maintainer
   project, so silence is scheduling, not rejection — a polite ping after a week is fine.
2. Review comments are grouped as **blocking** (must fix) and **suggested** (your call).
3. Address feedback with new commits; do not force-push over review history while it is open.
4. Once approved and green, a maintainer merges.
5. The change is recorded in [`CHANGELOG.md`](CHANGELOG.md) under `Unreleased`.

**Reasons a PR may be closed without merge**

- It implements something explicitly out of scope for the current phase.
- It adds a dependency or service the project has decided against.
- It changes licensing, authorship or attribution.
- It contains secrets, unlicensed third-party code, or copied code without attribution.

---

## Contribution License

By submitting a contribution — code, documentation, design, issue text or review suggestion — you
agree that:

1. You have the right to submit it, and it is your original work or properly licensed.
2. It may be used, modified, distributed and **relicensed as part of the project** under the
   project's license, per [`LICENSE`](LICENSE) §5.
3. You receive credit as a contributor, but **no ownership or co-authorship of the project** and no
   rights to the project marks.
4. You will not be paid unless a separate written agreement says otherwise.

The project is **source-available, not open source**: see [`LICENSE`](LICENSE) §2–§4 before
planning to reuse substantial portions of the codebase.

---

## Recognition

Contributors are credited in the release notes of the version that includes their work. Significant
design or architectural contributions may be acknowledged in
[`reports/implementation/`](reports/implementation/) and in the repository's contributor list.

---

## Questions

- Something unclear in the spec → open a **Discussions** thread.
- Something wrong in the spec → open an **improvement** issue.
- Private or security matter → [`SECURITY.md`](SECURITY.md).

Please be patient and specific. A precise question gets a precise answer.
