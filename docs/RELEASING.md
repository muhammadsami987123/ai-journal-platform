# Releasing

> **Status:** Process only. **No release has been published.** The repository is in the
> architecture phase and there is no runnable build to tag. The first planned version is
> `v0.1.0`.

This document defines how versions are numbered, tagged, documented and published. It is the
single source of truth for release mechanics; [`CHANGELOG.md`](../CHANGELOG.md) records what
actually changed.

---

## 1. Versioning Policy

The project follows [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html) — with one
project-specific interpretation, because this is an application, not a library.

| Segment | Meaning for this project |
|---|---|
| **MAJOR** | A change that forces existing users to migrate: data model breakage, an auth/session change that logs everyone out, removal of a documented endpoint or stored field, or a license change |
| **MINOR** | New user-visible capability, backwards compatible: a new journaling mode, new endpoint, new settings surface |
| **PATCH** | Backwards-compatible fixes: bugs, copy, styling, performance, dependency patches, security fixes without API change |

**Pre-1.0 convention.** While the version is `0.y.z`, the public surface is explicitly unstable:

- **MINOR** (`0.1.0` → `0.2.0`) may include breaking changes. These are still called out under
  `### Changed` / `### Removed` in the changelog and in the release notes.
- **PATCH** (`0.1.0` → `0.1.1`) never breaks documented behaviour.

`1.0.0` is reserved for the point where the core journaling loop is complete, tested, documented
and considered stable enough to promise compatibility. There is no date for it.

### Version identifiers

```text
v<MAJOR>.<MINOR>.<PATCH>          stable           v0.1.0
v<MAJOR>.<MINOR>.<PATCH>-rc.<N>   release candidate v0.1.0-rc.1
```

- Tags are **prefixed with `v`**; the changelog heading omits the `v`.
- Release candidates are tags, not GitHub Releases marked *latest*.
- Dates use ISO `YYYY-MM-DD`.
- Build metadata (`+sha`) is not used in tags.

---

## 2. Current Version State

| Item | Value |
|---|---|
| Latest published release | **none** |
| Latest tag | **none** |
| Next planned version | **`v0.1.0`** |
| Changelog section in progress | `[Unreleased]` |

Do not create a tag, release, or changelog version heading for work that has not shipped.

---

## 3. Release Criteria

A version may only be tagged when **all** of these hold. Until then, work stays under `Unreleased`.

1. Every task scoped to the version is complete in [`TASKS.md`](TASKS.md) and verified against a
   real database with **two separate accounts**.
2. `pnpm build`, `pnpm lint`, `pnpm typecheck` and `pnpm test` pass on a clean checkout.
3. Migrations apply from an empty database and from the previous release, with no manual step.
4. No secret, real journal content or credential exists in the tree, the bundle or the logs.
5. `README.md` reflects reality: status tables, roadmap phases and screenshots match what shipped.
6. `CHANGELOG.md` has a complete version section with a date.
7. Security-relevant changes were reviewed against [`SECURITY.md`](../SECURITY.md).
8. The license and copyright attribution are unchanged, or the change was deliberate and recorded.

**Production readiness is a separate claim.** Tagging `v0.1.0` means "implemented and tested", not
"hardened for public multi-tenant hosting". Deployment readiness is tracked in Phase 15.

---

## 4. Release Procedure

### Step 1 — Freeze scope

Decide the version number from the changes since the last tag using §1. Then stop adding work to
the release branch.

### Step 2 — Update the changelog

In [`CHANGELOG.md`](../CHANGELOG.md):

1. Rename `## [Unreleased]` to `## [X.Y.Z] — YYYY-MM-DD`.
2. Add a fresh, empty `## [Unreleased]` section above it.
3. Keep the ordering inside each section: **Added**, **Changed**, **Deprecated**, **Removed**,
   **Fixed**, **Security**. Omit empty headings.
4. Update the link references at the bottom of the file.
5. Write entries for humans: what changed, and why it matters. Not a commit dump.

### Step 3 — Verify the build

```bash
git switch main
git pull
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

All four gates must pass. Do not proceed on a warning-only run.

### Step 4 — Commit and tag

```bash
git add CHANGELOG.md
git commit -m "chore(release): prepare vX.Y.Z"

git tag -a vX.Y.Z -m "vX.Y.Z"
git push origin main
git push origin vX.Y.Z
```

Annotated tags only — lightweight tags carry no author or message.

### Step 5 — Publish the GitHub Release

```bash
gh release create vX.Y.Z \
  --title "vX.Y.Z" \
  --notes-file <(sed -n '/^## \[X.Y.Z\]/,/^## \[/p' CHANGELOG.md) \
  --latest
