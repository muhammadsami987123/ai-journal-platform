# Verification — Web UI smoke (local)

- **Date:** 2026-11-17
- **Environment:** Windows (win32), local dev (`apps/web` Next.js 16.4.6 on `:3000`, `apps/api` NestJS 12.5.0 on `:3001`, proxied `/api/*`), real Neon PostgreSQL-backed API, Playwright MCP browser automation.
- **Account:** existing user `m.samiwaseem1234@gmail.com` (single-account smoke; not a two-account isolation matrix).
- **Build checks:** `pnpm --filter @journal/web typecheck` PASS, `pnpm --filter @journal/web lint` PASS, `pnpm --filter @journal/web build` PASS (16 routes).

## Results

| Area / Requirement | Check performed | Result | Evidence |
|---|---|---|---|
| Auth (login) | Sign in with valid credentials, redirect to `/dashboard` | PASS | Landed on dashboard as `muhammad sami asghar mughal` |
| Dashboard render | Greeting, stats, recent entry, month context load with real data | PASS | `.smoke/dashboard.png`, `docs/assets/screenshots/dashboard.png`; Lora serif on headings confirmed |
| Entry create/autosave | `/journal/new` → type title/body, wait debounce, draft persisted and URL replaced | PASS | URL became `/journal/792f9902-5e8c-4a0d-9605-ce7dc5b62539`, save indicator `Saved` |
| Mood | Select `Peaceful` on entry, persisted to API | PASS | `GET /api/v1/entries/{id}` returned `mood.mood = "peaceful"` |
| Guided question | Answer first prompt, blur/tab save | PASS | UI showed `1 of 12 answered`; API returned `answers.length = 1` |
| Complete entry | `Mark complete` updates status/word count | PASS | API returned `status: "complete", word_count: 35`; UI showed `Complete` |
| Settings load | Profile, preferences, appearance, reminders, privacy sections render with real values | PASS | `.smoke/settings.png` |
| Appearance prefs | Switch accent to `sage` then back to `default`; toggle autosave off/on; persisted | PASS | `data-accent="sage"` + `/api/v1/me.preferences.theme_accent`/`autosave_enabled` reflected; restored to `default`, `true` |
| Reminders consent/denied | Enable daily reminder with browser channel (permission `default`) denied; switch to in-app records consent+enable; restore off/browser | PASS | Alert: "Permission was not granted. Reminders stay off until you allow them."; `/api/v1/reminders` observed `{enabled:true,channel:"in_app",consent:true}` then `{enabled:false,channel:"browser",consent:true}` |
| Profile | Identity card, insights strip, recent entries, behaviour summary render | PASS | `.smoke/profile.png`, recent entry `A long walk after work` visible |
| Calendar | Month grid (Mon start, week_starts_on respected), today highlight, day panel, deep link `?date=`, day selection updates panel/URL | PASS | `.smoke/calendar.png`; `/calendar?date=2026-11-17` showed Nov 17 entry; selecting Nov 18 showed empty day and URL `?date=2026-11-18` |
| Journal list & search | List shows entry; search hit/miss states; status filter (complete/draft) behaviour; delete + restore flow | PASS | `.smoke/journal.png`; `walk` search surfaced entry, `zzzznothing` showed "No entries match that search"; delete dialog → toast "moved to deleted" → `/journal?include_deleted=true` showed Deleted badge + Restore → restored (`deleted_at: null`) |
| Insights | KPIs, activity, moods, consistency/heatmap render from real single entry | PASS | `.smoke/insights.png`; after fix showed `COMPLETION 100%` (not 10000%), streak 1d, 1 entry/35 words, Peaceful 100%, heatmap day `2026-11-17` |
| Voice journal UI | Supported browser path renders recorder/language picker/privacy copy; start requests mic permission | PASS (UI/state) | `.smoke/voice.png`, `.smoke/voice-denied.png`; `SpeechRecognition` supported, "Requesting microphone permission…" shown on start |
| Landing/marketing | SSR/CSR render, hero serif typography, sections/layout, mobile width | PASS | `.smoke/landing.png`, `docs/assets/screenshots/mobile-landing.png`; `h1` computed font `Lora...serif` after fix; no horizontal overflow at 390px |
| Mobile app shell | Dashboard at 390px wide | PASS | `.smoke/mobile-dashboard.png`; `scrollWidth == viewport` (no horizontal overflow) |
| RSC/client boundaries | `buttonStyles` usable from marketing RSC layout/page | PASS | Build and runtime render succeeded after extracting to `button-styles.ts` |

## Bugs found & fixed during smoke

| Issue | Root cause | Fix |
|---|---|---|
| New entry autosave never created draft | `hydratedRef` only set when editing existing `id`; create flow guarded on it | Set `hydratedRef` once preferences settled for new entries (`entry-editor.tsx`) |
| Dead "Save mood note" before mood exists | Button shown when `id` truthy but no mood record yet | Show only when `detail.data?.mood` exists |
| Dashboard mini-calendar ignored `week_starts_on` | Hardcoded default week start | Read preference via `useMe` and pass to `MonthGrid` |
| Journal filtered-empty state misleading | `status=draft` (no results) showed "Your journal is empty" | Derive `filteredEmpty` from query/filters; show "No entries match those filters" with clear-filters action |
| Insights completion showed `10000%` | API returns `completion_rate` as percent (0–100, 0.1 precision) but UI multiplied by 100 again | Render `${data.completion_rate}%` |

## Not covered / blocked

- **Two-account isolation matrix (T15.2):** only single-account smoke performed; earlier API verification reported cross-user 404, but full matrix not re-run this pass.
- **AI generation E2E (T8.x runtime):** `LLM_API_KEY` not configured (503 path previously verified).
- **Server STT fallback E2E (T9.x runtime):** `STT_PROVIDER`/`STT_API_KEY` not configured (503 path previously verified).
- **Voice mic denied end-state:** headless automation remained at "Requesting microphone permission…"; denied/unsupported copy paths exist in code but not captured as a granted→denied browser permission transition here.
- **Full responsive/a11y/failure-mode/perf passes (T15.3–T15.6):** spot checks only (390px no overflow, `Cache-Control`/reduced-motion rules present in code); no formal Lighthouse/keyboard-only/DST/offline audit.
- **Production deploy (T15.7):** not performed.

## Notes

- Screenshots in `docs/assets/screenshots/` are synthetic-safe captures of the test account's own seeded/smoke data; no third-party private journal content included.
- Existing test-entry state after smoke: entry `792f9902-5e8c-4a0d-9605-ce7dc5b62539` (2026-11-17, `complete`, mood `peaceful`, 1 answer, 35 words) restored; reminder disabled (browser, consent recorded); prefs accent `default`, autosave `true`.
