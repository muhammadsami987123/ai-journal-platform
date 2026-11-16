<!--
  Thanks for contributing. Keep this description short and factual — a reviewer should understand
  the change in under a minute. Delete sections that do not apply.
-->

## Summary

<!-- What does this PR change, and why? One or two sentences. -->

## Linked issue

<!-- Required for anything larger than a typo. Use "Closes #123" so the issue auto-closes on merge. -->

Closes #

## Type of change

- [ ] `feat` — new user-visible capability
- [ ] `fix` — bug fix
- [ ] `docs` — documentation only
- [ ] `refactor` — behaviour-preserving change
- [ ] `perf` — performance improvement
- [ ] `test` — tests only
- [ ] `build` — build system or dependencies
- [ ] `ci` — workflows and configuration
- [ ] `chore` — maintenance

## Scope

- [ ] `api` (NestJS)
- [ ] `web` (Next.js)
- [ ] `db` (schema, migrations, seeds)
- [ ] `shared` (types, contracts)
- [ ] `config` (tooling presets)
- [ ] `ai` / `voice`
- [ ] `docs` / `reports`
- [ ] repository root (README, LICENSE, templates, workflows)

---

## What changed

<!--
  Bullet points. Name the files or modules a reviewer should look at first.
  If this is a large diff, say where the risk is.
-->

-
-

## How was this verified?

<!--
  Be concrete. "Ran pnpm test" is weak; "ran pnpm test — 34 passing, added 3 cases covering
  cross-user access returning 404" is useful. For docs changes, say what you checked.
-->

- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes
- [ ] `pnpm build` passes
- [ ] Manually verified in a browser
- [ ] Verified with two separate user accounts (required for anything touching authorization or data isolation)

<!-- Gates above apply from Phase 0. Before application code exists, only the repository checks run. -->

## Documentation

- [ ] No documentation change needed
- [ ] Updated the relevant file in `docs/` (spec changed)
- [ ] Added an entry under `[Unreleased]` in `CHANGELOG.md`
- [ ] Updated `README.md` (status, setup, or feature tables changed)
- [ ] Added new environment variables to `.env.example` and documented them

## Breaking change?

- [ ] No
- [ ] Yes — described below

<!--
  If yes: what breaks, who is affected, and what is the migration path?
  Breaking changes under 1.0.0 are allowed but must be called out in the changelog.
-->

## Security checklist

- [ ] No secret, API key, token or `.env` file is included
- [ ] No real journal entry, transcript or personal data is included
- [ ] User-owned queries are still scoped by `user_id` (if data access changed)
- [ ] No secret is exposed to the browser bundle (if environment handling changed)
- [ ] User-supplied content is not rendered as raw HTML (if rendering changed)
- [ ] Input is validated at the boundary (if an endpoint was added or changed)

## Screenshots

<!-- Required for UI changes. Before and after, cropped to the relevant area. -->

## Reviewer notes

<!-- Anything you are unsure about, alternative approaches you rejected, or follow-up work deferred. -->
