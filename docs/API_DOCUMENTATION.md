# API Documentation

> **Status:** Design phase — planned contract. No endpoints exist yet.
> **Base path:** `/api/v1` — NestJS controllers (`apps/api`) with global prefix `api` and URI versioning. `/api/auth/*` is mounted by `@thallesp/nestjs-better-auth` from the same Nest application.
> **Public origin:** the browser always calls the Next.js origin; `/api/*` is rewritten to the API (dev) or routed by the edge proxy (prod). No cross-origin calls exist.

---

## 1. Conventions

### Request

| Aspect | Rule |
|---|---|
| Format | JSON (`application/json`), except multipart for attachments |
| Auth | Session cookie (httpOnly). No bearer tokens in v1 |
| Consumer | `apps/web/src/lib/api/` only — no component calls `fetch` directly |
| Validation | Shared schemas from `packages/shared/schemas`, enforced by a Nest validation pipe |
| Docs | OpenAPI generated from Nest decorators at `/api/docs` (non-production only) |
| IDs | UUID v4 strings |
| Dates | Calendar dates as `YYYY-MM-DD`; instants as ISO-8601 UTC |
| Pagination | Cursor-based: `?cursor=<opaque>&limit=20` (max 100) |
| Idempotency | Writes that may be retried accept `Idempotency-Key` |

### Response envelope

```json
{ "data": { }, "meta": { "requestId": "req_...", "cursor": "..." } }
```

```json
{ "error": { "code": "ENTRY_NOT_FOUND", "message": "Journal entry not found.", "requestId": "req_..." } }
```

`message` is always safe to display. Internal detail is logged server-side only, keyed by `requestId`.

### Status codes

| Code | Meaning |
|---|---|
| 200 | OK (read / update) |
| 201 | Created |
| 204 | No content (delete) |
| 400 | Validation failure |
| 401 | No or expired session |
| 403 | Authenticated but forbidden by policy |
| 404 | Not found — **also used for foreign-owned resources** (no existence leak) |
| 409 | Conflict (duplicate, stale version) |
| 422 | Semantically invalid (e.g., completing an empty entry) |
| 429 | Rate limited (`Retry-After` header) |
| 500 | Unexpected server error |
| 503 | Upstream unavailable (AI / STT / database) |

### Error codes (initial set)

`VALIDATION_FAILED` · `UNAUTHENTICATED` · `FORBIDDEN` · `ENTRY_NOT_FOUND` · `QUESTION_NOT_FOUND` · `ATTACHMENT_NOT_FOUND` · `ENTRY_EMPTY` · `ENTRY_TOO_LONG` · `DUPLICATE_EMAIL` · `INVALID_CREDENTIALS` · `MOOD_INVALID` · `AI_UNAVAILABLE` · `AI_INVALID_OUTPUT` · `AI_RATE_LIMITED` · `STT_UNAVAILABLE` · `REMINDER_NOT_CONSENTED` · `RATE_LIMITED` · `INTERNAL_ERROR`

---

## 2. Authentication — `/api/auth/*` (Better Auth)

Mounted as Better Auth's handler; consumes and issues the session cookie. **Custom UI calls these endpoints directly — no provider popups, no redirects.**

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/sign-up/email` | Register (name, email, password) |
| POST | `/api/auth/sign-in/email` | Log in |
| POST | `/api/auth/sign-out` | Invalidate session server-side |
| GET | `/api/auth/get-session` | Current session + user |
| POST | `/api/auth/change-password` | Change password |
| POST | `/api/auth/forget-password` | Begin reset |
| POST | `/api/auth/reset-password` | Complete reset |
| DELETE | `/api/auth/delete-user` | Delete account (cascades) |

Notes:
- `sign-up` also creates a `profiles` row in the same transaction.
- Errors are normalized to the envelope above; Better Auth raw shapes never reach the client.

---

## 3. Profile & Preferences

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/me` | Session user + profile + preferences |
| PATCH | `/api/v1/me/profile` | Update `display_name`, `avatar_url`, `bio`, `timezone` |
| PATCH | `/api/v1/me/preferences` | Update `default_language`, `ai_output_language`, `week_starts_on`, `theme_accent`, `autosave_enabled` |
| GET | `/api/v1/me/export` | Download all owned data (JSON) |

