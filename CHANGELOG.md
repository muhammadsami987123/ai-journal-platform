# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **No version has been released yet.** The application is in the architecture phase: the
> specification and repository scaffolding exist, but there is no runnable build. The first planned
> release is **`v0.1.0`**, and it will be tagged only when the core journaling loop is implemented
> and tested. Entries below `Unreleased` are repository and documentation work, not product
> features.

---

## [Unreleased]

### Added

- **Product specification** — `docs/PLAN.md`: problem statement, feature set, journaling modes,
  AI behaviour, and post-core extensions.
- **Requirement register** — `docs/REQUIREMENTS.md`: numbered functional (`FR`) and non-functional
  (`NFR`) requirements, including privacy, performance and accessibility targets.
- **System architecture** — `docs/ARCHITECTURE.md`: two-app monorepo, one public origin, `/api`
  proxy topology, trust boundaries and layering rules.
- **Data model** — `docs/DATABASE_SCHEMA.md`: Better Auth tables plus `profiles`, `entries`,
  `questions`, `answers`, `moods`, `transcriptions`, `ai_generations`, `preferences`, `reminders`,
  and post-core `attachments`, `journal_chats`, `journal_chat_messages`, `reflections`.
- **API contract** — `docs/API_DOCUMENTATION.md`: versioned endpoints, payloads, error codes and
  pagination conventions.
- **Design system** — `docs/UI_UX_GUIDELINES.md`: tokens, typography, components, motion and
  accessibility rules.
- **AI specification** — `docs/AI_INTEGRATION.md`: structured-output contract, prompt rules,
  review-before-save guarantee, provider abstraction and failure handling.
- **Voice specification** — `docs/VOICE_JOURNAL.md`: capture, transcription, language handling,
  waveform behaviour and fallbacks.
- **Engineering standards** — `docs/DEVELOPMENT_GUIDELINES.md`: TypeScript strictness, testing,
  commits, reviews and quality gates.
- **Verified stack** — `docs/TECH_STACK.md`: registry-checked versions as of 2026-11-16, peer
  constraints, and the reasons Prisma and a separate frontend framework were rejected.
- **Execution plan** — `docs/TASKS.md`: 109 tasks across 16 phases with acceptance criteria.
- **Documentation index** — `docs/README.md`: reading order, document register and conventions.
- **Release process** — `docs/RELEASING.md`: semver policy, tag conventions, release-note content
  and changelog maintenance.
- **Monorepo skeleton** — `apps/api`, `apps/web`, `packages/{shared,database,config}` and
  `tests/e2e` with `.gitkeep` placeholders; no source files yet.
- **Repository documentation** — `README.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`,
  `SECURITY.md`, `CHANGELOG.md`, `.env.example`.
- **GitHub configuration** — issue templates (bug, feature, improvement), pull request template,
  CI structure and secret-scan workflow, release-note categorization config.
- **Implementation reports** — folder structure, stack migration and GitHub repository setup
  reports in `reports/implementation/`.

### Changed

- **Architecture direction** — replaced the earlier separate `frontend/`, `backend/`, `shared/`,
  `database/` layout with a NestJS `apps/api` + Next.js `apps/web` monorepo, and documented the
  migration and its rationale.
- **Git author identity** — corrected the commit email to the repository owner's verified address
  so contributions attribute to the correct GitHub account.

### Fixed

- **Stack assumption** — corrected the assumption that NestJS 16 exists; the current release line
  is NestJS 12.5.0, and all peer requirements were verified against it.

### Security

- **No secrets committed.** `.env` is ignored, `.env.example` carries placeholders only, and CI
  fails a pull request that adds a credential file.

### Notes

- The project is **source-available**, not OSI open source. See [`LICENSE`](LICENSE) and
  [`README.md`](README.md#-license).
- No screenshots, demo URL or deployment status is claimed anywhere, because none exists.

---

## [0.1.0] — Planned

**Not released.** Planned scope for the first tagged version, once implemented and tested:

- Monorepo foundation with linting, type checking and CI gates.
- Database schema, migrations and seed data.
- Custom authentication UI with Better Auth, session isolation verified across two accounts.
- Landing page, app shell and dashboard.
- Interactive calendar and the journal writing system (story editor, guided questions, mood).
- AI structuring with the mandatory review step.
- Voice journaling with transcript review.
- Journal history, search, and basic insights.
- Settings, profile and opt-in reminders.

Release criteria and the tagging procedure are defined in [`docs/RELEASING.md`](docs/RELEASING.md).

---

[Unreleased]: https://github.com/muhammadsami987123/ai-journal-platform/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/muhammadsami987123/ai-journal-platform/releases/tag/v0.1.0
