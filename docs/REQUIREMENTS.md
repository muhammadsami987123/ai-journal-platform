# Requirements

> **Status:** Design phase. Derived from [`PLAN.md`](PLAN.md). Identifiers are stable — never renumber, mark as deprecated instead.
> **Legend:** **P0** = release blocker · **P1** = required for v1 · **P2** = post-core extension.

---

## 1. Product Requirements (PR)

| ID | Priority | Requirement |
|---|---|---|
| PR-001 | P0 | A user can register, log in, log out, and stay logged in across sessions. |
| PR-002 | P0 | Every journal record is private to its owner and unreachable by any other account. |
| PR-003 | P0 | A user can write a long-form daily story in any language, saved as draft or complete. |
| PR-004 | P0 | A user can record their mood for a day and attach an optional note. |
| PR-005 | P0 | A user can answer guided daily questions, skip them, and add custom questions. |
| PR-006 | P0 | A user can navigate a calendar, see where entries and moods exist, and open any past date. |
| PR-007 | P0 | A user can speak their entry and receive a transcript plus an AI-structured journal for approval. |
| PR-008 | P0 | AI output is reviewed and explicitly approved before it becomes the saved journal. |
| PR-009 | P1 | A user can browse, search, filter, edit and delete their journal history. |
| PR-010 | P1 | A user can see real personal statistics: streaks, activity, mood distribution. |
| PR-011 | P1 | A user can opt in to a daily reminder at a chosen local time and timezone. |
| PR-012 | P2 | A user can browse a chronological life timeline of all entries. |
| PR-013 | P2 | A user can request an AI reflection over a date range. |
| PR-014 | P2 | A user can attach photos and documents to a specific date. |
| PR-015 | P2 | A user can ask natural-language questions answered from their own journal history. |

---

## 2. Functional Requirements (FR)

### 2.1 Authentication & Account

| ID | Priority | Requirement |
|---|---|---|
| FR-101 | P0 | Registration accepts name, email, password; validates format and password strength (min 8, not common). |
| FR-102 | P0 | Duplicate email registration returns a friendly, non-enumerating error. |
| FR-103 | P0 | Login failure returns a generic credential error (no email-existence disclosure). |
| FR-104 | P0 | Passwords are hashed by Better Auth — no custom or plaintext storage anywhere. |
| FR-105 | P0 | Sessions use httpOnly, secure (prod), sameSite cookies; logout invalidates server-side. |
| FR-106 | P0 | All protected routes redirect unauthenticated users to `/login?next=<path>`. |
| FR-107 | P0 | API endpoints return `401` JSON for missing/expired sessions (never redirect). |
| FR-108 | P1 | User can update display name, avatar, bio and timezone. |
| FR-109 | P1 | User can change password via Better Auth. |
| FR-110 | P1 | User can delete their account; all owned data cascades. |
| FR-111 | P1 | User can export their journal data. |

### 2.2 Journal Entries

