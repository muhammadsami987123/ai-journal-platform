# AI Integration

> **Status:** Design phase — specification only. No provider is configured and no prompt exists yet.
> **Owner:** `apps/api/src/modules/ai/` (policy) + `apps/api/src/integrations/llm/` (provider client). `apps/web` only ever receives validated output.

---

## 1. Role of AI in the Product

AI is an **organizer, not an author**. It restructures what the user already wrote or said into a readable journal, and — only in later phases — reflects on existing entries that the user explicitly chose to analyze.

It must never:
- Invent events, people, feelings, achievements or dates.
- Overwrite the user's own words.
- Save anything without explicit approval.
- Behave as a general chatbot inside the journaling flow.

---

## 2. Provider Abstraction

```text
apps/api/src/integrations/llm/
├── client.ts        request/response transport, timeouts, retries
├── provider.ts      provider selection from env (openai-compatible by default)
└── index.ts         generateJournal / regenerate / reflect / answerFromJournal
```

Configuration (see `../.env.example`):

| Variable | Purpose |
|---|---|
| `LLM_PROVIDER` | Adapter name |
| `LLM_BASE_URL` | Endpoint base |
| `LLM_API_KEY` | Server-only secret |
| `LLM_MODEL` | Model identifier |
| `LLM_MAX_INPUT_TOKENS` | Hard input ceiling |
| `LLM_TIMEOUT_MS` | Per-request timeout |
| `PROMPT_VERSION` | Stamped onto every generation row |

**Rule:** swapping providers or models must require **zero code changes** in `modules/ai/` and none in the frontend. The UI never learns which provider is in use.

---

## 3. Operations

| Operation | Input | Output | Phase |
|---|---|---|---|
| `generateJournal` | Free text **or** transcript id | Structured JSON + markdown | Core |
| `regenerate` | Same source, optional instruction | New generation row | Core |
| `reflect` | Date range over user's entries | Themes, achievements, challenges, lessons | PLUS |
| `answerFromJournal` | Natural-language question | Answer + cited entry ids | PLUS |

---

## 4. Output Contract

Every journal generation returns **strict JSON**, validated before persistence:

```json
{
  "overview": "One short paragraph summarising the day.",
  "activities": ["..."],
  "achievements": ["..."],
  "challenges": ["..."],
  "lessons": ["..."],
  "reflections": ["..."],
  "tomorrow_goals": ["..."],
  "language": "en"
}
```

Rules:
- All eight keys required; arrays may be empty but never absent.
- Empty array rather than an invented filler item.
- `language` is the detected/declared language of the output.
- Validation failure → one automatic repair attempt → `502 AI_INVALID_OUTPUT`. Nothing invalid reaches the database.
- Markdown is rendered **from** the JSON server-side, so display and storage can never diverge.

---

## 5. Prompt Requirements

The system prompt must state, explicitly:

1. Use only information present in the source text.
2. Do not add events, names, emotions, causes or conclusions that are not implied by the source.
3. Keep the writer's voice, tone and register; do not formalize casual language or dramatize neutral events.
4. Keep names, places, products and numbers exactly as written.
5. Answer in the source language unless a different output language was requested.
6. Produce the fixed JSON schema; no prose outside it.
7. If the source is too short to fill a section, return an empty array — do not speculate.
8. Do not moralize, advise or add motivational commentary.

**Style preservation** (plan §9, "maintain the user's writing style where possible") is an explicit acceptance criterion, not a nice-to-have: the review step must be tested with a casual, a formal and a non-English sample, and the output must not shift register.

Prompts are versioned; `prompt_version` is stored on every generation so output can be traced to the contract that produced it.

---

## 6. Non-Negotiable Guarantees

| # | Guarantee | Enforcement |
|---|---|---|
| G1 | `entries.original_text` is never modified by AI | Server rejects writes to the column after first save |
| G2 | Generating does not change the entry | `ai_generations` insert is the only write |
| G3 | Applying output requires an explicit approval mutation | Separate endpoint; `is_approved` flag |
| G4 | Every prior version is retained | Append-only table |
| G5 | Translation is additive, never destructive | `is_translation` flag; original kept |
| G6 | Failure produces no partial state | Generation persisted only after validation; transaction around apply |
| G7 | The user reviews before the journal changes | UI cannot skip the review step |

---

## 7. Multilingual Behaviour

- Input may be English, Urdu, Hindi, mixed-script, or romanized.
- Default output language: **match the input** (`ai_output_language = "match"`).
- Explicit translation is a separate user choice; the result is marked `is_translation = true` and shown beside the original.
- Romanized Urdu (Latin script) should stay romanized unless translation is requested — transliterating to script is a change of the user's text and is not permitted implicitly.
- RTL output must be renderable; the contract carries the language code so the UI can set direction.

---

## 8. Cost, Latency & Abuse Controls

| Control | Rule |
|---|---|
| Input ceiling | `LLM_MAX_INPUT_TOKENS`; longer inputs are rejected with a clear message, never silently truncated |
| Timeout | `LLM_TIMEOUT_MS`, no unbounded waits |
| Retries | At most one repair retry on invalid output; no blind retries on timeout |
| Rate limit | Per user per minute; `429` + `Retry-After` |
| Concurrency | One in-flight generation per entry |
| Logging | Request id, model, tokens, latency, outcome — **never** the journal text or transcript |
| Fallback | Provider unavailable → `503 AI_UNAVAILABLE`; the user's draft is untouched |

---

## 9. Persistence

Every generation writes exactly one `ai_generations` row (see [`DATABASE_SCHEMA.md`](DATABASE_SCHEMA.md) §3.8):

- `source_type` (`text` | `transcription`) and `source_ref_id`
- `output_json` (validated), `output_markdown` (rendered)
- `model`, `provider`, `prompt_version`, `language`, `is_translation`
- `tokens_in`, `tokens_out`
- `is_approved`, `approved_at` (set only by the approval endpoint)

Approval then, and only then:
1. Sets `entries.final_text` (and `ai_generation_id`).
2. Marks the generation `is_approved` with a timestamp.
3. Leaves `original_text` and any transcript untouched.

---

## 10. Testing Requirements

- **No-fabrication test:** a source with exactly three facts must yield output containing those three and no new ones.
- **Style test:** casual / formal / non-English samples retain register.
- **Language test:** Urdu source with `match` produces Urdu output; with `translate: en`, output is English and `is_translation = true`.
- **Schema test:** malformed model output is rejected and never persisted.
- **Immutability test:** after two generations, `original_text` is byte-identical.
- **Approval test:** closing the review without approving leaves `final_text` unchanged.

---

## 11. PLUS Phase Notes

- **AI Personal Reflection:** batch input over a date range; output stored in `reflections`; clearly labelled as interpretation; opt-in per request; rate-limited.
- **Talk to Your Journal:** retrieval over the user's own entries (date filter + keyword, optionally embeddings), answers must cite real entry ids, and an unsupported question yields an explicit refusal ("I don't see that in your journal"). Retrieval strategy depends on open decision **D7**.

---

## 12. Open Items

| ID | Item |
|---|---|
| D3 | Provider and model selection (cost, latency, multilingual quality) |
| D7 | Search/retrieval strategy for talk-to-journal |
| A1 | Prompt files location (`apps/api/src/modules/ai/prompts/`) and version naming |
| A2 | Token budget per operation and embedding strategy, if any |