`PATCH /me/profile` body:
```json
{ "display_name": "Sami", "bio": "...", "timezone": "Asia/Karachi" }
```

---

## 4. Entries

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/entries` | List/search, user-scoped |
| POST | `/api/v1/entries` | Create a draft (or complete) entry |
| GET | `/api/v1/entries/:id` | Full detail: entry, answers, mood, generations, transcript |
| PATCH | `/api/v1/entries/:id` | Update text/title/language/date |
| POST | `/api/v1/entries/:id/complete` | Mark complete (rejects empty) |
| POST | `/api/v1/entries/:id/reopen` | Return to draft |
| DELETE | `/api/v1/entries/:id` | Soft delete |
| POST | `/api/v1/entries/:id/restore` | Restore within retention window |

`GET /api/v1/entries` query parameters:

| Param | Type | Notes |
|---|---|---|
| `q` | string | Full-text over title + original + final |
| `from` / `to` | date | Inclusive range on `entry_date` |
| `mood` | string[] | Repeatable, multi-select |
| `status` | `draft` \| `complete` | |
| `hasAi` | boolean | Has an approved generation |
| `sort` | `newest` \| `oldest` | Default `newest` |
| `cursor`, `limit` | | Pagination |

`POST /api/v1/entries` body:
```json
{ "entry_date": "2026-11-16", "title": null, "original_text": "", "language": "en" }
```
Response `201` returns the created entry. Multiple calls with the same `entry_date` create distinct entries by design.

**Invariant:** `PATCH` never mutates `original_text` once non-empty. Attempting to do so returns `409` with `code: "IMMUTABLE_FIELD"` (add to error set).

---

## 5. Calendar

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/calendar/:year/:month` | Month aggregate |
| GET | `/api/v1/calendar/:date` | Day detail |

Month aggregate response:
```json
{
  "data": {
    "year": 2026,
    "month": 11,
    "days": [
      { "date": "2026-11-16", "entryCount": 2, "hasDraft": true,
        "moods": ["happy"], "hasAi": true }
    ]
  },
  "meta": { "requestId": "req_..." }
}
```
One request per month — the calendar must never fan out per day.

---

## 6. Questions & Answers

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/questions` | System questions + the caller's custom questions |
| POST | `/api/v1/questions` | Create a custom question |
| PATCH | `/api/v1/questions/:id` | Update own custom question |
| DELETE | `/api/v1/questions/:id` | Deactivate (soft) |
| GET | `/api/v1/entries/:id/answers` | Answers for an entry |
| PUT | `/api/v1/entries/:id/answers` | Batch upsert |

`PUT` body:
```json
{ "answers": [
  { "question_id": "uuid", "answer_text": "..." },
  { "question_id": "uuid", "is_skipped": true }
] }
```
Upsert is atomic: either all answers in the batch persist or none do. `answer_text` and `is_skipped` are mutually exclusive.

---

## 7. Moods

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/moods` | Range query (`from`, `to`) |
| PUT | `/api/v1/entries/:id/mood` | Set/replace the entry's mood |
| DELETE | `/api/v1/entries/:id/mood` | Remove mood |
| GET | `/api/v1/moods/distribution` | Aggregated counts by mood (`from`, `to`) |

`PUT` body: `{ "mood": "calm|...", "intensity": 3, "note": "..." }` — `mood` must be one of the ten allowed values; anything else returns `400 MOOD_INVALID`.

---

## 8. Voice

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/transcriptions` | Persist a browser-produced transcript |
| GET | `/api/v1/transcriptions/:id` | Retrieve a transcript |
| POST | `/api/v1/voice/transcribe` | **Fallback only** — upload audio, receive text |

`POST /api/v1/transcriptions` body:
```json
{ "text": "...", "language": "ur", "provider": "browser",
  "duration_ms": 45000, "entry_id": null }