| ID | Priority | Requirement |
|---|---|---|
| FR-201 | P0 | An entry belongs to one user and one calendar date (`entry_date`). |
| FR-202 | P0 | Multiple entries per date are allowed for the same user. |
| FR-203 | P0 | Entry lifecycle: `draft` → `complete`; completing an empty entry is rejected. |
| FR-204 | P0 | Autosave persists on idle (~1.5 s) with a visible save state. |
| FR-205 | P0 | `original_text` (user's own words) is never modified by AI or by later edits. |
| FR-206 | P0 | `final_text` changes only through explicit user action. |
| FR-207 | P0 | Server enforces a maximum entry length and reports it clearly. |
| FR-208 | P0 | Editor supports RTL and mixed-direction text (Urdu, Arabic, Hindi, English). |
| FR-209 | P1 | Deleting an entry requires explicit confirmation and is soft-deleted with a restore window. |
| FR-210 | P1 | Entry detail shows story, answers, mood, AI versions and timestamps. |

### 2.3 Guided Questions

| ID | Priority | Requirement |
|---|---|---|
| FR-301 | P0 | The system seeds 12 default reflection questions, in the specified order. |
| FR-302 | P0 | Every answer is bound to an entry and therefore to a date. |
| FR-303 | P0 | Skipping a question is persisted distinctly from leaving it empty. |
| FR-304 | P0 | A user can add custom questions, reusable across dates, visible only to them. |
| FR-305 | P1 | Custom questions can be deactivated without deleting historical answers. |

### 2.4 Mood Tracking

| ID | Priority | Requirement |
|---|---|---|
| FR-401 | P0 | Mood set is fixed: Happy, Excited, Peaceful, Motivated, Normal, Tired, Stressed, Sad, Frustrated, Anxious. |
| FR-402 | P0 | One mood per entry/date, editable, with an optional note. |
| FR-403 | P0 | Mood history is queryable by date range for charting. |

### 2.5 Calendar

| ID | Priority | Requirement |
|---|---|---|
| FR-501 | P0 | Month grid with weekday headers, leading/trailing days dimmed. |
| FR-502 | P0 | Prev/next month plus month-year picker; jump to today. |
| FR-503 | P0 | Day states: today, selected, has-entry, has-draft, mood indicator(s). |
| FR-504 | P0 | Selecting a day lists that date's entries and offers "new entry for this date". |
| FR-505 | P0 | Month data loads in a single scoped query (no N+1). |
| FR-506 | P1 | Deep links: `/calendar?date=YYYY-MM-DD` and `/journal?date=YYYY-MM-DD`. |

### 2.6 Voice Journaling

| ID | Priority | Requirement |
|---|---|---|
| FR-601 | P0 | Record audio with start/stop, and pause where the platform supports it. |
| FR-602 | P0 | Live waveform reflects real microphone amplitude. |
| FR-603 | P0 | Speech becomes text via the browser API, with an optional server STT fallback. |
| FR-604 | P0 | The user can preview and edit the transcript before generating. |
| FR-605 | P0 | The transcript is persisted as its own immutable record. |
| FR-606 | P0 | Microphone denial and unsupported browsers produce actionable guidance, never silent failure. |
| FR-607 | P0 | Language is selectable for dictation (English, Urdu, Hindi, extensible). |

### 2.7 AI Assistance

| ID | Priority | Requirement |
|---|---|---|
| FR-701 | P0 | AI transforms unstructured text/transcript into: Overview, Activities, Achievements, Challenges, Lessons, Reflections, Tomorrow's Goals. |
| FR-702 | P0 | Output must not invent events, people, feelings or facts. |
| FR-703 | P0 | Output preserves the user's language; translation is an explicit, additive option. |
| FR-704 | P0 | Output preserves the user's tone and writing style where possible. |
| FR-705 | P0 | Generation is editable and regenerable; nothing auto-saves. |
| FR-706 | P0 | Generation is append-only (`ai_generations`); prior versions are retained. |
| FR-707 | P0 | Provider, model and prompt version are configurable via environment. |
| FR-708 | P1 | Generation is rate-limited per user with a clear retry state. |

### 2.8 History & Search

| ID | Priority | Requirement |
|---|---|---|
| FR-801 | P1 | History list is cursor-paginated with date, mood, excerpt, status. |
| FR-802 | P1 | Full-text search over title, original text and final text. |
| FR-803 | P1 | Filters for mood, date range, status and has-AI-summary; composable and URL-synced. |
| FR-804 | P1 | All queries are user-scoped and cannot return foreign rows. |

### 2.9 Insights

| ID | Priority | Requirement |
|---|---|---|
| FR-901 | P1 | Metrics: total entries, current streak, longest streak, weekly and monthly activity, mood distribution, top emotions, completion rate. |
| FR-902 | P1 | Metrics are computed by SQL aggregation, not client-side full-table reads. |
| FR-903 | P1 | Zero-data states show guidance, never fabricated numbers. |
| FR-904 | P1 | Day bucketing respects `profiles.timezone`, including DST transitions. |

### 2.10 Reminders

| ID | Priority | Requirement |
|---|---|---|
| FR-1001 | P1 | User can enable/disable reminders and choose local time and timezone. |
| FR-1002 | P1 | Browser notification permission is requested only from an explicit user action. |
| FR-1003 | P1 | No notification is delivered without stored consent. |
| FR-1004 | P1 | Delivery is idempotent — at most one reminder per enabled day. |

### 2.11 PLUS (post-core)

| ID | Priority | Requirement |
|---|---|---|
| FR-1101 | P2 | Life timeline: chronological, grouped by month/year, infinite scroll. |
| FR-1102 | P2 | AI reflection over a range: recurring themes, achievements, challenges, lessons. |
| FR-1103 | P2 | Attachments: validated type/size, per-user isolation, signed URLs only. |
| FR-1104 | P2 | Talk to your journal: answers cite real entries; refuses when unsupported. |

---

## 3. Non-Functional Requirements (NFR)

### Security & Privacy

| ID | Requirement |
|---|---|
| NFR-001 | Server-side authorization on every read and write; client checks are UX only. |
| NFR-002 | ID tampering across accounts returns `404`, not `403` (no existence leak). |
| NFR-003 | Every request body, param and query is schema-validated; oversized payloads rejected. |
| NFR-004 | Secrets live only in environment variables; never in the client bundle. |
| NFR-005 | Security headers: CSP, HSTS (prod), frame-ancestors, `no-store` on private routes. |
| NFR-006 | Rate limits on auth, AI generation, voice and search endpoints. |
| NFR-007 | Logs carry request IDs but never journal text, transcripts or credentials. |
| NFR-008 | Journal content is never exposed through a public or unauthenticated endpoint. |

### Reliability

| ID | Requirement |
|---|---|
| NFR-009 | Multi-record writes use transactions; partial writes are impossible. |
| NFR-010 | Every async view has loading, empty and error states. |
| NFR-011 | Failures of the DB, AI provider, microphone or network degrade gracefully with no data loss. |
| NFR-012 | Autosave recovers content after tab close within the debounce window. |

### Performance

| ID | Requirement |
|---|---|
| NFR-013 | Dashboard LCP < 2.5 s on a mid-tier mobile connection. |
| NFR-014 | Landing page mobile Lighthouse Performance ≥ 85; CLS < 0.1. |
| NFR-015 | No N+1 queries; month calendar loads in one request. |
| NFR-016 | Heavy 3D and animation assets are lazy-loaded and excluded from the critical path. |

### Accessibility & Responsiveness

| ID | Requirement |
|---|---|
| NFR-017 | Keyboard-only journey completes registration through journal save. |
| NFR-018 | Visible focus indicators on all interactive elements. |
| NFR-019 | Body-text contrast ≥ 4.5:1. |
| NFR-020 | `prefers-reduced-motion` disables non-essential animation. |
| NFR-021 | Usable at 360, 768, 1024 and 1440 px with no horizontal scroll. |
| NFR-022 | Voice UI announces state changes to screen readers. |

### Maintainability

| ID | Requirement |
|---|---|
| NFR-023 | `apps/web` and `apps/api` share code only through `packages/shared`; the web app never imports from the API. |
| NFR-024 | Schema changes occur only through versioned migrations in `packages/database/migrations`. |
| NFR-025 | Strict TypeScript (6.0.x); no implicit `any` in application code. |
| NFR-026 | Every P0 requirement has an acceptance check in `reports/testing/`. |
| NFR-027 | Web and API deploy as two processes behind **one public origin**; `/api/*` is proxied so auth cookies stay first-party. |
| NFR-028 | No server secret and no internal API URL may appear in the browser bundle. |
| NFR-029 | Server-rendered pages deliver data on first paint (no client-side loading flash for dashboard, history or insights). |
| NFR-030 | Runtime versions are pinned exactly: NestJS 12.5.0, Next.js 16.4.6, TypeScript 6.0.3, Drizzle 0.45.4, Better Auth 1.7.25. |

---

## 4. Explicit Non-Goals (v1)

- Public or social journaling, sharing, followers, comments.
- Multi-user collaboration on an entry.
- Native mobile applications (responsive web only).
- Payments, subscriptions or billing.
- End-to-end encryption at rest (documented as a future consideration, not v1).
- Analytics that profile users across accounts.

---

## 5. Traceability

Requirement → task mapping lives in [`TASKS.md`](TASKS.md). Verification results are recorded in `../reports/testing/`. A requirement is only "done" when a test record exists for it.
