# Reports

> **Purpose:** a dated, append-only record of how the build is actually going.
> **Not** a place for specifications — those live in [`../docs/`](../docs/).

---

## Why this folder is separate from `docs/`

`docs/` answers *"what are we building and how is it designed?"* — it is edited as the design evolves, and it always describes the current intended state.

`reports/` answers *"what happened, when, and what did we find?"* — it is history. A report is written once and never rewritten. If something changes, a new report supersedes it.

Mixing the two destroys the audit trail: you can no longer tell whether a document describes the plan or the outcome.

---

## Structure

| Folder | Holds | Written when |
|---|---|---|
| [`progress/`](progress/) | Phase progress, milestone status, what is next | End of a phase or week |
| [`testing/`](testing/) | Verification results mapped to requirements | After each verification pass |
| [`bugs/`](bugs/) | Defects: reproduction, impact, root cause, resolution | On discovery, updated with the fix reference |
| [`reviews/`](reviews/) | Code and architecture reviews, decision records | After a review or a decision is made |
| [`implementation/`](implementation/) | What was built, where, and how it was verified | When a feature or structural change lands |

---

## File Naming

```text
YYYY-MM-DD-<slug>.md
```

Examples:

```text
progress/2026-11-20-phase-1-schema-complete.md
testing/2026-11-22-auth-verification.md
bugs/2026-11-23-calendar-month-boundary.md
reviews/2026-11-24-framework-decision.md
implementation/2026-11-16-folder-structure-report.md
```

One report per event. Never overwrite a report with a newer one — create a new file that references the old.

---

## Report Template

```markdown
# <Title>

- **Date:** YYYY-MM-DD
- **Phase / Task:** T#.#
- **Author:** <name>
- **Status:** Open | Resolved | Superseded by <file>

## Summary
Two or three sentences: what this report covers.

## Detail
Facts, evidence, commands run, results observed.

## Impact
What this changes for the project, if anything.

## Next Steps
Concrete, assigned actions.
```

---

## Rules

1. **Facts only.** No speculation presented as a result.
2. **Evidence included.** Command output, test names, screenshots — the reader must be able to verify.
3. **No secrets, no real journal content.** Redact credentials, tokens and personal text.
4. **Always dated.** An undated report is not a report.
5. **Link, don't copy.** Reference `docs/` documents instead of restating them.
6. **Append-only.** Corrections are new files.

---

## Relationship to Documents

| Question | Answered by |
|---|---|
| What should the system do? | `docs/PLAN.md`, `docs/REQUIREMENTS.md` |
| How is it designed? | `docs/ARCHITECTURE.md`, `docs/DATABASE_SCHEMA.md` |
| Is it done? | `reports/testing/` |
| What is left? | `reports/progress/` |
| Why did we choose this? | `reports/reviews/` |
| What changed? | `reports/implementation/` |
