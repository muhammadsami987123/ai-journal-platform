# Progress — Web UI smoke & stabilization

- **Date:** 2026-11-17
- **Phase:** Cross-cutting (Phases 3–12 implementation surfaces + smoke-level QA/docs)
- **Status:** At risk (core local flows working; formal acceptance matrix, provider-backed AI/STT runtime, and production deploy remain)

## Completed

- Local smoke verification of implemented web surfaces against live API/Neon with real data: auth, dashboard, journal create/edit/autosave/mood/questions/complete, settings (profile/preferences/appearance/reminders/privacy flows), profile, calendar (grid/deep link/day panel), journal list/search/filter/delete-restore, insights, voice UI, marketing landing, mobile spot checks. Evidence: [`../testing/2026-11-17-web-ui-smoke-verification.md`](../testing/2026-11-17-web-ui-smoke-verification.md).
- Fixed smoke-discovered issues: new-entry autosave hydration, mood-note action gating, dashboard week-start preference, journal filtered-empty states, insights completion-rate display. Evidence: [`../implementation/2026-11-17-web-ui-smoke-fixes-report.md`](../implementation/2026-11-17-web-ui-smoke-fixes-report.md).
- Quality gates (web): `typecheck`, `lint`, `build` passing.
- Demo screenshots captured and committed under `docs/assets/screenshots/`; README and `docs/TASKS.md` updated to reflect current state.

## In Progress

- Hardening/QA to meet strict per-task acceptance (two-account isolation, full responsive/a11y/failure/performance passes).
- Documentation alignment beyond README/tasks (architecture/ERD/API/limitations as required by T15.8).

## Not Started / Deferred

- **T13 (PLUS):** timeline, AI reflection, memories/attachments, talk-to-journal.
- **T15.7:** production deploy (two processes, one origin).
- Provider-backed runtime verification: AI generation (LLM keys) and server STT fallback (STT config).

## Blockers / Open Decisions

- D3 LLM provider/model, D4 STT fallback in v1, D5 reminder delivery (server/push variant), D6 attachment storage, D7 search approach — still open per `docs/TASKS.md`.
- External credentials/config required for AI/STT E2E.

## Next

1. Run formal two-account isolation and failure-mode passes; complete T14/T15 acceptance criteria with evidence.
2. Configure LLM/STT and verify AI review/approval and server transcription flows end-to-end.
3. Address remaining a11y/perf/responsive gaps and prepare single-origin production deployment.
4. Reconcile any API/UI contract nuances (e.g. `completion_rate` units) in docs.
