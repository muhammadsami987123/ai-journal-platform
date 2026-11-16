# Implementation — GitHub Repository Setup

- **Date:** 2026-11-16
- **Tasks closed:** none from `docs/TASKS.md` — this is repository scaffolding ahead of Phase 0. Related upcoming work: Phase 0 (monorepo foundation, CI, environments).
- **Status:** Complete, with declared deviations (see [Deviations](#deviations))
- **Repository:** https://github.com/muhammadsami987123/ai-journal-platform
- **Visibility:** Public
- **Initial commit:** `657aa76` — `chore(repo): initialize repository with specification and GitHub tooling`
- **Latest published release:** none. **Tags:** none. **Planned first version:** `v0.1.0`.

---

## Scope

Created and configured the public GitHub repository that will host AI Journal, **before** any
application code is written. This covers: the custom source-available license, a 25-section README,
the community health files (`CONTRIBUTING`, `CODE_OF_CONDUCT`, `SECURITY`, `CHANGELOG`), the release
process document, all `.github/` templates and configuration, a CI workflow that validates only what
currently exists, and the repository settings (description, topics, features, merge policy).

No application source, no dependency install, no build configuration and no `package.json` were
created. The repository remains in the architecture phase.

---

## Repository Facts

| Property | Value |
|---|---|
| URL | `https://github.com/muhammadsami987123/ai-journal-platform` |
| Owner | `muhammadsami987123` |
| Visibility | **Public** |
| Default branch | `main` |
| Homepage URL | *(empty — no website exists yet)* |
| Description length | 273 / 350 characters |
| Topics | 20 (GitHub maximum) |
| Files in initial commit | 79 |
| Directories tracked | 64 |
| Markdown files in `docs/` | 13 |

### Repository description

> AI-powered personal journaling platform: write, speak or answer guided prompts, then let AI
> structure your day into a readable diary. Text + voice journaling, mood tracking, calendar,
> insights. NestJS + Next.js monorepo, self-hostable. Source-available; architecture phase.

Every claim in the description is either implemented today (monorepo structure, specification) or
explicitly labelled as a phase. Nothing asserts that a feature runs.

### Topics

```text
ai-diary               ai-journal            ai-writing-assistant   better-auth
digital-diary          drizzle-orm           journal-app            journaling
journaling-app         monorepo              mood-tracker           neon
nestjs                 nextjs                personal-journal       postgresql
speech-to-text         tailwindcss           typescript             voice-journaling
```

Rules applied (verified against GitHub's documentation): lowercase letters, numbers and hyphens
only; ≤ 50 characters each; maximum 20 topics. The first five are the primary search terms
(`ai-journal`, `ai-diary`, `journaling`, `personal-journal`, `digital-diary`); the remainder cover
the stack and the differentiating capabilities (voice, mood tracking, AI assistance).

**Deliberately not used as a topic:** `open-source`. The license forbids commercial use, so the
project is source-available — see [License](#license).

### Repository features configured

| Feature | State | Notes |
|---|---|---|
| Issues | ✅ Enabled | Three YAML issue forms; blank issues disabled |
| Discussions | ✅ Enabled | For questions, spec debate and commercial-license enquiries |
| Wiki | ❌ Disabled | `docs/` is the single source of truth; a second wiki would drift |
| Projects | ❌ Disabled | Not needed yet; can be enabled per-milestone |
| Pull requests | ✅ Enabled | Squash merge only; branch deleted on merge; auto-merge allowed |
| Merge commits / rebase merge | ❌ Disabled | Keeps `main` linear; matches the commit convention |
| Releases | ✅ Configured, none published | `docs/RELEASING.md` + `.github/release.yml`; `v0.1.0` planned |
| Private vulnerability reporting | ✅ Enabled | GitHub Security Advisories; referenced by `SECURITY.md` |
| Issue/PR templates | ✅ Configured | See [Files created](#files-created) |
| Branch protection | ✅ Configured after the final push | Force-pushes and branch deletion blocked on `main` |
| GitHub Pages / homepage | ❌ None | No site exists; nothing invented |

---

## Files Created

### Root

| Path | Purpose |
|---|---|
| `LICENSE` | AI Journal Source-Available License 1.0 — 12 sections, custom |
| `README.md` | 25-section README: overview, features, stack, architecture, roadmaps, license |
| `CONTRIBUTING.md` | Workflow, commit convention, quality gates, review process, contribution license |
| `CODE_OF_CONDUCT.md` | Project-specific conduct standard, enforcement ladder, appeal path |
| `SECURITY.md` | Supported versions, private reporting, response SLA, threat model, invariants |
| `CHANGELOG.md` | Keep a Changelog format; `[Unreleased]` populated; no released version |
| `.gitattributes` | LF normalization, binary rules, linguist hints |
| `.editorconfig` | Whitespace and encoding consistency |
| `.gitignore` | Extended check — already existed; `.env*` ignored, `!.env.example` allowed |
| `.env.example` | Already existed; verified to contain placeholders only |

### `.github/`

| Path | Purpose |
|---|---|
| `ISSUE_TEMPLATE/bug_report.yml` | Structured bug form; area, repro, environment, secret-redaction acknowledgement |
| `ISSUE_TEMPLATE/feature_request.yml` | Problem-first feature form with scope and impact fields |
| `ISSUE_TEMPLATE/improvement.yml` | Docs, refactor, tooling and process improvements |
| `ISSUE_TEMPLATE/config.yml` | Disables blank issues; routes to Discussions, security reporting and docs |
| `pull_request_template.md` | Summary, linked issue, type/scope, verification, docs, security checklist |
| `workflows/ci.yml` | Repository checks: structure, docs links, template validity, secrets scan |
| `release.yml` | Release-note categorization by label |

### `docs/`

| Path | Purpose |
|---|---|
| `RELEASING.md` | Semver policy, version identifiers, release criteria, tagging procedure, rollback |
| `README.md` *(edited)* | Added `RELEASING.md` to the reading order and the document register |

No existing document was deleted or rewritten. `docs/PLAN.md` and `docs/TASKS.md` were not touched.

---

## License

### Requirement

Permit: reading, personal use, study, modification, improvement, private local versions, upstream
contributions. Forbid: claiming original authorship, removing copyright/attribution, presenting the
work as one's own, rebranding, redistribution and commercial exploitation.

### Options evaluated

| License | Permits the 7 allowed actions | Blocks commercial use | Blocks rebranding | Fits the requirement |
|---|---|---|---|---|
| **MIT** | ✅ | ❌ | ❌ | ❌ |
| **Apache-2.0** | ✅ | ❌ | ❌ (trademark not granted, but a fork may be renamed) | ❌ |
| **GPL-3.0** | ✅ | ❌ (selling is permitted) | ❌ | ❌ |
| **PolyForm Noncommercial 1.0.0** | ✅ | ✅ | ❌ (needs a separate notice/trademark clause) | ⚠️ partial |
| **Custom source-available** | ✅ | ✅ | ✅ | ✅ |

**The requirement is incompatible with every OSI-approved open-source license.** The Open Source
Definition forbids discrimination against fields of endeavour (§6) and against persons or groups
(§5), so a non-commercial restriction can never be OSI open source. Using the phrase "open source"
anywhere in the repository would be inaccurate, so it is not used as a claim anywhere.

### Decision

**AI Journal Source-Available License 1.0**, SPDX identifier `LicenseRef-AIJournal-SAL-1.0`.
Confirmed by the project owner before the file was written.

| Grant (§2) | Prohibition (§4) |
|---|---|
| Read and study | Commercial use |
| Personal use | Redistribution or publication of copies/derivatives |
| Run locally or on own infrastructure | Claiming authorship |
| Modify and create private derivative works | Removing or altering attribution |
| Improve features | Rebranding or presenting as an original product |
| Maintain private local versions | Using the project marks |
| Contribute upstream (§5) | Removing provenance metadata |

Additionally: attribution retention (§3.1), a required derivative-work statement (§3.2), a
change log requirement (§3.3), automatic termination on breach (§7), trademark carve-out (§6),
and a commercial-licensing path (§11).

### Honest limitations, stated in the file and here

1. **A license cannot stop someone from *saying* they wrote it.** Copyright protects the code, not
   public claims. The counterweights are the attribution clause (a clear, provable breach), the
   trademark carve-out, and passing-off / unfair-competition law.
2. **A custom license is untested in court and is not legal advice.** The file says so explicitly
   and recommends review by a qualified lawyer before enforcement.
3. **"Source-available" adoption is lower than MIT/Apache-2.0.** Contributors are still welcome;
   the license grant for contributions (§5) is broad enough for the project to ship their work.

---

## GitHub Actions

`.github/workflows/ci.yml` runs four jobs on pull requests and pushes to `main`:

| Job | What it verifies |
|---|---|
| `structure` | Required root files exist; documented directories exist; reports whether any app source has appeared |
| `docs` | Every relative markdown link resolves; reports trailing whitespace |
| `templates` | `.github/**/*.yml` parses as YAML; issue forms have `name`, `description` and a non-empty `body` with valid elements |
| `secrets` | No `.env` file is tracked; no AWS/GitHub/OpenAI-style key, private key or credential-bearing Postgres URL is committed |
| `application-gates` | Detects `package.json` + `pnpm-lock.yaml`. If absent, prints a skip notice; if present, runs install → lint → typecheck → test → build |

**No workflow depends on a script that does not exist.** The lint/typecheck/test/build steps are
conditional on the workspace actually existing, which happens in Phase 0. This is deliberate: a CI
workflow that fails on every run teaches people to ignore CI.

The secrets scan excludes `*.md` and `*.example` so that documentation may describe a key format and
`.env.example` may show placeholders, while real credential material in code still fails the build.

---

## Release Configuration

| Item | Status |
|---|---|
| Versioning scheme | Semantic Versioning 2.0.0, with a documented pre-1.0 interpretation |
| Tag format | `v<MAJOR>.<MINOR>.<PATCH>`, annotated tags only; `-rc.N` for candidates |
| Changelog | `CHANGELOG.md`, Keep a Changelog 1.1.0; `[Unreleased]` populated |
| Release notes | Curated from the changelog; required sections defined in `docs/RELEASING.md` §5 |
| Auto-generated notes | `.github/release.yml` groups by label; curated notes override it |
| Release criteria | 8 explicit gates in `docs/RELEASING.md` §3, including two-account verification |
| Initial version | **`v0.1.0`** — planned, **not** tagged |
| Published releases | **none** |
| Tags pushed | **none** |

`v0.1.0` is defined in `CHANGELOG.md` as a planned scope, and the compare link is written as
`v0.1.0...HEAD` so it resolves harmlessly before the tag exists.

**Production readiness is not claimed.** Being tagged means "implemented and tested"; hardened
public hosting is Phase 15, and the README says so.

---

## Verification

### Git and push

| Check | Result |
|---|---|
| `git init -b main` | ✅ Branch `main` |
| Local `user.name` / `user.email` | `Muhammad Sami` / `m.samiwaseem1234@gmail.com` (corrected) |
| Secrets before commit | ✅ No credential pattern; only `.env.example` staged |
| Commit | ✅ `657aa76`, 79 files, 64 directories |
| Push | ✅ `refs/heads/main` → `657aa76` |
| Remote default branch | ✅ `main` |

The first push attempt failed with `RPC failed; curl 55 ... Connection was reset` and
`send-pack: unexpected disconnect` — a network/transport failure, not a permission problem. The
repository had already been created on the server at that point. The retry succeeded after setting
`http.version = HTTP/1.1` and `http.postBuffer = 524288000`. Both settings are local to this clone,
so a fresh clone of the repository is unaffected.

### Repository state after configuration

```text
name                 ai-journal-platform
visibility           PUBLIC
defaultBranchRef     main
hasIssuesEnabled     true
hasDiscussionsEnabled true
hasWikiEnabled       false
homepageUrl          (empty)
allow_squash_merge   true
allow_merge_commit   false
allow_rebase_merge   false
delete_branch_on_merge true
allow_auto_merge     true
```

### Not verified (and why)

| Item | Reason |
|---|---|
| CI run on GitHub | The workflow was pushed with the initial commit; its first run must be observed on the Actions tab. Nothing else can be asserted here. |
| Rendered issue/PR templates | Templates render when a user opens the form; YAML validity is checked locally and in CI. |
| Security advisory flow | Cannot be exercised without a real report — that would be dishonest to simulate. |
| Screenshots, demo, deployment | Do not exist. Not claimed anywhere. |

---

## Deviations

| Specification says | Implemented as | Reason |
|---|---|---|
| `reports/implementation/README.md` naming: `YYYY-MM-DD-<change>-report.md` | `github-repository-setup-report.md` | The exact filename was specified in the task. Declared here rather than silently ignored. |
| README SEO list includes "Open Source Journal Application" | Term appears only as a related phrase, never as a claim about this project | The license forbids commercial use, so the project is not OSI open source. Claiming it would be a false statement — and a licensing risk. |
| README must include screenshots and a demo | Both sections exist and state plainly that neither exists yet, with a table of which phase will populate them | No interface has been built. Generated mockups would misrepresent the project. |
| Repository may have a website URL | Homepage left empty; README says "none yet" | No site exists. |
| `.gitignore` and `.env.example` | Already existed; verified rather than rewritten | They were correct for the monorepo; rewriting them would have been churn. |
| `plan.md` / `task.md` | Not modified | Moved to `docs/PLAN.md` / `docs/TASKS.md` earlier; left untouched per instruction. |

---

## Known Limitations

1. **No application code, no `package.json`, no lockfile.** Every install/dev command in the README
   is labelled *planned* and marked as not runnable today.
2. **CI validates repository hygiene only.** Real lint/test/build gates activate automatically once
   Phase 0 adds the workspace, but have never executed.
3. **The custom license is untested.** See [License](#license) — legal review is recommended before
   relying on it.
4. **Single maintainer.** Response-time targets in `SECURITY.md` and `CONTRIBUTING.md` are good-faith
   aims, not guarantees, and both documents say so.
5. **No branch protection enforcement history.** Rules were applied after the initial push; the
   first pull request will be the first real test.
6. **A visitor may still assume "open source".** The README states otherwise in the badge, the
   License section and the license file header, but habit is hard to correct.

---

## Follow-ups

| # | Action | When |
|---|---|---|
| 1 | Watch the first CI run on the Actions tab and fix anything it surfaces | Now |
| 2 | Social preview image (1280×640): title, one-line pitch, stack strip, "Source-available" mark — upload under **Settings → Social preview** | Before the first public announcement |
| 3 | Add repository labels matching `.github/release.yml` (`feature`, `bug`, `security`, `docs`, `dependencies`, `breaking-change`, …) | Before the first issue |
| 4 | Add `CODEOWNERS` once more than one maintainer exists | With the first external contributor |
| 5 | Create the `v0.1.0` milestone from `docs/TASKS.md` phases 0–2 | Start of Phase 0 |
| 6 | Add a `dependabot.yml` once dependencies exist | Phase 0 |
| 7 | Re-evaluate license wording with a lawyer before any commercial licensing conversation | Before enforcement is needed |
| 8 | Publish the documentation site and set the repository homepage | After `v0.1.0` |

---

## Summary

The repository is public, documented, licensed, templated and CI-checked, and it honestly describes
itself as an architecture-phase project with no runnable application. Nothing is claimed that does
not exist: no screenshots, no demo URL, no deployment status, no release, no tag, no "production
ready" badge. The next commit starts Phase 0.
