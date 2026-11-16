# Voice Journal

> **Status:** Design phase — workflow specification. No recording, transcription or waveform code exists yet.
> **Scope:** `apps/web/src/features/voice/` (capture, waveform, review UI) + `apps/api/src/modules/voice/` (transcript persistence) + `apps/api/src/integrations/stt/` (optional fallback).

---

## 1. Purpose

The user should never be forced to type. Speaking naturally must produce a journal of the same quality as writing it — with the user's own words preserved and the AI only organizing them.

---

## 2. End-to-End Workflow

```text
1. User selects a date (today by default)
2. User presses the microphone
3. Browser asks for permission (first time only)
4. Recording starts; waveform responds to real amplitude; timer runs
5. Speech is transcribed live (interim) then finalized
6. User reviews and may edit the transcript (non-destructive to the saved original)
7. Transcript is persisted as an immutable record
8. AI generates structured journal content from the transcript
9. User reviews: original | generated | apply
10. User approves → final entry is saved
```

Failure at any step leaves all prior steps intact. Nothing in step 8–10 can destroy the transcript from step 7.

---

## 3. Capture Strategy

| Concern | Decision |
|---|---|
| Primary STT | Browser Speech Recognition (`SpeechRecognition` / `webkitSpeechRecognition`) |
| Fallback STT | Server endpoint `POST /api/v1/voice/transcribe` when the browser is unsupported or accuracy is unacceptable |
| Audio retention | Raw audio is not stored in v1; only text is retained |
| Permission | Requested only on explicit press of the mic button, never on page load |
| Language | Selected before recording; defaults from `preferences.default_language` |

Reasoning: browser STT keeps audio on-device (a privacy advantage for a diary) and costs nothing; the server fallback exists because support is uneven across browsers.

---

## 4. Browser Support Matrix

| Browser | Speech recognition | Behaviour |
|---|---|---|
| Chrome / Edge (desktop + Android) | Yes | Primary path |
| Firefox | No | Manual text path + clear message; server fallback if configured |
| Safari (macOS / iOS) | Partial / inconsistent | Feature-detect at runtime; never assume |
| In-app webviews | Usually no | Same as Firefox path |

**Rule:** capability is detected at runtime, not inferred from the user agent. The unsupported state must be a designed screen, not a broken button.

---

## 5. Permission States

| State | UI |
|---|---|
| Not yet requested | Mic enabled, with a one-line explanation of what will happen |
| Granted | Recording proceeds |
| Denied | Explains the denial, shows how to re-enable in browser settings, offers typing |
| Dismissed / blocked by policy | Same as denied, without implying the user did something wrong |
| No device / no input | Explains no microphone was found, offers typing |

No silent failures. No repeated permission prompts after denial.

---

## 6. Recording Controls

| Control | Behaviour |
|---|---|
| Start | Begins capture; button changes to stop |
| Stop | Finalizes the transcript |
| Pause / Resume | Only when the platform supports it; otherwise hidden, not disabled-and-mysterious |
| Timer | Elapsed time, tabular figures |
| Cancel | Discards the session with confirmation if text was captured |
| Waveform | Live amplitude from the Web Audio API — **not** a decorative loop |

---

## 7. Waveform Specification

- Driven by real analyser data (frequency or time domain).
- Idle: flat with a slow breathing line.
- Recording: bars/hills react to amplitude, no clipping artefacts.
- Reduced motion: amplitude indicated by a subtle opacity pulse only.
- Must not block the main thread or cause layout shift (fixed-height canvas).

---

## 8. Transcript Handling

- Interim results render live in a muted style; finalized text replaces them.
- The user can edit the transcript before generating.
- On save, the transcript is written to `transcriptions` (see [`DATABASE_SCHEMA.md`](DATABASE_SCHEMA.md) §3.7) and is **immutable** thereafter.
- If the user edits after saving, that produces a **new** transcript record rather than mutating the old one.
- Language tag is stored so the AI and the UI can honour direction (RTL).

---

## 9. AI Handoff

Transcript text is passed to the generation endpoint with `source_type: "transcription"` and `source_ref_id` set. Everything in [`AI_INTEGRATION.md`](AI_INTEGRATION.md) applies, in particular:

- No invented detail.
- No overwriting the transcript.
- Approval required before the entry changes.

The review screen shows three panes: **original transcript**, **generated journal**, **final entry (editable)**.

---

## 10. Data Model Touchpoints

| Table | Role |
|---|---|
| `transcriptions` | Immutable record of what was said |
| `ai_generations` | Structured output derived from it (`source_type = transcription`) |
| `entries` | `original_text` (typed) and `final_text` (approved), linked via `ai_generation_id` |

Deleting an entry must not delete its transcript — `transcriptions.entry_id` is `ON DELETE SET NULL` precisely so the memory survives.

---

## 11. Privacy

- Browser STT keeps audio local to the device; this is the default for that reason.
- The server fallback uploads audio over HTTPS to the configured provider; this must be disclosed at the point of use, and audio must not be retained after transcription.
- Transcripts are personal data: never logged, never included in error reports, never sent anywhere except the configured LLM for generation.

---

## 12. Accessibility

- All controls keyboard operable and labelled.
- State changes (started, stopped, permission denied, transcribing, ready) announced via a live region.
- Waveform is decorative for assistive tech (`aria-hidden`) with a textual status alternative.
- Pause/resume does not require precise pointing.

---

## 13. Acceptance Criteria

- [ ] Mic permission requested only on explicit action.
- [ ] Denied permission shows guidance and an alternative path.
- [ ] Unsupported browser shows a designed fallback, not an error.
- [ ] Waveform reflects real amplitude and respects reduced motion.
- [ ] 30-second English utterance produces a usable transcript.
- [ ] Urdu selection produces Urdu-script output.
- [ ] Transcript edit before save is preserved exactly.
- [ ] Saved transcript is immutable and survives an entry delete.
- [ ] Generation from a transcript never alters the transcript text.
- [ ] Approval is required before the entry is saved.
- [ ] No audio or transcript appears in any log.

---

## 14. Open Items

| ID | Item |
|---|---|
| D4 | Whether the server STT fallback ships in v1 or is deferred |
| V1 | Language list and mapping (browser locale vs. BCP-47) |
| V2 | Max recording duration and transcript length ceiling |
| V3 | Whether raw audio should ever be retained (currently: no) |