```

Or from the GitHub UI: **Releases → Draft a new release → choose the tag**.

- The release body mirrors the changelog section for that version.
- Mark **pre-releases** (any `-rc.N`) as *pre-release*, never *latest*.
- Attach build artifacts only if they actually exist and were produced by CI.

### Step 6 — Post-release

1. Verify the release page renders and the tag points at the right commit.
2. Confirm `main` is still green.
3. Open the next `## [Unreleased]` section if it does not exist.
4. Record anything surprising about the process in `reports/implementation/`.

---

## 5. Release Notes Content

A release note is written for someone deciding whether to upgrade. Required sections:

| Section | Content |
|---|---|
| **Headline** | One sentence: what this version is |
| **Highlights** | 1–5 user-visible changes, in plain language |
| **Breaking changes** | What breaks, what to do about it, migration steps |
| **Database changes** | New migrations and whether they are reversible |
| **Fixes** | Notable bugs closed |
| **Security** | Advisories, if any, with links |
| **Contributors** | Everyone whose work is included |
| **Known issues** | What is still broken — be honest |

Never state that a feature works when it does not. A short release note that is accurate beats a
long one that is aspirational.

---

## 6. GitHub Release Configuration

Release-note categorization is defined in [`.github/release.yml`](../.github/release.yml), which
groups automatically generated notes by label. It applies to auto-generated notes only; curated
release notes (the normal path) override it.

**Labels that steer categorization**

| Label | Section |
|---|---|
| `feature`, `enhancement` | ✨ Features |
| `bug`, `fix` | 🐛 Fixes |
| `documentation`, `docs` | 📚 Documentation |
| `security` | 🔒 Security |
| `performance` | ⚡ Performance |
| `dependencies` | ⬆️ Dependencies |
| `refactor`, `maintenance`, `chore`, `ci` | 🧹 Maintenance |
| `breaking-change` | ⚠️ Breaking Changes |

---

## 7. Changelog Maintenance

The changelog is maintained **in the pull request that makes the change**, not reconstructed at
release time.

| Rule | Detail |
|---|---|
| Update with the change | A PR that alters behaviour adds an `Unreleased` entry in the same PR |
| No commit dumps | Describe impact, not file names |
| Same-day dating | A version's date is the day it was tagged, not the day it was written |
| Never rewrite history | Published sections are append-only; corrections go in the next version |
| Link issues | Reference `#123` so readers can find the discussion |
| Internal work belongs too | Documentation, CI and refactors are recorded under the right heading |

**What does not belong:** dependency bumps that change nothing user-visible may be grouped into a
single `Maintenance` line. Typo fixes in code comments usually do not need an entry; typo fixes in
user-facing copy do.

---

## 8. Branch and Tag Protection

| Rule | Detail |
|---|---|
| `main` | Protected; pull requests only; no force-push; no deletion |
| Tags | `v*` tags are created by the maintainer only; existing tags are never moved or deleted |
| Re-release | If a release is broken, ship a new patch. Never re-tag the same version |
| Rollback | Revert the offending commit and release a patch; do not retro-edit the tag |

---

## 9. Pre-release and Rollback

**Pre-release.** Use `-rc.N` for a version that needs wider testing. It is published as a
*pre-release*, excluded from *latest*, and may still receive fixes as `-rc.N+1` before the final
tag.

**Rollback.** There are three legitimate responses to a bad release, in order of preference:

1. **Forward fix** — ship `X.Y.Z+1` with the correction. Almost always correct.
2. **Revert commit** — `git revert` the breaking change, release a patch.
3. **Unpublish** — only for a leaked secret or a legally problematic artifact; document the reason
   in the release notes, and rotate any exposed credential first.

---

## 10. Relationship to Other Documents

| Question | Document |
|---|---|
| What should the product do? | [`PLAN.md`](PLAN.md) |
| What is the build order? | [`TASKS.md`](TASKS.md) |
| What changed and when? | [`../CHANGELOG.md`](../CHANGELOG.md) |
| How do I contribute? | [`../CONTRIBUTING.md`](../CONTRIBUTING.md) |
| How are vulnerabilities handled? | [`../SECURITY.md`](../SECURITY.md) |
| What are the reuse terms? | [`../LICENSE`](../LICENSE) |
