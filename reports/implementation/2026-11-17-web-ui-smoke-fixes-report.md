# Implementation — Web UI smoke fixes & demo capture

- **Date:** 2026-11-17
- **Tasks closed (partial/contributing):** supports T3.1–T3.9, T4.1–T4.4, T5.1–T5.6, T6.1–T6.6, T7.1–T7.7, T9.1–T9.6 (UI), T10.1–T10.7, T11.1–T11.4 (UI), T12.1–T12.5, T15.1/T15.3 (smoke-level), T15.8 (docs/screenshots). Formal acceptance against all criteria/two-account matrix not fully re-certified in this pass.
- **Status:** Complete for the scoped fixes and documentation/demo updates; partial overall QA/release.

## Scope

Ran an end-to-end local smoke test of the implemented web surfaces against the live API/Neon DB using an existing account, fixed issues discovered during the pass, captured demo screenshots, and updated repository documentation/reports to reflect the current implemented state.

## Files

| Path | Change |
|---|---|
| `apps/web/src/features/journal/entry-editor.tsx` | Fix: mark new-entry editor hydrated once preferences settle so first autosave creates draft; show "Save mood note" only when a mood record exists |
| `apps/web/src/app/(app)/dashboard/page.tsx` | Fix: pass `week_starts_on` from `/me` preferences into dashboard mini `MonthGrid` |
| `apps/web/src/features/journal/journal-list.tsx` | Fix: distinguish filtered-empty vs truly-empty states ("No entries match those filters" / clear action) |
| `apps/web/src/features/insights/insights-view.tsx` | Fix: render `completion_rate` as returned percent (remove extra `*100`) |
| `apps/web/src/app/layout.tsx` | Fix (prior in branch context, retained): font CSS variables on `<html>` so theme serif tokens resolve at `:root` |
| `apps/web/src/components/ui/button.tsx`, `apps/web/src/components/ui/button-styles.ts` | Fix (prior in branch context, retained): RSC-safe `buttonStyles` extraction for marketing/server usage |
| `apps/web/src/app/globals.css` | Tokens, prose, accent presets, reduced-motion rules (prior in branch context, retained) |
| `docs/assets/screenshots/*.png` | New: demo captures (landing, dashboard, editor, settings, profile, calendar, journal, insights, voice, voice-denied, mobile dashboard/landing) |
| `README.md` | Updated: status, screenshots/previews, demo/install/dev notes to reflect implemented local app |
| `docs/TASKS.md` | Updated: checkboxes for tasks evidenced by implementation/smoke (with honest partials where criteria not fully met) |
| `reports/testing/2026-11-17-web-ui-smoke-verification.md` | New: smoke verification evidence |
| `reports/progress/2026-11-17-web-ui-smoke-progress.md` | New: progress snapshot |
| `.gitignore` | Added `.smoke/` local capture directory |

## Database Changes

None in this pass. Relies on existing schema/migrations and live Neon data.

## Environment

No new variables introduced. Smoke used existing `API_INTERNAL_URL`, `NEXT_PUBLIC_SITE_URL`, and configured API env.

## Deviations

| Specification / prior assumption | Implemented / observed as | Reason |
|---|---|---|
| Insights `completion_rate` treated as 0–1 in UI math | API returns percent value (0–100, 0.1 precision); UI now displays directly | Matched API contract/observed payload; avoids 10000% display |
| New-entry autosave implied immediate draft creation | Draft created on first non-empty autosave after preferences settle, then URL replaced | Required hydration/ready guard; preserves "create on first meaningful content" intent |
| Journal empty copy same for all no-result cases | Distinct copy for search-miss, filter-miss, deleted-only-empty, and true-empty | Accuracy and clearer recovery actions (discovered during smoke) |
| README previously stated "no application code yet / no screenshots" | Updated to reflect implemented local surfaces with captured demos; deployment still absent | Documentation must match reality |

## Verification

- Automated checks: `pnpm --filter @journal/web typecheck` PASS, `lint` PASS, `build` PASS.
- Manual/automated smoke: see [`../testing/2026-11-17-web-ui-smoke-verification.md`](../testing/2026-11-17-web-ui-smoke-verification.md).
- Spot responsive check: 390px dashboard and landing showed no horizontal overflow.

## Known Limitations

- Single-account smoke; full two-account isolation matrix not re-run.
- AI generation and server STT require provider keys (runtime E2E blocked/unconfigured).
- Voice permission-denied terminal state not captured as a full browser-permission transition in this run.
- No production deployment; no formal Lighthouse, keyboard-only, DST, or offline-failure audit in this pass.

## Follow-ups

- Run full `T15.1–T15.6` acceptance passes (incl. two-account, 360/768/1024/1440, a11y, failure modes, performance budgets).
- Configure LLM/STT providers and verify T8/T9 runtime flows end-to-end.
- Resolve open decisions D3–D7 and complete Phase 13/14/15 release gates as applicable.
- Consider API-side `completion_rate` contract documentation if consumers expect 0–1 ratio.
