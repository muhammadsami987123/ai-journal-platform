# Documentation Index

> **Status:** Architecture phase — documents describe the intended system. No implementation exists yet.
> **Rule:** `docs/` is the single source of truth for *what* we are building. `reports/` records *how it is going*. Never duplicate content between the two — reports link back to these documents.

---

## Reading Order

If you are new to the project, read in this order:

1. [`PLAN.md`](PLAN.md) — why the product exists and the complete feature specification.
2. [`TECH_STACK.md`](TECH_STACK.md) — verified versions, peer constraints, frontend and auth topology decisions.
3. [`REQUIREMENTS.md`](REQUIREMENTS.md) — the same intent, expressed as testable FR/NFR identifiers.
4. [`ARCHITECTURE.md`](ARCHITECTURE.md) — how the system is shaped and where responsibility sits.
5. [`DATABASE_SCHEMA.md`](DATABASE_SCHEMA.md) — the data model everything else depends on.
6. [`API_DOCUMENTATION.md`](API_DOCUMENTATION.md) — the contract between frontend and backend.
7. [`UI_UX_GUIDELINES.md`](UI_UX_GUIDELINES.md) — the visual and interaction system.
8. [`AI_INTEGRATION.md`](AI_INTEGRATION.md) — how AI is used safely and predictably.
9. [`VOICE_JOURNAL.md`](VOICE_JOURNAL.md) — the speech-to-journal pipeline.
10. [`TASKS.md`](TASKS.md) — the build order with acceptance criteria.
11. [`DEVELOPMENT_GUIDELINES.md`](DEVELOPMENT_GUIDELINES.md) — how to work in this repository.
12. [`RELEASING.md`](RELEASING.md) — versioning, tags, release notes and changelog maintenance.

---

## Document Register

| File | Kind | Owner concern | Changes when |
|---|---|---|---|
| `PLAN.md` | Product specification | Product | Scope changes |
| `TASKS.md` | Execution plan | Engineering | Work is planned or re-sequenced |
| `REQUIREMENTS.md` | Requirement register | Product + QA | A requirement is added, split or dropped |
| `ARCHITECTURE.md` | System design | Engineering | A boundary or layer changes |
| `DATABASE_SCHEMA.md` | Data model | Backend | A migration is introduced |
| `API_DOCUMENTATION.md` | Interface contract | Backend + Frontend | An endpoint or payload changes |
| `UI_UX_GUIDELINES.md` | Design system | Design + Frontend | A token, component or pattern changes |
| `AI_INTEGRATION.md` | AI specification | Backend | Prompt, model or output contract changes |
| `VOICE_JOURNAL.md` | Feature specification | Backend + Frontend | The voice pipeline changes |
| `DEVELOPMENT_GUIDELINES.md` | Engineering standards | Engineering | Conventions evolve |
| `TECH_STACK.md` | Verified versions and constraints | Engineering | A dependency is pinned or upgraded |
| `RELEASING.md` | Release process | Engineering | Versioning, tagging or release rules change |

---

## Conventions

- **Markdown only.** No binary documents in `docs/` unless unavoidable; screenshots live in `apps/web/public/images/` or a report folder and are linked.
- **Stable identifiers.** Requirements use `FR-###` / `NFR-###`; tasks use `T#.#`; endpoints use `METHOD /api/v1/resource`. Never renumber — deprecate instead.
- **One fact, one home.** The schema is defined in `DATABASE_SCHEMA.md`; other documents reference it rather than restating it.
- **Status headers.** Every document states its current maturity (Design / In progress / Implemented / Deprecated).
- **No secrets, no credentials, no real user data** — not even in examples.

---

## Relationship to `reports/`

| Question | Answered by |
|---|---|
| What should the product do? | `docs/` |
| How is it built? | `docs/ARCHITECTURE.md` |
| What is done so far? | `reports/progress/` |
| What broke and why? | `reports/bugs/` |
| Did it pass? | `reports/testing/` |
| What was reviewed? | `reports/reviews/` |
| What did we ship this week? | `reports/implementation/` |

See [`../reports/README.md`](../reports/README.md).