```
Transcripts are immutable; there is no `PATCH`. Editing happens in the UI before saving a *new* transcript or before approving AI output.

`POST /api/v1/voice/transcribe` — `multipart/form-data` (`audio` file, `language`). Returns `{ "text": "...", "provider": "server" }`. Returns `503 STT_UNAVAILABLE` when unconfigured, so the UI can fall back cleanly.

---

## 9. AI

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/ai/generate` | Generate a structured entry from text or a transcript |
| POST | `/api/v1/ai/generations/:id/regenerate` | New generation from the same source |
| POST | `/api/v1/ai/generations/:id/approve` | Explicitly apply to the entry |
| GET | `/api/v1/ai/generations` | List versions (`entry_id`) |
| POST | `/api/v1/ai/reflect` | PLUS — reflection over a date range |
| POST | `/api/v1/ai/ask` | PLUS — question over the user's journal |

`POST /api/v1/ai/generate` body:
```json
{ "entry_id": "uuid", "source_type": "text",
  "source_text": "...", "output_language": "match" }
```

Response (persisted immediately, **not** applied):
```json
{ "data": { "generation": {
  "id": "uuid", "is_approved": false, "language": "en",
  "output_markdown": "...",
  "output_json": { "overview": "...", "activities": [], "achievements": [],
                   "challenges": [], "lessons": [], "reflections": [],
                   "tomorrow_goals": [] },
  "model": "...", "provider": "...", "prompt_version": "v1" } } }
```

`POST .../approve` body: `{ "apply_to": "final", "edited_markdown": "..." }` — the only path that writes `final_text`.

Guarantees:
- Never overwrites `original_text`.
- Never auto-applies. Approval is a separate mutation.
- Append-only history; regenerating adds a row.
- `503 AI_UNAVAILABLE` / `502 AI_INVALID_OUTPUT` (or `422`) with a retryable message on failure — no partial DB write.

---

## 10. Insights

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/insights/overview` | Totals, current/longest streak, completion rate |
| GET | `/api/v1/insights/activity?period=week\|month` | Bucketed entry counts |
| GET | `/api/v1/insights/moods?from&to` | Distribution + top emotions |

All responses are computed from the caller's rows only. Zero-data returns zeroed structures, never fabricated values.

---

## 11. Reminders

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/reminders` | Current settings |
| PUT | `/api/v1/reminders` | Update settings (records `consent_at` when enabling) |
| POST | `/api/v1/reminders/consent` | Record granted browser permission |
| POST | `/api/v1/reminders/dispatch` | Internal cron (requires `CRON_SECRET`) |

`PUT` rejects `enabled: true` without consent → `403 REMINDER_NOT_CONSENTED`.

---

## 12. Attachments (PLUS)

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/entries/:id/attachments` | Upload (size + MIME validated) |
| GET | `/api/v1/entries/:id/attachments` | List with short-lived signed URLs |
| DELETE | `/api/v1/attachments/:id` | Delete |

Signed URLs expire in minutes; no permanent public URL is ever returned or stored.

---

## 13. System

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Liveness + database reachability |

Response: `{ "data": { "status": "ok", "db": "ok", "version": "..." } }`. Never exposes configuration values.

---

## 14. Cross-Cutting Rules

1. **Ownership on every request.** Handlers receive `{ userId }` from the session and pass it into the repository call. A row fetched by ID alone is a defect.
2. **Foreign ID → `404`.** Never `403` — that would confirm existence.
3. **Validation before logic.** Shared schema validates body, params and query; failures return `400 VALIDATION_FAILED` with field paths.
4. **Rate limits.** Auth, AI, voice and search are limited per IP and per user; responses carry `Retry-After`.
5. **No secrets in responses.** Provider names and model identifiers are allowed; keys, prompts and internal URLs are not.
6. **Request IDs** are attached to every response and log line.
7. **Breaking changes** require a version bump; `/api/v1` is frozen once documented consumers exist.

---

## 15. Open Items

- ~~D1 (framework)~~ — **resolved**: NestJS 12.5.0 controllers with `@nestjs/swagger`-generated OpenAPI. The contract above is unaffected by the choice.
- Cursor format, rate-limit ceilings and retention window length are finalized during implementation and recorded here.
- The proxy must strip any client-supplied internal headers before forwarding to the API; this is a security requirement, not an optimization.
